const db = require('../config/db');
const bcrypt = require('bcryptjs');

// ── GET /api/user/profile ─────────────────────────
const getProfile = async (req, res) => {
  const user_id = req.user.id;
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [user_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });

    // Get chat stats
    const [chatStats] = await db.query(
      'SELECT COUNT(*) as total_messages, COUNT(DISTINCT session_id) as total_sessions FROM chat_history WHERE user_id = ?',
      [user_id]
    );

    res.json({
      success: true,
      user: rows[0],
      stats: {
        totalMessages: chatStats[0].total_messages || 0,
        totalSessions: chatStats[0].total_sessions || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── PUT /api/user/profile ─────────────────────────
const updateProfile = async (req, res) => {
  const { name } = req.body;
  const user_id = req.user.id;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required.' });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
  }

  try {
    await db.query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), user_id]);

    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [user_id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// ── PUT /api/user/change-password ─────────────────
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user_id = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both fields are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [user_id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user_id]);

    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { getProfile, updateProfile, changePassword };
