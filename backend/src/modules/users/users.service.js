const { query } = require('../../config/database');

// Lista usuarios activos para poder asignarlos a proyectos.
// `search` opcional filtra por nombre o email.
async function listUsers(search) {
  if (search) {
    const result = await query(
      `SELECT id, name, email, role, avatar_url
       FROM users
       WHERE is_active = TRUE AND (name ILIKE $1 OR email ILIKE $1)
       ORDER BY name ASC`,
      [`%${search}%`]
    );
    return result.recordset;
  }

  const result = await query(
    `SELECT id, name, email, role, avatar_url
     FROM users
     WHERE is_active = TRUE
     ORDER BY name ASC`
  );
  return result.recordset;
}

module.exports = { listUsers };
