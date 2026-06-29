const express = require('express');
const cors = require('cors');

const { corsOrigins } = require('./src/config/env');
const authRoutes = require('./src/modules/auth/auth.routes');
const userRoutes = require('./src/modules/users/users.routes');
const projectRoutes = require('./src/modules/projects/projects.routes');
const taskRoutes = require('./src/modules/tasks/tasks.routes');
const commentRoutes = require('./src/modules/comments/comments.routes');
const reportRoutes = require('./src/modules/reports/reports.routes');

const app = express();

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Rutas de la API
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks',    taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reports',  reportRoutes);

// Manejador global de errores no capturados
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

module.exports = app;
