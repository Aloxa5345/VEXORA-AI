const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

// ── Helper: DB error check ────────────────────────
const isDbError = (err) =>
  err?.code === "ECONNREFUSED" ||
  err?.code === "ER_ACCESS_DENIED_ERROR" ||
  err?.message?.includes("ECONNREFUSED") ||
  err?.message?.includes("connect ETIMEDOUT") ||
  err?.message?.includes("Unknown database");

// ── Register ──────────────────────────────────────
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const allowedRoles = ['user', 'admin'];
  const userRole = allowedRoles.includes(role) ? role : 'user';

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, userRole]
    );

    res.status(201).json({ success: true, message: 'User registered successfully!', role: userRole });
  } catch (err) {
    console.error("Register error:", err.message);
    if (isDbError(err)) {
      return res.status(503).json({ success: false, message: 'Database offline. Please start XAMPP MySQL.' });
    }
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// ── Login ─────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Login error:", err.message);
    if (isDbError(err)) {
      return res.status(503).json({ success: false, message: 'Database offline. Please start XAMPP MySQL.' });
    }
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ── Admin Login ───────────────────────────────────
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ? AND role = 'admin' LIMIT 1",
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: "Authentication configuration error" });
    }

    const token = jwt.sign(
      { id: user.id, adminId: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin: { id: user.id, fullName: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);
    if (isDbError(error)) {
      return res.status(503).json({ success: false, message: "Database offline. Please start XAMPP MySQL." });
    }
    return res.status(500).json({ success: false, message: "Login failed. Please try again." });
  }
};

// ── Forgot Password (OTP) ────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }

  try {
    const [users] = await db.query('SELECT id, name FROM users WHERE email = ?', [email.trim().toLowerCase()]);

    // Always return success — never leak whether an email is registered
    if (users.length === 0) {
      return res.json({ success: true, message: 'If that email is registered, an OTP has been sent.' });
    }

    const user = users[0];

    // Generate a 6-digit numeric OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Auto-create table on first use
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        token      VARCHAR(128) NOT NULL,
        expires_at DATETIME NOT NULL,
        used       TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (token),
        INDEX idx_user  (user_id)
      )
    `);

    // Invalidate any previous OTPs for this user
    await db.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);

    // Store the OTP (plain — it is short-lived and numeric only)
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, otp, expiresAt]
    );

    // In production, send via email. For now return it directly so the UI can show it.
    return res.json({
      success: true,
      message: 'OTP generated successfully.',
      otp,               // dev-mode: shown in the UI
      email: user.name,  // greet by name in UI
    });
  } catch (err) {
    console.error('Forgot-password error:', err.message);
    if (isDbError(err)) {
      return res.status(503).json({ success: false, message: 'Database offline. Please start XAMPP MySQL.' });
    }
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

// ── Verify OTP ────────────────────────────────────
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  try {
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    const userId = users[0].id;
    const [rows] = await db.query(
      'SELECT * FROM password_reset_tokens WHERE user_id = ? AND token = ? LIMIT 1',
      [userId, String(otp).trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }
    if (rows[0].used) {
      return res.status(400).json({ success: false, message: 'This OTP has already been used.' });
    }
    if (new Date() > new Date(rows[0].expires_at)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    return res.json({ success: true, message: 'OTP verified.' });
  } catch (err) {
    console.error('Verify-OTP error:', err.message);
    if (isDbError(err)) {
      return res.status(503).json({ success: false, message: 'Database offline. Please start XAMPP MySQL.' });
    }
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

// ── Reset Password (with OTP) ─────────────────────
const resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  try {
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid request.' });
    }

    const userId = users[0].id;
    const [rows] = await db.query(
      'SELECT * FROM password_reset_tokens WHERE user_id = ? AND token = ? LIMIT 1',
      [userId, String(otp).trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    if (rows[0].used) {
      return res.status(400).json({ success: false, message: 'This OTP has already been used.' });
    }
    if (new Date() > new Date(rows[0].expires_at)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    await db.query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [rows[0].id]);

    return res.json({ success: true, message: 'Password updated successfully! You can now sign in.' });
  } catch (err) {
    console.error('Reset-password error:', err.message);
    if (isDbError(err)) {
      return res.status(503).json({ success: false, message: 'Database offline. Please start XAMPP MySQL.' });
    }
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

module.exports = { register, login, adminLogin, forgotPassword, verifyOtp, resetPassword };
