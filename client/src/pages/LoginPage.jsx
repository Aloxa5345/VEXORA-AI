import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ForgotPasswordModal from "./ForgotPasswordModal";
import "./Auth.css";

export default function LoginPage({ onSwitchToRegister, onLoginSuccess }) {
  const { login, authLoading, authError, clearError } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const onChange = (e) => { setErr(""); clearError(); setForm(p => ({ ...p, [e.target.name]: e.target.value })); };

  const onSubmit = async (e) => {
    e.preventDefault(); setErr("");
    if (!form.email.trim()) return setErr("Email is required.");
    if (!form.email.includes("@")) return setErr("Enter a valid email address.");
    if (!form.password) return setErr("Password is required.");
    if (form.password.length < 6) return setErr("Password must be at least 6 characters.");
    const res = await login(form.email.trim(), form.password);
    if (res.success && onLoginSuccess) onLoginSuccess(res.role);
  };

  const error = err || authError;

  return (
    <div className="nv-root">
      {/* Animated background */}
      <div className="nv-bg" />
      <div className="nv-rays" />
      {/* Particle dots */}
      {Array.from({ length: 18 }, (_, i) => (
        <div key={i} className="nv-particle" style={{
          left: `${5 + i * 5.2}%`,
          animationDelay: `${i * 0.35}s`,
          animationDuration: `${3 + i % 3}s`,
          width: i % 3 === 0 ? '3px' : i % 3 === 1 ? '2px' : '4px',
          height: i % 3 === 0 ? '3px' : i % 3 === 1 ? '2px' : '4px',
        }} />
      ))}      <div className="nv-shell">

        {/* ── LEFT — Brand side ── */}
        <div className="nv-left">
          <div className="nv-left-inner">
            {/* Big logo with glow rings */}
            <div className="nv-hero-logo">
              <div className="nv-ring nv-ring1" />
              <div className="nv-ring nv-ring2" />
              <div className="nv-ring nv-ring3" />
              <img src="/logo.png" alt="VEXORA AI" className="nv-hero-img" />
            </div>

            <h1 className="nv-hero-title">VEXORA<br /><span>AI</span></h1>
            <p className="nv-hero-tag">BUILD · CODE · CREATE</p>

            <div className="nv-feature-chips">
              {["GPT-4o + Gemini", "Code Editor", "Run & Debug", "SQL Assistant", "Project Gen", "JWT Auth"].map(f => (
                <span key={f} className="nv-chip">{f}</span>
              ))}
            </div>

            <div className="nv-stats-row">
              {[["10+", "AI Tools"], ["∞", "Requests"], ["Free", "Forever"]].map(([v, l]) => (
                <div key={l} className="nv-stat">
                  <strong>{v}</strong><span>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT — Form side ── */}
        <div className="nv-right">
          <div className="nv-form-card">

            {/* Top accent */}
            <div className="nv-accent-bar" />

            {/* Header */}
            <div className="nv-form-logo-row">
              <img src="/logo.png" alt="V" className="nv-form-logo" />
              <div>
                <p className="nv-form-brand">VEXORA <span>AI</span></p>
                <p className="nv-form-tagline">Developer Platform</p>
              </div>
            </div>

            <h2 className="nv-form-title">Sign In</h2>
            <p className="nv-form-sub">Access your AI workspace</p>

            {/* Tabs */}
            <div className="nv-tabs">
              <button className="nv-tab nv-tab-on">Sign In</button>
              <button className="nv-tab" onClick={onSwitchToRegister}>Sign Up</button>
            </div>

            {error && (
              <div className="nv-err">
                <i className="bi bi-exclamation-circle-fill" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} noValidate className="nv-form">

              <div className="nv-field">
                <label>Email Address</label>
                <div className="nv-inp-wrap">
                  <i className="bi bi-envelope-fill nv-inp-icon" />
                  <input
                    type="email" name="email"
                    value={form.email} onChange={onChange}
                    placeholder="you@example.com"
                    autoComplete="email" autoFocus disabled={authLoading}
                  />
                </div>
              </div>

              <div className="nv-field">
                <label>Password</label>
                <div className="nv-inp-wrap">
                  <i className="bi bi-lock-fill nv-inp-icon" />
                  <input
                    type={showPwd ? "text" : "password"} name="password"
                    value={form.password} onChange={onChange}
                    placeholder="Enter your password"
                    autoComplete="current-password" disabled={authLoading}
                  />
                  <button type="button" className="nv-eye" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
                    <i className={`bi bi-eye${showPwd ? "-slash" : ""}`} />
                  </button>
                </div>
                {/* Forgot password link */}
                <div style={{ textAlign: "right", marginTop: "5px" }}>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontFamily: "inherit", fontSize: "11.5px", fontWeight: 700, padding: 0,
                      backgroundImage: "linear-gradient(135deg,#7c3aed,#ec4899,#f97316)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Access level */}
              <div className="nv-access">
                <span className="nv-access-item nv-ai-user"><i className="bi bi-person-fill" />User → Dashboard</span>
                <span className="nv-access-item nv-ai-admin"><i className="bi bi-shield-fill-check" />Admin → Panel</span>
              </div>

              <button type="submit" className="nv-btn" disabled={authLoading}>
                <span className="nv-btn-inner">
                  {authLoading
                    ? <><span className="nv-spin" /><span>Signing in…</span></>
                    : <><i className="bi bi-arrow-right-circle-fill" /><span>Sign In</span></>}
                </span>
                <div className="nv-btn-glow" />
              </button>
            </form>

            <p className="nv-switch">
              No account?{" "}
              <button className="nv-switch-link" onClick={onSwitchToRegister}>Create one free →</button>
            </p>

            <div className="nv-trust-row">
              <span><i className="bi bi-shield-lock" /> Secure</span>
              <span className="nv-dot" />
              <span><i className="bi bi-lock" /> Encrypted</span>
              <span className="nv-dot" />
              <span><i className="bi bi-stars" /> AI Powered</span>
            </div>
          </div>
        </div>
      </div>
      {/* Forgot password modal */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}
