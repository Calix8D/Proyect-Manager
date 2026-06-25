from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.services.report_generator import (
    get_project_summary,
    get_project_workload,
    export_project_excel,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/project/{project_id}/summary")
def summary(project_id: int):
    """Resumen de avance: totales por estado y % completado."""
    data = get_project_summary(project_id)
    if not data:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return {"success": True, "data": data}


@router.get("/project/{project_id}/workload")
def workload(project_id: int):
    """Carga de trabajo por miembro del proyecto."""
    data = get_project_workload(project_id)
    return {"success": True, "data": data}


@router.get("/project/{project_id}/export")
def export_excel(project_id: int):
    """Descarga un .xlsx con todas las tareas del proyecto."""
    file_bytes, project_name = export_project_excel(project_id)

    filename = f"reporte_{project_name.replace(' ', '_')}.xlsx"
    return Response(
        content=file_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
