import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const getStrength = (p) => {
  if (!p) return { level: 0, label: "", color: "" };
  let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  return [{ level: 1, label: "Weak", color: "#f87171" }, { level: 2, label: "Fair", color: "#fb923c" }, { level: 3, label: "Good", color: "#4ade80" }, { level: 4, label: "Strong", color: "#00d4ff" }][s - 1] || { level: 0, label: "", color: "" };
};

export default function RegisterPage({ onSwitchToLogin }) {
  const { register, authLoading, authError, clearError } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", role: "user" });
  const [showPwd, setShowPwd] = useState(false);
  const [showCnf, setShowCnf] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const onChange = (e) => { setErr(""); clearError(); setForm(p => ({ ...p, [e.target.name]: e.target.value })); };

  const onSubmit = async (e) => {
    e.preventDefault(); setErr("");
    if (!form.name.trim()) return setErr("Full name is required.");
    if (form.name.trim().length < 2) return setErr("Name must be at least 2 characters.");
    if (!form.email.trim()) return setErr("Email is required.");
    if (!form.email.includes("@")) return setErr("Enter a valid email.");
    if (!form.password) return setErr("Password is required.");
    if (form.password.length < 6) return setErr("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setErr("Passwords do not match.");
    const res = await register(form.name.trim(), form.email.trim(), form.password, form.role);
    if (res.success) { setOk("Account created! Redirecting…"); setTimeout(() => onSwitchToLogin(), 1800); }
  };

  const str = getStrength(form.password);
  const error = err || authError;

  return (
    <div className="nv-root">
      <div className="nv-bg" />
      <div className="nv-rays" />
      {Array.from({ length: 18 }, (_, i) => (
        <div key={i} className="nv-particle" style={{
          left: `${5 + i * 5.2}%`, animationDelay: `${i * 0.35}s`, animationDuration: `${3 + i % 3}s`,
          width: i % 3 === 0 ? '3px' : i % 3 === 1 ? '2px' : '4px', height: i % 3 === 0 ? '3px' : i % 3 === 1 ? '2px' : '4px',
        }} />
      ))}

      <div className="nv-shell nv-shell-reg">

        {/* LEFT */}
        <div className="nv-left">
          <div className="nv-left-inner">
            <div className="nv-hero-logo">
              <div className="nv-ring nv-ring1" /><div className="nv-ring nv-ring2" /><div className="nv-ring nv-ring3" />
              <img src="/logo.png" alt="VEXORA AI" className="nv-hero-img" />
            </div>
            <h1 className="nv-hero-title">VEXORA<br /><span>AI</span></h1>
            <p className="nv-hero-tag">BUILD · CODE · CREATE</p>

            <div className="nv-perk-list">
              {[
                { icon: "bi-stars", t: "GPT-4o + Gemini AI" },
                { icon: "bi-code-slash", t: "Smart Code Editor" },
                { icon: "bi-play-circle-fill", t: "Run & Debug Code" },
                { icon: "bi-database-fill", t: "SQL Assistant" },
                { icon: "bi-folder2-open", t: "Project Generator" },
                { icon: "bi-clock-history", t: "Chat History" },
              ].map(f => (
                <div key={f.t} className="nv-perk">
                  <i className={`bi ${f.icon}`} /><span>{f.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="nv-right nv-right-reg">
          <div className="nv-form-card nv-form-card-reg">
            <div className="nv-accent-bar" />

            <div className="nv-form-logo-row">
              <img src="/logo.png" alt="V" className="nv-form-logo" />
              <div>
                <p className="nv-form-brand">VEXORA <span>AI</span></p>
                <p className="nv-form-tagline">Developer Platform</p>
              </div>
            </div>

            <h2 className="nv-form-title">Create Account</h2>
            <p className="nv-form-sub">Join the AI developer platform</p>

            <div className="nv-tabs">
              <button className="nv-tab" onClick={onSwitchToLogin}>Sign In</button>
              <button className="nv-tab nv-tab-on">Sign Up</button>
            </div>

            {error && <div className="nv-err"><i className="bi bi-exclamation-circle-fill" /><span>{error}</span></div>}
            {ok && <div className="nv-ok"><i className="bi bi-check-circle-fill" /><span>{ok}</span></div>}

            <form onSubmit={onSubmit} noValidate className="nv-form">

              <div className="nv-grid2">
                <div className="nv-field">
                  <label>Full Name</label>
                  <div className="nv-inp-wrap">
                    <i className="bi bi-person-fill nv-inp-icon" />
                    <input type="text" name="name" value={form.name} onChange={onChange}
                      placeholder="Your name" autoComplete="name" autoFocus disabled={authLoading} />
                  </div>
                </div>
                <div className="nv-field">
                  <label>Email Address</label>
                  <div className="nv-inp-wrap">
                    <i className="bi bi-envelope-fill nv-inp-icon" />
                    <input type="email" name="email" value={form.email} onChange={onChange}
                      placeholder="you@example.com" autoComplete="email" disabled={authLoading} />
                  </div>
                </div>
              </div>

              <div className="nv-grid2">
                <div className="nv-field">
                  <label>Password</label>
                  <div className="nv-inp-wrap">
                    <i className="bi bi-lock-fill nv-inp-icon" />
                    <input type={showPwd ? "text" : "password"} name="password" value={form.password} onChange={onChange}
                      placeholder="Min. 6 characters" autoComplete="new-password" disabled={authLoading} />
                    <button type="button" className="nv-eye" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
                      <i className={`bi bi-eye${showPwd ? "-slash" : ""}`} />
                    </button>
                  </div>
                  {form.password && (
                    <div className="nv-strength">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="nv-str" style={{ background: i <= str.level ? str.color : "rgba(255,255,255,.1)" }} />
                      ))}
                      {str.label && <span style={{ color: str.color, fontSize: 9, fontWeight: 700 }}>{str.label}</span>}
                    </div>
                  )}
                </div>
                <div className="nv-field">
                  <label>Confirm Password</label>
                  <div className="nv-inp-wrap">
                    <i className="bi bi-shield-lock-fill nv-inp-icon" />
                    <input type={showCnf ? "text" : "password"} name="confirm" value={form.confirm} onChange={onChange}
                      placeholder="Repeat password" autoComplete="new-password" disabled={authLoading} />
                    <button type="button" className="nv-eye" onClick={() => setShowCnf(!showCnf)} tabIndex={-1}>
                      <i className={`bi bi-eye${showCnf ? "-slash" : ""}`} />
                    </button>
                  </div>
                  {form.confirm && (
                    <div className={`nv-match ${form.password === form.confirm ? "nv-m-ok" : "nv-m-fail"}`}>
                      <i className={`bi bi-${form.password === form.confirm ? "check" : "x"}-circle-fill`} />
                      {form.password === form.confirm ? "Match" : "No match"}
                    </div>
                  )}
                </div>
              </div>

              <div className="nv-field">
                <label>Account Type</label>
                <div className="nv-role-row">
                  {[
                    { id: "user", icon: "bi-person-fill", label: "Developer", sub: "Standard access", adm: false },
                    { id: "admin", icon: "bi-shield-fill-check", label: "Admin", sub: "Full platform access", adm: true },
                  ].map(r => (
                    <button key={r.id} type="button"
                      className={`nv-role ${form.role === r.id ? "nv-role-on" : ""} ${r.adm ? "nv-role-adm" : ""}`}
                      onClick={() => setForm(p => ({ ...p, role: r.id }))} disabled={authLoading}>
                      <div className={`nv-role-ico ${r.adm ? "nv-ri-adm" : ""}`}><i className={`bi ${r.icon}`} /></div>
                      <div><strong>{r.label}</strong><span>{r.sub}</span></div>
                      {form.role === r.id && <i className="bi bi-check-circle-fill nv-role-chk" />}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="nv-btn" disabled={authLoading}>
                <span className="nv-btn-inner">
                  {authLoading
                    ? <><span className="nv-spin" /><span>Creating account…</span></>
                    : <><i className="bi bi-person-plus-fill" /><span>Create Account</span></>}
                </span>
                <div className="nv-btn-glow" />
              </button>
            </form>

            <p className="nv-switch">
              Have an account?{" "}
              <button className="nv-switch-link" onClick={onSwitchToLogin}>Sign in →</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
