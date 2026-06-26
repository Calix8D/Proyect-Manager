from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from app.auth import verify_token
from app.services.report_generator import (
    get_project_summary,
    get_project_workload,
    get_overdue_tasks,
    export_project_excel,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/project/{project_id}/summary")
def summary(project_id: int, _user: dict = Depends(verify_token)):
    """Resumen de avance: totales por estado y % completado."""
    try:
        data = get_project_summary(project_id)
        if not data:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener el resumen") from e


@router.get("/project/{project_id}/workload")
def workload(project_id: int, _user: dict = Depends(verify_token)):
    """Carga de trabajo por miembro del proyecto."""
    try:
        data = get_project_workload(project_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener la carga de trabajo") from e


@router.get("/project/{project_id}/overdue")
def overdue(project_id: int, _user: dict = Depends(verify_token)):
    """Tareas vencidas: fecha límite pasada y sin completar."""
    try:
        data = get_overdue_tasks(project_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener tareas vencidas") from e


@router.get("/project/{project_id}/export")
def export_excel(project_id: int, _user: dict = Depends(verify_token)):
    """Descarga un .xlsx con todas las tareas del proyecto."""
    try:
        file_bytes, project_name = export_project_excel(project_id)
        filename = f"reporte_{project_name.replace(' ', '_')}.xlsx"
        return Response(
            content=file_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al generar el Excel") from e
