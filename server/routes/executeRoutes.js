const express    = require("express");
const router     = express.Router();
const rateLimit  = require("express-rate-limit");
const { executeCode, debugCode } = require("../controllers/executeController");
const { verifyToken } = require("../middleware/authMiddleware");

// Stricter rate limit for execution (prevent abuse)
const execLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 20,               // 20 runs/min per IP
  message: { success: false, output: "Too many execution requests. Wait a moment." },
});

// POST /api/execute       — run code (auth required)
router.post("/",       verifyToken, execLimiter, executeCode);

// POST /api/execute/debug — debug analysis
router.post("/debug",  verifyToken, execLimiter, debugCode);

module.exports = router;
