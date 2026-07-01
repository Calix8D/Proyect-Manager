const service = require('./comments.service');
const { sendError } = require('../../utils/respond');

async function add(req, res) {
  try {
    const comment = await service.addComment(req.body, req.user.id, req.user.role);
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    sendError(res, err);
  }
}

async function list(req, res) {
  try {
    const { task_id } = req.query;
    if (!task_id) {
      return res.status(400).json({ success: false, message: 'Se requiere task_id' });
    }
    const comments = await service.listComments(parseInt(task_id), req.user.id, req.user.role);
    res.json({ success: true, data: comments });
  } catch (err) {
    sendError(res, err);
  }
}

async function remove(req, res) {
  try {
    await service.deleteComment(parseInt(req.params.id), req.user.id, req.user.role);
    res.json({ success: true, message: 'Comentario eliminado' });
  } catch (err) {
    sendError(res, err);
  }
}

module.exports = { add, list, remove };
