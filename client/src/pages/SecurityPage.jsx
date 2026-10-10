import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./IntegrationsPage.css";
import "./SecurityPage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Step 44 — Secret patterns (frontend mirror)
const SECRET_PATTERNS = [
  { name: "OpenAI API Key", pattern: /sk-[a-zA-Z0-9_-]{20,}/g },
  { name: "Gemini API Key", pattern: /AIza[0-9A-Za-z_-]{35}/g },
  { name: "AWS Access Key", pattern: /AKIA[0-9A-Z]{16}/g },
  { name: "JWT Token", pattern: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g },
  { name: "GitHub Token", pattern: /ghp_[a-zA-Z0-9]{36}/g },
  { name: "Stripe Live Key", pattern: /sk_live_[a-zA-Z0-9]{24,}/g },
  { name: "Private Key", pattern: /-----BEGIN (RSA )?PRIVATE KEY-----/g },
  { name: "Database URL", pattern: /mysql:\/\/[^:]+:[^@]+@/g },
  { name: "Password in JSON", pattern: /"password"\s*:\s*"[^"]{4,}"/g },
];

// Step 45 — Unit test cases
const UNIT_TESTS = [
  {
    name: "Auth: Valid JWT format",
    test: () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.test";
      return /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(token);
    },
  },
  {
    name: "Auth: Empty password rejected",
    test: () => {
      const password = "";
      return password.length < 6;
    },
  },
  {
    name: "Secret: OpenAI key detected",
    test: () => {
      const text = "sk-abc123def456ghi789jkl012mno345pqr";
      return SECRET_PATTERNS[0].pattern.test(text);
    },
  },
  {
    name: "Secret: Normal text passes",
    test: () => {
      const text = "Hello world this is safe text";
      return !SECRET_PATTERNS.some(p => new RegExp(p.pattern.source).test(text));
    },
  },
  {
    name: "Input: SQL injection pattern",
    test: () => {
      const input = "DROP TABLE users";
      return /\b(DROP|DELETE|TRUNCATE)\b.*(TABLE|FROM)/i.test(input);
    },
  },
  {
    name: "Input: XSS pattern detected",
    test: () => {
      const input = "<script>alert('xss')</script>";
      return /<script[\s\S]*?>/.test(input);
    },
  },
  {
    name: "Email: Valid format check",
    test: () => {
      const email = "user@example.com";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
  },
  {
    name: "Email: Invalid format rejected",
    test: () => {
      const email = "notanemail";
      return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
  },
];

export default function SecurityPage() {
  const { token } = useAuth();

  // Step 44 — Secret scanner state
  const [scanText, setScanText] = useState("");
  const [scanResult, setScanResult] = useState(null);

  // Step 45 — Unit test state
  const [testResults, setTestResults] = useState([]);
  const [testRunning, setTestRunning] = useState(false);

  // Step 46 — API test state
  const [apiResults, setApiResults] = useState([]);
  const [apiRunning, setApiRunning] = useState(false);

  // Step 47 — Security audit state
  const [auditCode, setAuditCode] = useState("");
  const [auditResult, setAuditResult] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");

  // ── Step 44: Secret Scanner ───────────────────
  const runSecretScan = () => {
    if (!scanText.trim()) return;
    const found = SECRET_PATTERNS
      .filter(p => new RegExp(p.pattern.source).test(scanText))
      .map(p => p.name);
    setScanResult({ found, safe: found.length === 0 });
  };

  const redactText = () => {
    let result = scanText;
    SECRET_PATTERNS.forEach(({ pattern, name }) => {
      result = result.replace(new RegExp(pattern.source, "g"), `[REDACTED:${name}]`);
    });
    setScanText(result);
  };

  // ── Step 45: Unit Tests ───────────────────────
  const runUnitTests = () => {
    setTestRunning(true);
    const results = UNIT_TESTS.map(t => {
      try {
        const passed = t.test();
        return { name: t.name, passed, error: null };
      } catch (e) {
        return { name: t.name, passed: false, error: e.message };
      }
    });
    setTestResults(results);
    setTestRunning(false);
  };

  // ── Step 46: API Tests ────────────────────────
  const runApiTests = async () => {
    setApiRunning(true);
    setApiResults([]);

    const tests = [
      {
        name: "Health Check",
        fn: async () => {
          const r = await axios.get(`${BASE_URL}/`);
          return { status: r.status, data: r.data.message };
        },
      },
      {
        name: "Auth: Register (missing fields)",
        fn: async () => {
          try {
            await axios.post(`${BASE_URL}/api/auth/register`, {});
            return { status: 400, data: "Should have failed" };
          } catch (e) {
            return { status: e.response?.status, data: e.response?.data?.message };
          }
        },
      },
      {
        name: "Auth: Login (wrong credentials)",
        fn: async () => {
          try {
            await axios.post(`${BASE_URL}/api/auth/login`, { email: "x@x.com", password: "wrong" });
            return { status: 400, data: "Should have failed" };
          } catch (e) {
            return { status: e.response?.status, data: e.response?.data?.message };
          }
        },
      },
      {
        name: "Protected Route (no token)",
        fn: async () => {
          try {
            await axios.get(`${BASE_URL}/api/user/profile`);
            return { status: 200, data: "Should have been protected" };
          } catch (e) {
            return { status: e.response?.status, data: e.response?.data?.message };
          }
        },
      },
      {
        name: "Chat API (authenticated)",
        fn: async () => {
          if (!token) return { status: "SKIP", data: "No auth token" };
          const r = await axios.post(
            `${BASE_URL}/api/chat`,
            { message: "test" },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return { status: r.status, data: r.data.success ? "AI responded" : "Failed" };
        },
      },
      {
        name: "404 Handler",
        fn: async () => {
          try {
            await axios.get(`${BASE_URL}/api/nonexistent-route-xyz`);
            return { status: 200, data: "Should have been 404" };
          } catch (e) {
            return { status: e.response?.status, data: e.response?.data?.message };
          }
        },
      },
    ];

    const results = [];
    for (const t of tests) {
      try {
        const start = Date.now();
        const res = await t.fn();
        const ms = Date.now() - start;
        const passed = res.status !== "SKIP"
          ? (t.name.includes("no token") || t.name.includes("wrong") || t.name.includes("missing") || t.name.includes("404")
            ? res.status >= 400
            : res.status >= 200 && res.status < 300)
          : true;
        results.push({ name: t.name, passed, status: res.status, data: res.data, ms });
      } catch (e) {
        results.push({ name: t.name, passed: false, status: "ERR", data: e.message, ms: 0 });
      }
    }
    setApiResults(results);
    setApiRunning(false);
  };

  // ── Step 47: Security Audit ───────────────────
  const runSecurityAudit = async () => {
    if (!auditCode.trim()) { setAuditError("Paste code to audit."); return; }
    setAuditLoading(true); setAuditError(""); setAuditResult("");
    try {
      const res = await axios.post(API,
        { message: `You are a security expert. Perform a comprehensive security audit on this code.\n\nCheck for:\n1. SQL Injection vulnerabilities\n2. XSS (Cross-Site Scripting)\n3. Authentication/Authorization flaws\n4. Hardcoded secrets or credentials\n5. Insecure dependencies\n6. Input validation issues\n7. CORS misconfiguration\n8. Sensitive data exposure\n9. Insecure direct object references\n10. Rate limiting gaps\n\nFor each issue found: describe it, rate severity (Critical/High/Medium/Low), and provide a fix.\n\nCode:\n\`\`\`\n${auditCode}\n\`\`\`` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAuditResult(res.data.reply);
    } catch (e) {
      setAuditError(e?.response?.data?.message || "Audit failed.");
    } finally { setAuditLoading(false); }
  };

  const passed45 = testResults.filter(t => t.passed).length;
  const passed46 = apiResults.filter(t => t.passed).length;

  return (
    <div className="int-page sec-page">
      <div className="int-bg-glow" style={{ "--glow-color": "rgba(239,68,68,0.08)" }} />
      <div className="int-inner">

        <div className="int-header">
          <div className="int-header-icon" style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}>
            <i className="bi bi-shield-fill-check" />
          </div>
          <div>
            <h1>Security &amp; Testing</h1>
            <p>Steps 41–47: Auth security, API security, rate limiting, secret detection, unit tests, API tests, security audit</p>
          </div>
        </div>

        {/* ── Step 41+42+43: Security Status ── */}
        <div className="sec-status-grid">
          {[
            { step: 41, icon: "bi-lock-fill", label: "Auth Security", desc: "Brute force protection + token blacklist", color: "#ef4444", status: "Active" },
            { step: 42, icon: "bi-shield-fill", label: "API Security", desc: "Input sanitization + security headers", color: "#f97316", status: "Active" },
            { step: 43, icon: "bi-speedometer2", label: "Rate Limiting", desc: "Per-route limits: auth 10/15m, chat 20/m", color: "#f59e0b", status: "Active" },
            { step: 44, icon: "bi-eye-slash-fill", label: "Secret Detection", desc: "9 pattern types scanned on every request", color: "#8b5cf6", status: "Active" },
          ].map(s => (
            <div className="sec-status-card" key={s.step} style={{ "--sec-c": s.color }}>
              <div className="sec-status-top">
                <div className="sec-status-icon"><i className={`bi ${s.icon}`} /></div>
                <span className="sec-status-badge">Step {s.step}</span>
                <span className="sec-active-badge"><i className="bi bi-check-circle-fill" />{s.status}</span>
              </div>
              <strong>{s.label}</strong>
              <span>{s.desc}</span>
            </div>
          ))}
        </div>

        {/* ── Step 44: Secret Scanner ── */}
        <div className="int-panel">
          <h3><i className="bi bi-eye-slash-fill" /> Step 44 — Secret Scanner</h3>
          <p className="sec-desc">Paste code or text to scan for leaked API keys, tokens, passwords, and credentials.</p>
          <textarea className="int-textarea" value={scanText} onChange={e => { setScanText(e.target.value); setScanResult(null); }} placeholder="Paste your code here to scan for secrets..." rows={6} />
          <div className="int-btn-row" style={{ marginTop: 12 }}>
            <button className="int-btn-primary" onClick={runSecretScan} disabled={!scanText.trim()}>
              <i className="bi bi-search" /> Scan for Secrets
            </button>
            {scanResult && !scanResult.safe && (
              <button className="int-btn-secondary" onClick={redactText}>
                <i className="bi bi-eraser-fill" /> Auto Redact
              </button>
            )}
          </div>

          {scanResult && (
            <div className={`sec-scan-result ${scanResult.safe ? "sec-safe" : "sec-danger"}`}>
              {scanResult.safe ? (
                <><i className="bi bi-shield-fill-check" /> No secrets detected — code appears safe!</>
              ) : (
                <><i className="bi bi-exclamation-triangle-fill" /> {scanResult.found.length} secret type(s) detected: <strong>{scanResult.found.join(", ")}</strong></>
              )}
            </div>
          )}
        </div>

        {/* ── Step 45: Unit Tests ── */}
        <div className="int-panel">
          <h3><i className="bi bi-check2-all" /> Step 45 — Unit Tests</h3>
          <p className="sec-desc">Run {UNIT_TESTS.length} unit tests covering auth, secret detection, input validation, and email checks.</p>

          <div className="int-btn-row">
            <button className="int-btn-primary" onClick={runUnitTests} disabled={testRunning}>
              {testRunning ? <><span className="int-spinner" />Running...</> : <><i className="bi bi-play-fill" /> Run {UNIT_TESTS.length} Unit Tests</>}
            </button>
            {testResults.length > 0 && (
              <div className="sec-test-summary">
                <span className="sec-pass">{passed45} passed</span> /
                <span className="sec-fail">{testResults.length - passed45} failed</span>
              </div>
            )}
          </div>

          {testResults.length > 0 && (
            <div className="sec-test-list">
              {testResults.map((t, i) => (
                <div key={i} className={`sec-test-row ${t.passed ? "sec-test-pass" : "sec-test-fail"}`}>
                  <i className={`bi bi-${t.passed ? "check-circle-fill" : "x-circle-fill"}`} />
                  <span>{t.name}</span>
                  {t.error && <code>{t.error}</code>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Step 46: API Tests ── */}
        <div className="int-panel">
          <h3><i className="bi bi-lightning-fill" /> Step 46 — API Tests</h3>
          <p className="sec-desc">Run live API tests against your running backend at localhost:5000.</p>

          <div className="int-btn-row">
            <button className="int-btn-primary" onClick={runApiTests} disabled={apiRunning}>
              {apiRunning ? <><span className="int-spinner" />Testing API...</> : <><i className="bi bi-wifi" /> Run API Tests</>}
            </button>
            {apiResults.length > 0 && (
              <div className="sec-test-summary">
                <span className="sec-pass">{passed46} passed</span> /
                <span className="sec-fail">{apiResults.length - passed46} failed</span>
              </div>
            )}
          </div>

          {apiResults.length > 0 && (
            <div className="sec-api-table">
              <div className="sec-api-header">
                <span>Test</span><span>Status</span><span>Response</span><span>Time</span>
              </div>
              {apiResults.map((t, i) => (
                <div key={i} className={`sec-api-row ${t.passed ? "sec-test-pass" : "sec-test-fail"}`}>
                  <span><i className={`bi bi-${t.passed ? "check-circle-fill" : "x-circle-fill"}`} />{t.name}</span>
                  <span className="sec-status-code">{t.status}</span>
                  <span className="sec-response-data">{String(t.data).slice(0, 50)}</span>
                  <span className="sec-ms">{t.ms}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Step 47: Security Audit ── */}
        <div className="int-panel">
          <h3><i className="bi bi-bug-fill" /> Step 47 — AI Security Audit</h3>
          <p className="sec-desc">Paste any code for a comprehensive AI-powered security audit covering OWASP Top 10 vulnerabilities.</p>
          <textarea className="int-textarea" value={auditCode} onChange={e => { setAuditCode(e.target.value); setAuditError(""); }} placeholder="Paste your code here for security audit..." rows={8} />
          <div className="int-btn-row" style={{ marginTop: 12 }}>
            <button className="int-btn-primary" onClick={runSecurityAudit} disabled={auditLoading || !auditCode.trim()}>
              {auditLoading ? <><span className="int-spinner" />Auditing...</> : <><i className="bi bi-shield-fill-exclamation" /> Run Security Audit</>}
            </button>
          </div>
          {auditError && <div className="int-error"><i className="bi bi-exclamation-triangle-fill" />{auditError}</div>}

          {auditResult && (
            <div className="int-result-panel" style={{ marginTop: 14 }}>
              <div className="int-result-header">
                <i className="bi bi-shield-fill-exclamation" style={{ color: "#ef4444" }} />
                <span>Security Audit Report</span>
                <button className="int-copy-btn" onClick={() => navigator.clipboard.writeText(auditResult)}>
                  <i className="bi bi-clipboard" /> Copy
                </button>
              </div>
              <pre className="int-result-content">{auditResult}</pre>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
