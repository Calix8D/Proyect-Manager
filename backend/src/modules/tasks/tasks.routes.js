const { Router } = require('express');
const controller = require('./tasks.controller');
const auth = require('../../middlewares/auth.middleware');

const router = Router();

router.use(auth);

router.post('/',                        controller.create);
router.get('/',                         controller.list);      // ?project_id=X
router.get('/:id',                      controller.getById);
router.put('/:id',                      controller.update);
router.delete('/:id',                   controller.remove);
router.post('/:id/assign',              controller.assign);
router.delete('/:id/assign/:userId',    controller.unassign);

module.exports = router;
