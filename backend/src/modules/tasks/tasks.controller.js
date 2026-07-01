const service = require('./tasks.service');
const { sendError } = require('../../utils/respond');

async function create(req, res) {
  try {
    const task = await service.createTask(req.body, req.user.id, req.user.role);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    sendError(res, err);
  }
}

async function list(req, res) {
  try {
    const { project_id } = req.query;
    if (!project_id) {
      return res.status(400).json({ success: false, message: 'Se requiere project_id' });
    }
    const tasks = await service.listTasks(parseInt(project_id), req.user.id, req.user.role);
    res.json({ success: true, data: tasks });
  } catch (err) {
    sendError(res, err);
  }
}

async function getById(req, res) {
  try {
    const task = await service.getTaskById(parseInt(req.params.id), req.user.id, req.user.role);
    res.json({ success: true, data: task });
  } catch (err) {
    sendError(res, err);
  }
}

async function update(req, res) {
  try {
    const task = await service.updateTask(parseInt(req.params.id), req.body, req.user.id, req.user.role);
    res.json({ success: true, data: task });
  } catch (err) {
    sendError(res, err);
  }
}

async function remove(req, res) {
  try {
    await service.deleteTask(parseInt(req.params.id), req.user.id, req.user.role);
    res.json({ success: true, message: 'Tarea eliminada' });
  } catch (err) {
    sendError(res, err);
  }
}

async function assign(req, res) {
  try {
    const result = await service.assignUser(parseInt(req.params.id), req.body.user_id, req.user.id, req.user.role);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    sendError(res, err);
  }
}

async function unassign(req, res) {
  try {
    await service.unassignUser(parseInt(req.params.id), parseInt(req.params.userId), req.user.id, req.user.role);
    res.json({ success: true, message: 'Asignación removida' });
  } catch (err) {
    sendError(res, err);
  }
}

module.exports = { create, list, getById, update, remove, assign, unassign };
