const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

class User {
  static async create({ email, password }) {
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );

    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async emailExists(email) {
    const result = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    return result.rows.length > 0;
  }

  static async updatePassword(userId, newPassword) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const result = await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email',
      [passwordHash, userId]
    );

    return result.rows[0];
  }

  static async deleteUser(userId) {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );

    return result.rows[0];
  }
}

module.exports = User;