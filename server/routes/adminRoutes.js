const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const {
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
} = require("../controllers/adminController");

router.use(adminAuth);

router.get("/stats", getDashboardStats);
router.get("/activity", getRecentActivity);
router.get("/system-status", getSystemStatus);
router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);
router.get("/chart", getChartData);
router.get("/api-logs", getApiLogs);
router.get("/analytics", getAnalytics);
router.get("/projects", getProjects);
router.delete("/projects/:id", deleteProject);

module.exports = router;
