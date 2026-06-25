import io
import pandas as pd
from app.database import get_connection


def get_project_summary(project_id: int) -> dict:
    """Totales de tareas y % de avance del proyecto."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    COUNT(*)                                                      AS total,
                    SUM(CASE WHEN status = 'done'        THEN 1 ELSE 0 END)      AS completed,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)      AS in_progress,
                    SUM(CASE WHEN status = 'review'      THEN 1 ELSE 0 END)      AS in_review,
                    SUM(CASE WHEN status = 'todo'        THEN 1 ELSE 0 END)      AS pending
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
        progress = round((completed / total) * 100) if total > 0 else 0

        return {
            "project_id": project_id,
            "project_name": project["name"],
            "total_tasks": total,
            "completed": completed,
            "in_progress": int(row["in_progress"]) if row["in_progress"] else 0,
            "in_review": int(row["in_review"]) if row["in_review"] else 0,
            "pending": int(row["pending"]) if row["pending"] else 0,
            "progress_percent": progress,
        }
    finally:
        conn.close()


def get_project_workload(project_id: int) -> list:
    """Cantidad de tareas asignadas por miembro."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    u.id,
                    u.name,
                    u.email,
                    COUNT(ta.task_id)                                             AS total_assigned,
                    SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END)           AS completed,
                    SUM(CASE WHEN t.status != 'done' THEN 1 ELSE 0 END)          AS pending
                FROM project_members pm
                INNER JOIN users u ON u.id = pm.user_id
                LEFT JOIN task_assignments ta ON ta.user_id = u.id
                LEFT JOIN tasks t ON t.id = ta.task_id AND t.project_id = %s
                WHERE pm.project_id = %s
                GROUP BY u.id, u.name, u.email
                ORDER BY total_assigned DESC
                """,
                (project_id, project_id),
            )
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()


def export_project_excel(project_id: int) -> bytes:
    """Genera un archivo .xlsx con todas las tareas del proyecto."""
    conn = get_connection()
    try:
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

        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Tareas")

            # Ajusta el ancho de las columnas automáticamente
            worksheet = writer.sheets["Tareas"]
            for col in worksheet.columns:
                max_len = max(len(str(cell.value or "")) for cell in col)
                worksheet.column_dimensions[col[0].column_letter].width = min(max_len + 4, 50)

        return buffer.getvalue(), project["name"] if project else f"proyecto_{project_id}"
    finally:
        conn.close()
