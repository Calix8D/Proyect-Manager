const { Router } = require('express');
const controller = require('./projects.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');

const router = Router();

// Todas las rutas de proyectos requieren autenticación
router.use(auth);

router.post('/',                          requireRole('admin'), controller.create);
router.get('/',                           controller.list);
router.get('/:id',                        controller.getById);
router.put('/:id',                        controller.update);
router.delete('/:id',                     controller.remove);
router.post('/:id/members',               controller.addMember);
router.delete('/:id/members/:userId',     controller.removeMember);

module.exports = router;
