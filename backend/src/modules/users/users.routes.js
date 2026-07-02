const { Router } = require('express');
const controller = require('./users.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

const router = Router();

router.use(auth);

// Solo un admin puede listar usuarios: expone nombres y emails de toda la base,
// y bajo el modelo "admin asigna" nadie más necesita este listado.
router.get('/', requireRole('admin'), controller.list); // ?search=texto

module.exports = router;
