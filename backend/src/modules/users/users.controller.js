const service = require('./users.service');

async function list(req, res) {
  try {
    const users = await service.listUsers(req.query.search);
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

module.exports = { list };
