const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const db = require("./config/db");
const testDatabaseConnection = db.testDatabaseConnection;
const { apiLogger } = require("./middleware/auditLogger");
const { sanitizeInput, securityHeaders, authLimiter, chatLimiter, strictLimiter, secretDetectionMiddleware } = require("./middleware/apiSecurity");

const healthCheck = require('./middleware/healthCheck');
const requestLogger = require('./middleware/requestLogger');

const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const executeRoutes = require("./routes/executeRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Railway/Render/Heroku (must be before routes)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ── Step 42: Security Headers ─────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(securityHeaders);

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS policy: Origin not allowed"));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── Body Limit ────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── Request Logger ────────────────────────────────────────
app.use(requestLogger);

// ── Step 42: Input Sanitization ───────────────────────────
app.use("/api", sanitizeInput);

// ── Step 44: Secret Detection ─────────────────────────────
app.use("/api/chat", secretDetectionMiddleware);

// ── Audit Logger ──────────────────────────────────────────
app.use("/api", apiLogger);

// ── Health Check (no rate limit) ──────────────────────────
app.use('/api/health', healthCheck);

// ── Step 43: Global Rate Limiting ────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api", globalLimiter);

// ── Health Check ──────────────────────────────────────────
app.get("/", (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.json({ ok: true });
  }
  res.json({
    success: true,
    message: "VEXORA AI Backend API is running 🚀",
    version: "1.0.0",
    security: { helmet: true, rateLimit: true, secretDetection: true, inputSanitization: true },
  });
});

// ── API Routes ────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/chat", chatLimiter, chatRoutes);
app.use("/api/user", strictLimiter, userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/execute", executeRoutes);

// ── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Backend Error:", err.message);
  if (err.message.includes("CORS policy")) {
    return res.status(403).json({ success: false, message: "Origin is not allowed" });
  }
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ── Start Server ──────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 VEXORA AI backend running at http://localhost:${PORT}`);
  console.log(`🌐 Allowed frontend origins: ${allowedOrigins.join(', ')}`);
  console.log(`🔐 Security: helmet ✓ | rate-limit ✓ | input-sanitize ✓ | secret-detect ✓`);
  try {
    await testDatabaseConnection();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
});
