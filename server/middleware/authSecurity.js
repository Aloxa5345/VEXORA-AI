// ── Step 41: Authentication Security Middleware ──────────
const jwt = require("jsonwebtoken");

// Brute force protection — simple in-memory store
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 15 * 60 * 1000; // 15 minutes

const bruteForceProtection = (req, res, next) => {
  const key = req.ip + ":" + (req.body?.email || "");
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, firstAttempt: now, lockedUntil: 0 };

  // Clear expired lockout
  if (record.lockedUntil && now > record.lockedUntil) {
    loginAttempts.delete(key);
    return next();
  }

  // Reject if locked
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainMin = Math.ceil((record.lockedUntil - now) / 60000);
    return res.status(429).json({
      success: false,
      message: `Too many failed attempts. Try again in ${remainMin} minute(s).`,
    });
  }

  // Reset window after 1 hour of no attempts
  if (now - record.firstAttempt > 60 * 60 * 1000) {
    loginAttempts.set(key, { count: 1, firstAttempt: now, lockedUntil: 0 });
    return next();
  }

  loginAttempts.set(key, record);
  req._loginKey = key;
  next();
};

const recordFailedLogin = (key) => {
  const record = loginAttempts.get(key) || { count: 0, firstAttempt: Date.now(), lockedUntil: 0 };
  record.count++;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  loginAttempts.set(key, record);
};

const recordSuccessLogin = (key) => {
  if (key) loginAttempts.delete(key);
};

// Token blacklist for logout (in-memory, use Redis in production)
const tokenBlacklist = new Set();

const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  // Cleanup old tokens every hour
  setTimeout(() => tokenBlacklist.delete(token), 8 * 60 * 60 * 1000);
};

const isBlacklisted = (token) => tokenBlacklist.has(token);

// Verify token + check blacklist
const verifyTokenSecure = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authorization token required" });
  }
  const token = authHeader.split(" ")[1];

  if (isBlacklisted(token)) {
    return res.status(401).json({ success: false, message: "Token has been revoked" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = { bruteForceProtection, recordFailedLogin, recordSuccessLogin, blacklistToken, isBlacklisted, verifyTokenSecure };
