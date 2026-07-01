const rateLimit = require('express-rate-limit');

// Nota: el store por defecto es en memoria (por proceso). Para varias instancias
// detrás de un balanceador habría que usar un store compartido (p. ej. Redis).

// Estricto: protege login/registro contra fuerza bruta y enumeración de cuentas.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                  // 10 intentos por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos. Intenta de nuevo más tarde.' },
});

// General: defensa en profundidad para el resto de la API. Amplio para no afectar
// el uso normal de la SPA (que hace muchas peticiones).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas peticiones. Intenta de nuevo más tarde.' },
});

module.exports = { authLimiter, apiLimiter };
