// ── Step 42: API Security + Step 43: Rate Limiting + Step 44: Secret Detection ──
const rateLimit = require("express-rate-limit");

// ────────────────────────────────────────────────
// STEP 42 — API Security: Input sanitization + SQL injection prevention
// ────────────────────────────────────────────────

// Patterns that indicate potential injection attacks
const DANGEROUS_PATTERNS = [
  /(\bDROP\b|\bDELETE\b|\bTRUNCATE\b|\bINSERT\b|\bUPDATE\b)\s+\b(TABLE|DATABASE|FROM|INTO)\b/i,
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*["'`]/i,
  /\b(eval|exec|system|passthru|shell_exec)\s*\(/i,
];

const sanitizeInput = (req, res, next) => {
  const checkValue = (val) => {
    if (typeof val !== "string") return false;
    return DANGEROUS_PATTERNS.some(p => p.test(val));
  };

  const checkObj = (obj) => {
    if (!obj || typeof obj !== "object") return false;
    return Object.values(obj).some(v =>
      typeof v === "string" ? checkValue(v) : checkObj(v)
    );
  };

  if (checkObj(req.body) || checkObj(req.query)) {
    return res.status(400).json({
      success: false,
      message: "Request contains potentially unsafe content",
    });
  }
  next();
};

// Security response headers beyond helmet
const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
};

// ────────────────────────────────────────────────
// STEP 43 — Rate Limiting: Per-route limits
// ────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts. Try again in 15 minutes." },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 min
  max: 20,              // 20 AI requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "AI request limit reached. Please slow down." },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many uploads. Wait 1 minute." },
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many requests. Please slow down." },
});

// ────────────────────────────────────────────────
// STEP 44 — Secret Detection: Detect leaked credentials
// ────────────────────────────────────────────────
const SECRET_PATTERNS = [
  { name: "OpenAI Key",    pattern: /sk-[a-zA-Z0-9_-]{20,}/ },
  { name: "Gemini Key",    pattern: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "AWS Key",       pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "JWT Token",     pattern: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/ },
  { name: "Private Key",   pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: "GitHub Token",  pattern: /ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}/ },
  { name: "Stripe Key",    pattern: /sk_live_[a-zA-Z0-9]{24,}/ },
  { name: "Password Field",pattern: /"password"\s*:\s*"[^"]{8,}"/ },
  { name: "DB Connection", pattern: /mysql:\/\/[^:]+:[^@]+@/ },
];

const scanForSecrets = (text) => {
  if (!text || typeof text !== "string") return [];
  return SECRET_PATTERNS
    .filter(p => p.pattern.test(text))
    .map(p => p.name);
};

// Middleware to detect secrets in AI chat requests
const secretDetectionMiddleware = (req, res, next) => {
  const body = JSON.stringify(req.body || {});
  const detected = scanForSecrets(body);

  if (detected.length > 0) {
    console.warn(`⚠️ Potential secrets detected in request from ${req.ip}: ${detected.join(", ")}`);
    // Don't block — warn and continue (frontend handles redaction)
    req.secretsDetected = detected;
  }
  next();
};

// Function to redact secrets from text (used in AI responses too)
const redactSecrets = (text) => {
  if (!text) return text;
  let redacted = text;
  SECRET_PATTERNS.forEach(({ pattern, name }) => {
    redacted = redacted.replace(new RegExp(pattern.source, "g"), `[REDACTED:${name}]`);
  });
  return redacted;
};

module.exports = {
  sanitizeInput,
  securityHeaders,
  authLimiter,
  chatLimiter,
  uploadLimiter,
  strictLimiter,
  scanForSecrets,
  secretDetectionMiddleware,
  redactSecrets,
};
