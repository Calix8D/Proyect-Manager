const { Router } = require('express');
const controller = require('./auth.controller');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');

const router = Router();

router.post('/register', validate({
  name:     { required: true, type: 'string', minLength: 2, maxLength: 100 },
  email:    { required: true, type: 'string', isEmail: true, maxLength: 150 },
  password: { required: true, type: 'string', minLength: 8, maxLength: 100 },
}), controller.register);

router.post('/login', validate({
  email:    { required: true, type: 'string', isEmail: true },
  password: { required: true, type: 'string' },
}), controller.login);

router.get('/me',        auth, controller.me);  // ruta protegida

module.exports = router;
