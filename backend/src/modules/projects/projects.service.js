const { query } = require('../../config/database');
const { assertProjectMember } = require('../../utils/access');

async function createProject({ name, description, status, priority, start_date, end_date }, ownerId) {
  const result = await query(
    `INSERT INTO projects (name, description, status, priority, start_date, end_date, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, description || null, status || 'active', priority || 'medium', start_date || null, end_date || null, ownerId]
  );

  const project = result.recordset[0];

  await query(
    `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'leader')`,
    [project.id, ownerId]
  );

  return project;
}

async function listProjects(userId) {
  const result = await query(
    `SELECT p.*, u.name AS owner_name,
            COUNT(t.id) AS total_tasks,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_tasks
     FROM projects p
     INNER JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
     LEFT JOIN users u ON u.id = p.owner_id
     LEFT JOIN tasks t ON t.project_id = p.id
     GROUP BY p.id, u.name
     ORDER BY p.created_at DESC`,
    [userId]
  );

  return result.recordset;
}

async function getProjectById(projectId, userId, userRole) {
  await assertProjectMember(projectId, userId, userRole);

  const projectResult = await query(
    `SELECT p.*, u.name AS owner_name,
            COUNT(t.id) AS total_tasks,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_tasks
     FROM projects p
     LEFT JOIN users u ON u.id = p.owner_id
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.id = $1
     GROUP BY p.id, u.name`,
    [projectId]
  );

  if (!projectResult.recordset[0]) throw { status: 404, message: 'Proyecto no encontrado' };

  const membersResult = await query(
    `SELECT u.id, u.name, u.email, u.avatar_url, pm.role, pm.joined_at
     FROM project_members pm
     INNER JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1`,
    [projectId]
  );

  const project = projectResult.recordset[0];
  const total = parseInt(project.total_tasks) || 0;
  const completed = parseInt(project.completed_tasks) || 0;
  project.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  project.members = membersResult.recordset;

  return project;
}

async function updateProject(projectId, data, userId, userRole) {
  await assertOwnerOrAdmin(projectId, userId, userRole);

  // COALESCE: status/priority son NOT NULL; si no vienen se conserva el valor actual.
  const result = await query(
    `UPDATE projects
     SET name = $1, description = $2, status = COALESCE($3, status), priority = COALESCE($4, priority),
         start_date = $5, end_date = $6
     WHERE id = $7
     RETURNING *`,
    [data.name, data.description || null, data.status || null, data.priority || null, data.start_date || null, data.end_date || null, projectId]
  );

  return result.recordset[0];
}

async function deleteProject(projectId, userId, userRole) {
  await assertOwnerOrAdmin(projectId, userId, userRole);
  await query('DELETE FROM projects WHERE id = $1', [projectId]);
}

async function addMember(projectId, targetUserId, role = 'member', requesterId, requesterRole) {
  await assertOwnerOrAdmin(projectId, requesterId, requesterRole);

  const existing = await query(
    'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, targetUserId]
  );

  if (existing.recordset.length > 0) {
    throw { status: 409, message: 'El usuario ya es miembro del proyecto' };
  }

  const result = await query(
    `INSERT INTO project_members (project_id, user_id, role)
     VALUES ($1, $2, $3) RETURNING *`,
    [projectId, targetUserId, role]
  );

  return result.recordset[0];
}

async function removeMember(projectId, targetUserId, requesterId, requesterRole) {
  const ownerId = await assertOwnerOrAdmin(projectId, requesterId, requesterRole);

  // El dueño no puede salir de su propio proyecto — quedaría sin líder y sin acceso.
  if (ownerId === targetUserId) {
    throw { status: 400, message: 'No puedes quitar al dueño del proyecto' };
  }

  await query(
    'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, targetUserId]
  );
}

async function updateMemberRole(projectId, targetUserId, role, requesterId, requesterRole) {
  const ownerId = await assertOwnerOrAdmin(projectId, requesterId, requesterRole);

  // El dueño del proyecto debe permanecer como 'leader' — evita que se quede sin control.
  if (ownerId === targetUserId) {
    throw { status: 400, message: 'No puedes cambiar el rol del dueño del proyecto' };
  }

  const result = await query(
    `UPDATE project_members SET role = $1
     WHERE project_id = $2 AND user_id = $3
     RETURNING *`,
    [role, projectId, targetUserId]
  );

  if (!result.recordset[0]) {
    throw { status: 404, message: 'El usuario no es miembro del proyecto' };
  }

  return result.recordset[0];
}

// Devuelve el owner_id del proyecto para que quien llame pueda hacer chequeos extra.
async function assertOwnerOrAdmin(projectId, userId, userRole) {
  const result = await query('SELECT owner_id FROM projects WHERE id = $1', [projectId]);

  if (!result.recordset[0]) throw { status: 404, message: 'Proyecto no encontrado' };

  const ownerId = result.recordset[0].owner_id;
  const isOwner = ownerId === userId;
  const isAdmin = userRole === 'admin';

  if (!isOwner && !isAdmin) {
    throw { status: 403, message: 'No tienes permiso para esta acción' };
  }

  return ownerId;
}

module.exports = { createProject, listProjects, getProjectById, updateProject, deleteProject, addMember, removeMember, updateMemberRole };
