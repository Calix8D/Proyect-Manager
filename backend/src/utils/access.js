const { query } = require('../config/database');

// Verifica que el usuario sea miembro del proyecto. Un admin global tiene acceso a todo.
async function assertProjectMember(projectId, userId, userRole) {
  if (userRole === 'admin') return;

  const result = await query(
    'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );

  if (result.recordset.length === 0) {
    throw { status: 403, message: 'No tienes acceso a este proyecto' };
  }
}

// Devuelve el project_id de una tarea, o lanza 404 si no existe.
async function getTaskProjectId(taskId) {
  const result = await query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
  if (!result.recordset[0]) throw { status: 404, message: 'Tarea no encontrada' };
  return result.recordset[0].project_id;
}

module.exports = { assertProjectMember, getTaskProjectId };
