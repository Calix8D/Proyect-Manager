const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');
const { jwt: jwtConfig } = require('../../config/env');

async function register({ name, email, password, role = 'member' }) {
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);

  if (existing.recordset.length > 0) {
    throw { status: 409, message: 'El email ya está registrado' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, hashedPassword, role]
  );

  return result.recordset[0];
}

async function login({ email, password }) {
  const result = await query(
    'SELECT id, name, email, password, role, is_active FROM users WHERE email = $1',
    [email]
  );

  const user = result.recordset[0];

  if (!user) throw { status: 401, message: 'Credenciales inválidas' };
  if (!user.is_active) throw { status: 403, message: 'Cuenta desactivada' };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw { status: 401, message: 'Credenciales inválidas' };

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );

  const { password: _pw, ...safeUser } = user;
  return { token, user: safeUser };
}

async function getMe(userId) {
  const result = await query(
    'SELECT id, name, email, role, avatar_url, created_at, is_active FROM users WHERE id = $1',
    [userId]
  );

  if (!result.recordset[0]) throw { status: 404, message: 'Usuario no encontrado' };

  return result.recordset[0];
}

module.exports = { register, login, getMe };
