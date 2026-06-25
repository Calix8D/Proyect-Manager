const authService = require('./auth.service');

async function register(req, res) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

async function me(req, res) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

module.exports = { register, login, me };
