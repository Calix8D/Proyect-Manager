require('dotenv').config();

const required = ['DB_HOST', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];

required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Variable de entorno requerida faltante: ${key}`);
    process.exit(1);
  }
});

module.exports = {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_DATABASE,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    secret:    process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  reportsServiceUrl: process.env.REPORTS_SERVICE_URL || 'http://localhost:8000',
};
