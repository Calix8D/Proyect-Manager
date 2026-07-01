const { query } = require('../config/database');

// Roles de proyecto ordenados de menor a mayor privilegio.
// viewer = solo lectura · member = escritura de tareas/comentarios · leader = todo lo de member.
const PROJECT_ROLE_RANK = { viewer: 1, member: 2, leader: 3 };

// Devuelve el rol del usuario dentro del proyecto, o null si no es miembro.
// Un admin global se considera 'leader' (máximo privilegio a nivel de proyecto).
async function getProjectRole(projectId, userId, userRole) {
  if (userRole === 'admin') return 'leader';

  const result = await query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );

  return result.recordset[0]?.role ?? null;
}

// Acceso de LECTURA: basta con ser miembro (cualquier rol) o admin global.
// Devuelve el rol efectivo para que quien llame pueda afinar decisiones si lo necesita.
async function assertProjectMember(projectId, userId, userRole) {
  const role = await getProjectRole(projectId, userId, userRole);

  if (!role) {
    throw { status: 403, message: 'No tienes acceso a este proyecto' };
  }

  return role;
}

// Acceso de ESCRITURA: requiere un rol mínimo dentro del proyecto.
// Por defecto exige 'member', de modo que un 'viewer' queda restringido a solo lectura.
async function assertProjectRole(projectId, userId, userRole, minRole = 'member') {
  const role = await assertProjectMember(projectId, userId, userRole);

  if (PROJECT_ROLE_RANK[role] < PROJECT_ROLE_RANK[minRole]) {
    throw { status: 403, message: 'No tienes permisos suficientes en este proyecto' };
  }

  return role;
}

// Devuelve el project_id de una tarea, o lanza 404 si no existe.
async function getTaskProjectId(taskId) {
  const result = await query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
  if (!result.recordset[0]) throw { status: 404, message: 'Tarea no encontrada' };
  return result.recordset[0].project_id;
}

module.exports = {
  PROJECT_ROLE_RANK,
  getProjectRole,
  assertProjectMember,
  assertProjectRole,
  getTaskProjectId,
};
