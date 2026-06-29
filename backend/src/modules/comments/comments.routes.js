const { Router } = require('express');
const controller = require('./comments.controller');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');

const router = Router();

router.use(auth);

router.post('/', validate({
  task_id: { required: true, type: 'number' },
  content: { required: true, type: 'string', minLength: 1, maxLength: 2000 },
}), controller.add);
router.get('/',         controller.list);    // ?task_id=X
router.delete('/:id',   controller.remove);

module.exports = router;
