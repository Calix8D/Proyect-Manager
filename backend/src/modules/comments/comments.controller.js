const service = require('./comments.service');

async function add(req, res) {
  try {
    const comment = await service.addComment(req.body, req.user.id);
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

async function list(req, res) {
  try {
    const { task_id } = req.query;
    if (!task_id) {
      return res.status(400).json({ success: false, message: 'Se requiere task_id' });
    }
    const comments = await service.listComments(parseInt(task_id));
    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    await service.deleteComment(parseInt(req.params.id), req.user.id, req.user.role);
    res.json({ success: true, message: 'Comentario eliminado' });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

module.exports = { add, list, remove };
