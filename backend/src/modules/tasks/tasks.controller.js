const service = require('./tasks.service');

async function create(req, res) {
  try {
    const task = await service.createTask(req.body, req.user.id);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

async function list(req, res) {
  try {
    const { project_id } = req.query;
    if (!project_id) {
      return res.status(400).json({ success: false, message: 'Se requiere project_id' });
    }
    const tasks = await service.listTasks(parseInt(project_id));
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

async function getById(req, res) {
  try {
    const task = await service.getTaskById(parseInt(req.params.id));
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    const task = await service.updateTask(parseInt(req.params.id), req.body);
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    await service.deleteTask(parseInt(req.params.id));
    res.json({ success: true, message: 'Tarea eliminada' });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

async function assign(req, res) {
  try {
    const result = await service.assignUser(parseInt(req.params.id), req.body.user_id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

async function unassign(req, res) {
  try {
    await service.unassignUser(parseInt(req.params.id), parseInt(req.params.userId));
    res.json({ success: true, message: 'Asignación removida' });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

module.exports = { create, list, getById, update, remove, assign, unassign };
