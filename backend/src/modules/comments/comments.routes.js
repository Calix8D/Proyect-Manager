const { Router } = require('express');
const controller = require('./comments.controller');
const auth = require('../../middlewares/auth.middleware');

const router = Router();

router.use(auth);

router.post('/',        controller.add);
router.get('/',         controller.list);    // ?task_id=X
router.delete('/:id',   controller.remove);

module.exports = router;
