const { Router } = require('express');
const controller = require('./reports.controller');
const auth = require('../../middlewares/auth.middleware');

const router = Router();

router.use(auth);

router.get('/:id/summary',  controller.summary);
router.get('/:id/workload', controller.workload);
router.get('/:id/overdue',  controller.overdue);
router.get('/:id/export',   controller.exportExcel);

module.exports = router;
