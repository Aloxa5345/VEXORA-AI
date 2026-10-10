const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// ── GET /api/admin/stats ──────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [[userResult]] = await pool.query("SELECT COUNT(*) AS total FROM users");
    const [[convResult]] = await pool.query("SELECT COUNT(*) AS total FROM conversations");
    const [[projectResult]] = await pool.query("SELECT COUNT(*) AS total FROM projects");
    const [[logResult]] = await pool.query("SELECT COUNT(*) AS total FROM api_logs");
    const [[chatHistResult]] = await pool.query("SELECT COUNT(*) AS total FROM chat_history");
    const [[adminUserResult]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");
    const [[todayChats]] = await pool.query("SELECT COUNT(*) AS total FROM chat_history WHERE DATE(created_at) = CURDATE()");
    const [[weekChats]] = await pool.query("SELECT COUNT(*) AS total FROM chat_history WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers: userResult.total,
        totalConversations: convResult.total + chatHistResult.total,
        totalProjects: projectResult.total,
        totalApiLogs: logResult.total,
        totalAdmins: adminUserResult.total,
        todayChats: todayChats.total,
        weekChats: weekChats.total,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load dashboard statistics" });
  }
};

// ── GET /api/admin/activity ───────────────────────────────
const getRecentActivity = async (req, res) => {
  try {
    const [chatActivity] = await pool.query(`
      SELECT ch.id,
        CONCAT('/api/chat - ', SUBSTRING(ch.message, 1, 40)) AS endpoint,
        'POST'  AS method, 200 AS status_code,
        u.name  AS user_name, ch.created_at
      FROM chat_history ch
      LEFT JOIN users u ON u.id = ch.user_id
      ORDER BY ch.created_at DESC LIMIT 5
    `);

    const [logActivity] = await pool.query(`
      SELECT al.id, al.endpoint, al.method, al.status_code,
        u.name AS user_name, al.created_at
      FROM api_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC LIMIT 5
    `);

    const combined = [...chatActivity, ...logActivity]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    return res.status(200).json({ success: true, activities: combined });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load recent activity" });
  }
};

// ── GET /api/admin/system-status ─────────────────────────
const getSystemStatus = async (req, res) => {
  let databaseStatus = "Offline";
  try { await pool.query("SELECT 1"); databaseStatus = "Online"; } catch (e) { }

  const aiConfigured = !!process.env.OPENAI_API_KEY || !!process.env.GEMINI_API_KEY;

  return res.status(200).json({
    success: true,
    services: {
      backend: "Online",
      database: databaseStatus,
      aiService: aiConfigured ? "Configured" : "Not Configured",
      authService: "Online",
      geminiModel: process.env.GEMINI_MODEL || "—",
      openaiModel: process.env.OPENAI_MODEL || "—",
    },
  });
};

// ── GET /api/admin/users ──────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
        COUNT(ch.id) AS chat_count
       FROM users u
       LEFT JOIN chat_history ch ON ch.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC LIMIT 100`
    );
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load users" });
  }
};

// ── PUT /api/admin/users/:id/role ─────────────────────────
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!["user", "admin"].includes(role))
    return res.status(400).json({ success: false, message: "Invalid role" });
  try {
    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    return res.status(200).json({ success: true, message: "Role updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update role" });
  }
};

// ── DELETE /api/admin/users/:id ───────────────────────────
const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (id == req.user.id)
    return res.status(400).json({ success: false, message: "Cannot delete yourself" });
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

// ── GET /api/admin/chart ──────────────────────────────────
const getChartData = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%a') AS day,
             DATE(created_at) AS date,
             COUNT(*) AS count
      FROM chat_history
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);
    return res.status(200).json({ success: true, chart: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load chart data" });
  }
};

// ── GET /api/admin/api-logs ───────────────────────────────
const getApiLogs = async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT al.id, al.endpoint, al.method, al.status_code,
             al.ip_address, al.created_at, u.name AS user_name
      FROM api_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC LIMIT 50
    `);
    return res.status(200).json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load API logs" });
  }
};

// ── GET /api/admin/analytics ──────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    // Daily chats last 14 days
    const [dailyChats] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%b %d') AS label,
             COUNT(*) AS count
      FROM chat_history
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
        AND role = 'user'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

    // Top users by chat count
    const [topUsers] = await pool.query(`
      SELECT u.name, u.email, COUNT(ch.id) AS chat_count
      FROM users u
      LEFT JOIN chat_history ch ON ch.user_id = u.id
      GROUP BY u.id
      ORDER BY chat_count DESC LIMIT 5
    `);

    // Hourly distribution
    const [hourly] = await pool.query(`
      SELECT HOUR(created_at) AS hour, COUNT(*) AS count
      FROM chat_history
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
    `);

    return res.status(200).json({ success: true, dailyChats, topUsers, hourly });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load analytics" });
  }
};

// ── GET /api/admin/projects ───────────────────────
const getProjects = async (req, res) => {
  try {
    const [projects] = await pool.query(
      `SELECT p.id, p.project_name, p.created_at, u.name AS user_name, u.email
       FROM projects p
       LEFT JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC LIMIT 100`
    );
    return res.status(200).json({ success: true, projects });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load projects" });
  }
};

// ── DELETE /api/admin/projects/:id ────────────────
const deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM projects WHERE id = ?", [id]);
    return res.status(200).json({ success: true, message: "Project deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete project" });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getSystemStatus,
  getUsers,
  updateUserRole,
  deleteUser,
  getChartData,
  getApiLogs,
  getAnalytics,
  getProjects,
  deleteProject,
};
