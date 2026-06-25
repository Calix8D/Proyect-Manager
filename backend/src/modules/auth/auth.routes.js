const { Router } = require('express');
const controller = require('./auth.controller');
const auth = require('../../middlewares/auth.middleware');

const router = Router();

router.post('/register', controller.register);
router.post('/login',    controller.login);
router.get('/me',        auth, controller.me);  // ruta protegida

module.exports = router;
