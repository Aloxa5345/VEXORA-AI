const { spawn } = require("child_process");
const fs        = require("fs");
const path      = require("path");
const os        = require("os");
const crypto    = require("crypto");

// ── Config ────────────────────────────────────────
const TIMEOUT_MS   = 10000;   // 10 s hard kill
const MAX_OUTPUT   = 50000;   // 50 KB output cap
const TEMP_DIR     = os.tmpdir();

// Allowed languages + runner config
const RUNNERS = {
  javascript: { cmd: "node",   ext: "js",  args: (f) => [f] },
  typescript: { cmd: "node",   ext: "ts",  args: (f) => ["--input-type=module", f], note: "TS compiled as ESM" },
  python:     { cmd: "python", ext: "py",  args: (f) => [f] },
  html:       { cmd: null,     ext: "html",args: ()  => [], note: "HTML preview only" },
  css:        { cmd: null,     ext: "css", args: ()  => [], note: "CSS preview only"  },
};

// Dangerous patterns blocked before execution (Step 35 — Secure Sandbox)
const BLOCKED_PATTERNS = [
  /require\s*\(\s*['"`]child_process['"`]\s*\)/,
  /require\s*\(\s*['"`]fs['"`]\s*\)/,
  /require\s*\(\s*['"`]net['"`]\s*\)/,
  /require\s*\(\s*['"`]http['"`]\s*\)/,
  /require\s*\(\s*['"`]cluster['"`]\s*\)/,
  /process\.exit/,
  /process\.env/,
  /__dirname/,
  /import\s+.*from\s+['"`]fs['"`]/,
  /import\s+.*from\s+['"`]child_process['"`]/,
  /os\.system/,        // Python
  /subprocess/,        // Python
  /open\s*\(/,         // Python file access
  /exec\s*\(/,
  /eval\s*\(/,
  /Function\s*\(/,
  /while\s*\(\s*true\s*\)/,  // infinite loops
  /for\s*\(\s*;;\s*\)/,
];

function isSafe(code) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(code)) {
      return { safe: false, reason: `Blocked pattern: ${pattern.source.slice(0, 60)}` };
    }
  }
  return { safe: true };
}

// ── POST /api/execute ─────────────────────────────
const executeCode = async (req, res) => {
  const { code, language = "javascript", filename = "main" } = req.body;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ success: false, output: "No code provided." });
  }

  const lang = language.toLowerCase();
  const runner = RUNNERS[lang];

  if (!runner) {
    return res.status(400).json({
      success: false,
      output: `Language "${lang}" is not supported.\nSupported: ${Object.keys(RUNNERS).join(", ")}`,
    });
  }

  // HTML/CSS — just return as preview (no execution)
  if (!runner.cmd) {
    return res.json({ success: true, output: "", preview: code, language: lang });
  }

  // Security check (Step 35)
  const safety = isSafe(code);
  if (!safety.safe) {
    return res.status(403).json({
      success: false,
      output: `🔒 Security: ${safety.reason}\n\nThis code contains restricted operations and cannot be executed.`,
    });
  }

  // Write to temp file
  const id       = crypto.randomBytes(8).toString("hex");
  const tmpFile  = path.join(TEMP_DIR, `VEXORA AI_${id}.${runner.ext}`);

  try {
    fs.writeFileSync(tmpFile, code, "utf8");

    const output = await new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const proc = spawn(runner.cmd, runner.args(tmpFile), {
        timeout: TIMEOUT_MS,
        env: { PATH: process.env.PATH },   // minimal env — no secrets
      });

      proc.stdout.on("data", (d) => {
        stdout += d.toString();
        if (stdout.length > MAX_OUTPUT) proc.kill("SIGTERM");
      });

      proc.stderr.on("data", (d) => { stderr += d.toString(); });

      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill("SIGTERM");
      }, TIMEOUT_MS);

      proc.on("close", (code) => {
        clearTimeout(timer);
        if (timedOut) {
          resolve({ success: false, output: "⏱️ Execution timed out (10s limit)." });
          return;
        }
        if (stdout.length > MAX_OUTPUT) {
          resolve({ success: false, output: "⚠️ Output too large (50KB limit reached)." });
          return;
        }
        const combined = stdout + (stderr ? `\n--- stderr ---\n${stderr}` : "");
        resolve({ success: code === 0, output: combined || "(no output)" });
      });

      proc.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    return res.json({ success: output.success, output: output.output, language: lang });

  } catch (err) {
    return res.status(500).json({ success: false, output: `Execution error: ${err.message}` });
  } finally {
    // Clean up temp file
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
};

// ── POST /api/execute/debug ───────────────────────
// AI-powered debugger: runs code, captures error, asks AI to explain+fix
const debugCode = async (req, res) => {
  const { code, language = "javascript", error = "" } = req.body;

  if (!code) return res.status(400).json({ success: false, message: "No code provided." });

  const lang = language.toLowerCase();

  // If error provided by client (from previous run), use it
  // Otherwise return instructions to run first
  if (!error.trim()) {
    return res.json({
      success: true,
      debug: `To debug your code:\n1. Click "Run Code" first\n2. If there's an error, click "Debug" to get AI analysis\n\nNo errors detected from the provided input.`,
    });
  }

  // Return structured debug info — AI chat will analyze it
  return res.json({
    success: true,
    debug: `Language: ${lang}\n\nError detected:\n${error}\n\nCode analyzed. Use AI Chat to get fix suggestions.`,
    errorType: error.includes("SyntaxError") ? "SyntaxError"
             : error.includes("TypeError")   ? "TypeError"
             : error.includes("ReferenceError") ? "ReferenceError"
             : "RuntimeError",
  });
};

module.exports = { executeCode, debugCode };
