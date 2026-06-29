const { Router } = require('express');
const controller = require('./tasks.controller');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');

const router = Router();

const createSchema = {
  project_id:  { required: true, type: 'number' },
  title:       { required: true, type: 'string', minLength: 2, maxLength: 200 },
  description: { type: 'string' },
  status:      { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'] },
  priority:    { type: 'string', enum: ['low', 'medium', 'high'] },
};

const updateSchema = {
  title:       { required: true, type: 'string', minLength: 2, maxLength: 200 },
  description: { type: 'string' },
  status:      { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'] },
  priority:    { type: 'string', enum: ['low', 'medium', 'high'] },
};

router.use(auth);

router.post('/',                        validate(createSchema), controller.create);
router.get('/',                         controller.list);      // ?project_id=X
router.get('/:id',                      controller.getById);
router.put('/:id',                      validate(updateSchema), controller.update);
router.delete('/:id',                   controller.remove);
router.post('/:id/assign',              validate({ user_id: { required: true, type: 'number' } }), controller.assign);
router.delete('/:id/assign/:userId',    controller.unassign);

module.exports = router;
