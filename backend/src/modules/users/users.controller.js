const service = require('./users.service');
const { sendError } = require('../../utils/respond');

async function list(req, res) {
  try {
    const users = await service.listUsers(req.query.search);
    res.json({ success: true, data: users });
  } catch (err) {
    sendError(res, err);
  }
}

module.exports = { list };
