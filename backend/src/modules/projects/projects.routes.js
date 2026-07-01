const { Router } = require('express');
const controller = require('./projects.controller');
const auth = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');

const router = Router();

const projectSchema = {
  name:        { required: true, type: 'string', minLength: 2, maxLength: 150 },
  description: { type: 'string' },
  status:      { type: 'string', enum: ['active', 'on_hold', 'completed', 'cancelled'] },
  priority:    { type: 'string', enum: ['low', 'medium', 'high'] },
};

const memberSchema = {
  user_id: { required: true, type: 'number' },
  role:    { type: 'string', enum: ['leader', 'member', 'viewer'] },
};

// Todas las rutas de proyectos requieren autenticación
router.use(auth);

// Solo un admin crea proyectos (queda como owner/leader) y luego agrega miembros.
router.post('/',                          requireRole('admin'), validate(projectSchema), controller.create);
router.get('/',                           controller.list);
router.get('/:id',                        controller.getById);
router.put('/:id',                        validate(projectSchema), controller.update);
router.delete('/:id',                     controller.remove);
router.post('/:id/members',               validate(memberSchema), controller.addMember);
router.patch('/:id/members/:userId',      validate({ role: { required: true, type: 'string', enum: ['leader', 'member', 'viewer'] } }), controller.updateMemberRole);
router.delete('/:id/members/:userId',     controller.removeMember);

module.exports = router;
