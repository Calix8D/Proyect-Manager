import io
import pandas as pd
from app.database import get_connection

# Caracteres con los que Excel/LibreOffice interpretan una celda como fórmula.
_FORMULA_TRIGGERS = ("=", "+", "-", "@", "\t", "\r")


def _sanitize_cell(value):
    """Neutraliza inyección de fórmulas: si un texto empieza por un carácter
    peligroso, se antepone un apóstrofo para que Excel lo trate como texto."""
    if isinstance(value, str) and value and value[0] in _FORMULA_TRIGGERS:
        return "'" + value
    return value


def user_can_access_project(project_id: int, user_id: int, user_role: str) -> bool:
    """True si el usuario es miembro del proyecto (o admin global)."""
    if user_role == "admin":
        return True
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM project_members WHERE project_id = %s AND user_id = %s",
                (project_id, user_id),
            )
            return cur.fetchone() is not None


def get_project_summary(project_id: int) -> dict | None:
    """Totales de tareas y % de avance del proyecto."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    COUNT(*)                                                    AS total,
                    SUM(CASE WHEN status = 'done'        THEN 1 ELSE 0 END)    AS completed,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)    AS in_progress,
                    SUM(CASE WHEN status = 'review'      THEN 1 ELSE 0 END)    AS in_review,
                    SUM(CASE WHEN status = 'todo'        THEN 1 ELSE 0 END)    AS pending
                FROM tasks
                WHERE project_id = %s
                """,
                (project_id,),
            )
            row = cur.fetchone()

            cur.execute("SELECT name FROM projects WHERE id = %s", (project_id,))
            project = cur.fetchone()

    if not project:
        return None

    total = int(row["total"]) if row["total"] else 0
    completed = int(row["completed"]) if row["completed"] else 0

    return {
        "project_id":      project_id,
        "project_name":    project["name"],
        "total_tasks":     total,
        "completed":       completed,
        "in_progress":     int(row["in_progress"]) if row["in_progress"] else 0,
        "in_review":       int(row["in_review"])   if row["in_review"]   else 0,
        "pending":         int(row["pending"])      if row["pending"]      else 0,
        "progress_percent": round((completed / total) * 100) if total > 0 else 0,
    }


def get_project_workload(project_id: int) -> list:
    """Cantidad de tareas asignadas por miembro, filtradas al proyecto."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    u.id,
                    u.name,
                    u.email,
                    COUNT(ta.task_id)                                           AS total_assigned,
                    SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END)         AS completed,
                    SUM(CASE WHEN t.status != 'done' THEN 1 ELSE 0 END)        AS pending
                FROM project_members pm
                INNER JOIN users u ON u.id = pm.user_id
                LEFT JOIN tasks t ON t.project_id = %s
                LEFT JOIN task_assignments ta ON ta.task_id = t.id AND ta.user_id = u.id
                WHERE pm.project_id = %s
                GROUP BY u.id, u.name, u.email
                ORDER BY total_assigned DESC
                """,
                (project_id, project_id),
            )
            return [dict(row) for row in cur.fetchall()]


def get_overdue_tasks(project_id: int) -> list:
    """Tareas vencidas: due_date anterior a hoy y estado distinto de done."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    t.id,
                    t.title,
                    t.priority,
                    t.due_date,
                    t.status,
                    u.name                          AS created_by_name,
                    STRING_AGG(us.name, ', ')        AS assignees
                FROM tasks t
                LEFT JOIN users u  ON u.id  = t.created_by
                LEFT JOIN task_assignments ta ON ta.task_id = t.id
                LEFT JOIN users us ON us.id = ta.user_id
                WHERE t.project_id = %s
                  AND t.due_date < CURRENT_DATE
                  AND t.status   != 'done'
                GROUP BY t.id, t.title, t.priority, t.due_date, t.status, u.name
                ORDER BY t.due_date ASC
                """,
                (project_id,),
            )
            return [dict(row) for row in cur.fetchall()]


def export_project_excel(project_id: int) -> tuple[bytes, str]:
    """Genera un archivo .xlsx con todas las tareas del proyecto."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    t.id,
                    t.title                         AS "Título",
                    t.description                   AS "Descripción",
                    t.status                        AS "Estado",
                    t.priority                      AS "Prioridad",
                    t.due_date                      AS "Fecha límite",
                    u.name                          AS "Creado por",
                    STRING_AGG(us.name, ', ')        AS "Asignados",
                    t.created_at                    AS "Creado el"
                FROM tasks t
                LEFT JOIN users u ON u.id = t.created_by
                LEFT JOIN task_assignments ta ON ta.task_id = t.id
                LEFT JOIN users us ON us.id = ta.user_id
                WHERE t.project_id = %s
                GROUP BY t.id, t.title, t.description, t.status, t.priority,
                         t.due_date, u.name, t.created_at
                ORDER BY t.created_at
                """,
                (project_id,),
            )
            rows = cur.fetchall()

            cur.execute("SELECT name FROM projects WHERE id = %s", (project_id,))
            project = cur.fetchone()

    df = pd.DataFrame([dict(r) for r in rows])
    df.drop(columns=["id"], inplace=True, errors="ignore")

    # Sanitiza las columnas de texto contra inyección de fórmulas antes de exportar.
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].map(_sanitize_cell)

    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Tareas")

        worksheet = writer.sheets["Tareas"]
        for col in worksheet.columns:
            max_len = max(len(str(cell.value or "")) for cell in col)
            worksheet.column_dimensions[col[0].column_letter].width = min(max_len + 4, 50)

    project_name = project["name"] if project else f"proyecto_{project_id}"
    return buffer.getvalue(), project_name
