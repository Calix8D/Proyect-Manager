const { query } = require('../../config/database');
const { assertProjectMember, assertProjectRole, getTaskProjectId, PROJECT_ROLE_RANK } = require('../../utils/access');

async function createTask({ project_id, title, description, status, priority, due_date }, userId, userRole) {
  await assertProjectRole(project_id, userId, userRole); // escritura: viewer no puede crear

  const result = await query(
    `INSERT INTO tasks (project_id, title, description, status, priority, due_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [project_id, title, description || null, status || 'todo', priority || 'medium', due_date || null, userId]
  );

  return result.recordset[0];
}

async function listTasks(projectId, userId, userRole) {
  await assertProjectMember(projectId, userId, userRole); // lectura

  const result = await query(
    `SELECT t.*, u.name AS created_by_name,
            STRING_AGG(us.name, ', ') AS assignees,
            ARRAY_AGG(us.id) FILTER (WHERE us.id IS NOT NULL) AS assignee_ids
     FROM tasks t
     LEFT JOIN users u ON u.id = t.created_by
     LEFT JOIN task_assignments ta ON ta.task_id = t.id
     LEFT JOIN users us ON us.id = ta.user_id
     WHERE t.project_id = $1
     GROUP BY t.id, u.name
     ORDER BY t.created_at DESC`,
    [projectId]
  );

  return result.recordset;
}

async function getTaskById(taskId, userId, userRole) {
  const projectId = await getTaskProjectId(taskId);
  await assertProjectMember(projectId, userId, userRole); // lectura

  const taskResult = await query(
    `SELECT t.*, u.name AS created_by_name
     FROM tasks t
     LEFT JOIN users u ON u.id = t.created_by
     WHERE t.id = $1`,
    [taskId]
  );

  const assigneesResult = await query(
    `SELECT u.id, u.name, u.email, u.avatar_url, ta.assigned_at
     FROM task_assignments ta
     INNER JOIN users u ON u.id = ta.user_id
     WHERE ta.task_id = $1`,
    [taskId]
  );

  const task = taskResult.recordset[0];
  task.assignees = assigneesResult.recordset;
  return task;
}

async function updateTask(taskId, data, userId, userRole) {
  const projectId = await getTaskProjectId(taskId);
  await assertProjectRole(projectId, userId, userRole); // escritura: viewer no puede editar

  const result = await query(
    `UPDATE tasks
     SET title = $1, description = $2, status = $3,
         priority = $4, due_date = $5
     WHERE id = $6
     RETURNING *`,
    [data.title, data.description || null, data.status, data.priority, data.due_date || null, taskId]
  );

  return result.recordset[0];
}

async function deleteTask(taskId, userId, userRole) {
  const projectId = await getTaskProjectId(taskId);
  await assertProjectRole(projectId, userId, userRole); // escritura: viewer no puede borrar

  await query('DELETE FROM tasks WHERE id = $1', [taskId]);
}

async function assignUser(taskId, targetUserId, userId, userRole) {
  const projectId = await getTaskProjectId(taskId);
  const role = await assertProjectRole(projectId, userId, userRole); // viewer no puede asignar

  // "Admin/líder asigna, miembro se autoasigna": un member solo puede asignarse a sí mismo.
  if (targetUserId !== userId && PROJECT_ROLE_RANK[role] < PROJECT_ROLE_RANK.leader) {
    throw { status: 403, message: 'Solo un líder o administrador puede asignar a otros miembros' };
  }

  const existing = await query(
    'SELECT id FROM task_assignments WHERE task_id = $1 AND user_id = $2',
    [taskId, targetUserId]
  );

  if (existing.recordset.length > 0) {
    throw { status: 409, message: 'El usuario ya está asignado a esta tarea' };
  }

  const result = await query(
    `INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2) RETURNING *`,
    [taskId, targetUserId]
  );

  return result.recordset[0];
}

async function unassignUser(taskId, targetUserId, userId, userRole) {
  const projectId = await getTaskProjectId(taskId);
  const role = await assertProjectRole(projectId, userId, userRole); // viewer no puede desasignar

  // Un member solo puede quitarse a sí mismo; quitar a otros requiere líder/admin.
  if (targetUserId !== userId && PROJECT_ROLE_RANK[role] < PROJECT_ROLE_RANK.leader) {
    throw { status: 403, message: 'Solo un líder o administrador puede desasignar a otros miembros' };
  }

  await query(
    'DELETE FROM task_assignments WHERE task_id = $1 AND user_id = $2',
    [taskId, targetUserId]
  );
}

module.exports = { createTask, listTasks, getTaskById, updateTask, deleteTask, assignUser, unassignUser };
