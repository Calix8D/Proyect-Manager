const service = require('./projects.service');
const { sendError } = require('../../utils/respond');

async function create(req, res) {
  try {
    const project = await service.createProject(req.body, req.user.id);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    sendError(res, err);
  }
}

async function list(req, res) {
  try {
    const projects = await service.listProjects(req.user.id);
    res.json({ success: true, data: projects });
  } catch (err) {
    sendError(res, err);
  }
}

async function getById(req, res) {
  try {
    const project = await service.getProjectById(parseInt(req.params.id), req.user.id, req.user.role);
    res.json({ success: true, data: project });
  } catch (err) {
    sendError(res, err);
  }
}

async function update(req, res) {
  try {
    const project = await service.updateProject(parseInt(req.params.id), req.body, req.user.id, req.user.role);
    res.json({ success: true, data: project });
  } catch (err) {
    sendError(res, err);
  }
}

async function remove(req, res) {
  try {
    await service.deleteProject(parseInt(req.params.id), req.user.id, req.user.role);
    res.json({ success: true, message: 'Proyecto eliminado' });
  } catch (err) {
    sendError(res, err);
  }
}

async function addMember(req, res) {
  try {
    const { user_id, role } = req.body;
    const member = await service.addMember(parseInt(req.params.id), user_id, role, req.user.id, req.user.role);
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    sendError(res, err);
  }
}

async function removeMember(req, res) {
  try {
    await service.removeMember(
      parseInt(req.params.id),
      parseInt(req.params.userId),
      req.user.id,
      req.user.role
    );
    res.json({ success: true, message: 'Miembro removido' });
  } catch (err) {
    sendError(res, err);
  }
}

async function updateMemberRole(req, res) {
  try {
    const member = await service.updateMemberRole(
      parseInt(req.params.id),
      parseInt(req.params.userId),
      req.body.role,
      req.user.id,
      req.user.role
    );
    res.json({ success: true, data: member });
  } catch (err) {
    sendError(res, err);
  }
}

module.exports = { create, list, getById, update, remove, addMember, removeMember, updateMemberRole };
