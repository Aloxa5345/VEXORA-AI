const express = require("express");
const router = express.Router();
const {
    sendMessage,
    saveMessage,
    getChatHistory,
    getUserSessions,
} = require("../controllers/chatController");
const { verifyToken } = require("../middleware/authMiddleware");

// Public route — test chat without auth (Step 3 temporary)
// POST /api/chat
router.post("/", sendMessage);

// Protected routes — require JWT
// POST /api/chat/message
router.post("/message", verifyToken, saveMessage);

// GET /api/chat/history/:session_id
router.get("/history/:session_id", verifyToken, getChatHistory);

// GET /api/chat/sessions
router.get("/sessions", verifyToken, getUserSessions);

module.exports = router;
