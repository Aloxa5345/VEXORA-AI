const db = require("../config/db");

// ── Log to audit_logs table ───────────────────────
const auditLog = async ({ actorId, actorRole = "user", action, targetType, targetId, description, ip, oldValue, newValue }) => {
  try {
    await db.query(
      `INSERT INTO audit_logs
        (actor_id, actor_role, action, target_type, target_id, description, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [actorId || null, actorRole, action, targetType || null, targetId || null, description || null, ip || null]
    );
  } catch (e) {
    console.error("Audit log error:", e.message);
  }
};

// ── Log to api_logs table ─────────────────────────
const apiLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", async () => {
    try {
      const ms = Date.now() - start;
      const userId = req.user?.id || null;
      const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
      await db.query(
        `INSERT INTO api_logs (user_id, endpoint, method, status_code, ip_address, user_agent, response_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, req.path, req.method, res.statusCode, ip, req.headers["user-agent"]?.slice(0, 255) || null, ms]
      );
    } catch (e) { /* silent */ }
  });
  next();
};

// ── Log AI usage ──────────────────────────────────
const logAIUsage = async ({ userId, sessionId, provider, model, feature = "chat", success = true, errorCode, latencyMs }) => {
  try {
    await db.query(
      `INSERT INTO ai_usage
        (user_id, session_id, provider, model, feature, success, error_code, latency_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId || null, sessionId || null, provider, model, feature, success ? 1 : 0, errorCode || null, latencyMs || 0]
    );
  } catch (e) {
    console.error("AI usage log error:", e.message);
  }
};

module.exports = { auditLog, apiLogger, logAIUsage };
