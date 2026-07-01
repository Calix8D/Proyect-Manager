const authService = require('./auth.service');
const { sendError } = require('../../utils/respond');

async function register(req, res) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    sendError(res, err);
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    sendError(res, err);
  }
}

async function me(req, res) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    sendError(res, err);
  }
}

module.exports = { register, login, me };
