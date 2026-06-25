const { query } = require('../../config/database');

async function addComment({ task_id, content }, userId) {
  const result = await query(
    `INSERT INTO comments (task_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [task_id, userId, content]
  );

  return result.recordset[0];
}

async function listComments(taskId) {
  const result = await query(
    `SELECT c.*, u.name AS author_name, u.avatar_url AS author_avatar
     FROM comments c
     INNER JOIN users u ON u.id = c.user_id
     WHERE c.task_id = $1
     ORDER BY c.created_at ASC`,
    [taskId]
  );

  return result.recordset;
}

async function deleteComment(commentId, userId, userRole) {
  const result = await query(
    'SELECT user_id FROM comments WHERE id = $1',
    [commentId]
  );

  if (!result.recordset[0]) throw { status: 404, message: 'Comentario no encontrado' };

  const isAuthor = result.recordset[0].user_id === userId;
  const isAdmin  = userRole === 'admin';

  if (!isAuthor && !isAdmin) {
    throw { status: 403, message: 'Solo el autor o un admin puede eliminar este comentario' };
  }

  await query('DELETE FROM comments WHERE id = $1', [commentId]);
}

module.exports = { addComment, listComments, deleteComment };
