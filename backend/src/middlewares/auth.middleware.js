const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Adjunta el payload decodificado al request para uso posterior
    req.user = jwt.verify(token, jwtConfig.secret);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

module.exports = authMiddleware;
