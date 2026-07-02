const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { corsOrigins } = require('./src/config/env');
const { apiLimiter } = require('./src/middlewares/rateLimit.middleware');
const authRoutes = require('./src/modules/auth/auth.routes');
const userRoutes = require('./src/modules/users/users.routes');
const projectRoutes = require('./src/modules/projects/projects.routes');
const taskRoutes = require('./src/modules/tasks/tasks.routes');
const commentRoutes = require('./src/modules/comments/comments.routes');
const reportRoutes = require('./src/modules/reports/reports.routes');

const app = express();

// Detrás de un proxy/balanceador (Render, Railway, Nginx...) para que el
// rate-limit y los logs vean la IP real del cliente vía X-Forwarded-For.
app.set('trust proxy', 1);

// Cabeceras de seguridad (CSP, HSTS, X-Frame-Options, etc.).
app.use(helmet());

// exposedHeaders: permite al frontend leer el nombre del Excel exportado.
app.use(cors({ origin: corsOrigins, exposedHeaders: ['Content-Disposition'] }));
app.use(express.json({ limit: '1mb' })); // límite de payload: evita DoS por cuerpos enormes

// Limitador general de la API (defensa en profundidad).
app.use('/api', apiLimiter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Rutas de la API
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks',    taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reports',  reportRoutes);

// Manejador global de errores no capturados.
// Los errores 4xx del body-parser (JSON malformado, payload > 1mb) se responden
// con su status real; todo lo demás es un 500 genérico que no filtra detalles.
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode;
  if (status && status >= 400 && status < 500) {
    const message = err.type === 'entity.too.large'
      ? 'El cuerpo de la petición es demasiado grande'
      : 'Cuerpo de la petición inválido';
    return res.status(status).json({ success: false, message });
  }

  console.error(err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

module.exports = app;
