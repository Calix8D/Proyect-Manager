const { Router } = require('express');
const controller = require('./users.controller');
const auth = require('../../middlewares/auth.middleware');

const router = Router();

router.use(auth);

router.get('/', controller.list); // ?search=texto

module.exports = router;
