const { Pool } = require('pg');
const { db } = require('./env');

const connectionString = `postgresql://${db.user}:${encodeURIComponent(db.password)}@${db.host}:${db.port}/${db.database}`;

// Pool singleton compartido por toda la app
const pool = new Pool({
  connectionString,
  ssl:    { rejectUnauthorized: false },
  family: 4, // fuerza IPv4, evita el timeout por IPv6
  max:    10,
  idleTimeoutMillis: 30000,
});

pool.on('connect', () => console.log('✅ Conectado a PostgreSQL (Supabase)'));
pool.on('error',   (err) => console.error('❌ Error en el pool de DB:', err.message));

// Wrapper que mantiene la misma firma que antes: query(sql, params)
// params es un array: ['valor1', 'valor2'] — se usan como $1, $2 en el SQL
async function query(queryString, params = []) {
  const result = await pool.query(queryString, params);
  return { recordset: result.rows };
}

module.exports = { query, pool };
