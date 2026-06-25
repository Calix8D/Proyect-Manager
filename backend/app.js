const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/modules/auth/auth.routes');
const projectRoutes = require('./src/modules/projects/projects.routes');
const taskRoutes = require('./src/modules/tasks/tasks.routes');
const commentRoutes = require('./src/modules/comments/comments.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);

// Manejador global de errores no capturados
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

module.exports = app;
