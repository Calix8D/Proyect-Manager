require('./src/config/env');
const app = require('./app');
const { pool } = require('./src/config/database');
const { port } = require('./src/config/env');

async function start() {
  try {
    await pool.query('SELECT 1'); // verifica la conexión antes de abrir el puerto
    app.listen(port, () => {
      console.log(`🚀 Backend corriendo en http://localhost:${port}`);
    });
  } catch (err) {
    console.error('❌ No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
}

start();
