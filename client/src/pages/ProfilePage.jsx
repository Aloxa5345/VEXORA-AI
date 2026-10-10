import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./ProfilePage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/user';

export default function ProfilePage() {
  const { user, token, login } = useAuth();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalMessages: 0, totalSessions: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const [nameForm, setNameForm] = useState({ name: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });

  const [nameMsg, setNameMsg] = useState({ text: "", ok: true });
  const [pwMsg, setPwMsg] = useState({ text: "", ok: true });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const headers = { Authorization: `Bearer ${token}` };

  // ── Fetch profile ──────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/profile`, { headers });
        setProfile(res.data.user);
        setStats(res.data.stats || { totalMessages: 0, totalSessions: 0 });
        setNameForm({ name: res.data.user.name });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // ── Update name ────────────────────────────────
  const handleNameSave = async (e) => {
    e.preventDefault();
    if (!nameForm.name.trim()) return setNameMsg({ text: "Name is required.", ok: false });
    setSaving(true); setNameMsg({ text: "", ok: true });
    try {
      const res = await axios.put(`${API}/profile`, { name: nameForm.name.trim() }, { headers });
      setProfile(res.data.user);
      setNameMsg({ text: "✅ Name updated successfully!", ok: true });
    } catch (e) {
      setNameMsg({ text: e?.response?.data?.message || "Update failed.", ok: false });
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ────────────────────────────
  const handlePwSave = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm)
      return setPwMsg({ text: "All fields are required.", ok: false });
    if (pwForm.newPassword.length < 6)
      return setPwMsg({ text: "New password must be at least 6 characters.", ok: false });
    if (pwForm.newPassword !== pwForm.confirm)
      return setPwMsg({ text: "Passwords do not match.", ok: false });

    setPwSaving(true); setPwMsg({ text: "", ok: true });
    try {
      await axios.put(`${API}/change-password`, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }, { headers });
      setPwMsg({ text: "✅ Password changed successfully!", ok: true });
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (e) {
      setPwMsg({ text: e?.response?.data?.message || "Password change failed.", ok: false });
    } finally {
      setPwSaving(false);
    }
  };

  // password strength
  const getPwStrength = (pwd) => {
    if (!pwd) return { level: 0, label: "", color: "" };
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return [
      { level: 1, label: "Weak", color: "#f87171" },
      { level: 2, label: "Fair", color: "#fb923c" },
      { level: 3, label: "Good", color: "#a3e635" },
      { level: 4, label: "Strong", color: "#10b981" },
    ][s - 1] || { level: 0, label: "", color: "" };
  };

  const strength = getPwStrength(pwForm.newPassword);
  const initials = profile?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U";
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  if (loading) return (
    <div className="pp-loading">
      <div className="pp-spinner" />
      <span>Loading profile…</span>
    </div>
  );

  return (
    <div className="pp-root">
      {/* Bg glow */}
      <div className="pp-glow-a" />
      <div className="pp-glow-b" />

      <div className="pp-inner">

        {/* ── Hero card ── */}
        <div className="pp-hero">
          <div className="pp-hero-bg" />
          <div className="pp-hero-content">
            <div className="pp-avatar-wrap">
              <div className="pp-avatar">{initials}</div>
              <div className="pp-avatar-ring" />
            </div>
            <div className="pp-hero-info">
              <h1 className="pp-hero-name">{profile?.name}</h1>
              <p className="pp-hero-email">
                <i className="bi bi-envelope-fill" />
                {profile?.email}
              </p>
              <div className="pp-hero-meta">
                <span className={`pp-role-badge ${profile?.role === "admin" ? "pp-role-admin" : "pp-role-user"}`}>
                  <i className={`bi bi-${profile?.role === "admin" ? "shield-fill-check" : "person-fill"}`} />
                  {profile?.role === "admin" ? "Administrator" : "Developer"}
                </span>
                <span className="pp-joined">
                  <i className="bi bi-calendar3" />
                  Joined {joinedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="pp-stats">
            {[
              { icon: "bi-chat-dots-fill", label: "Messages", value: stats.totalMessages, color: "#7c3aed" },
              { icon: "bi-collection-fill", label: "Sessions", value: stats.totalSessions, color: "#ec4899" },
              { icon: "bi-stars", label: "AI Model", value: "Gemini", color: "#06b6d4" },
              { icon: "bi-lightning-fill", label: "Plan", value: "Free", color: "#10b981" },
            ].map((s, i) => (
              <div key={i} className="pp-stat" style={{ "--sc": s.color }}>
                <div className="pp-stat-icon"><i className={`bi ${s.icon}`} /></div>
                <div className="pp-stat-info">
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="pp-tabs">
          {[
            { id: "overview", icon: "bi-person-fill", label: "Overview" },
            { id: "edit", icon: "bi-pencil-fill", label: "Edit Profile" },
            { id: "security", icon: "bi-shield-lock-fill", label: "Security" },
          ].map(t => (
            <button
              key={t.id}
              className={`pp-tab ${activeTab === t.id ? "pp-tab-active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <i className={`bi ${t.icon}`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ════ OVERVIEW TAB ════ */}
        {activeTab === "overview" && (
          <div className="pp-section-grid">
            {/* Account Info */}
            <div className="pp-card">
              <div className="pp-card-head">
                <i className="bi bi-person-vcard-fill" />
                <h3>Account Information</h3>
              </div>
              <div className="pp-info-list">
                {[
                  { label: "Full Name", value: profile?.name, icon: "bi-person" },
                  { label: "Email", value: profile?.email, icon: "bi-envelope" },
                  { label: "Role", value: profile?.role === "admin" ? "👑 Administrator" : "👤 Developer", icon: "bi-shield" },
                  { label: "Member Since", value: joinedDate, icon: "bi-calendar3" },
                  { label: "Account ID", value: `#${profile?.id}`, icon: "bi-hash" },
                ].map((item, i) => (
                  <div key={i} className="pp-info-row">
                    <span className="pp-info-label">
                      <i className={`bi ${item.icon}`} />
                      {item.label}
                    </span>
                    <span className="pp-info-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div className="pp-card">
              <div className="pp-card-head">
                <i className="bi bi-activity" />
                <h3>Activity Summary</h3>
              </div>
              <div className="pp-activity-grid">
                <div className="pp-act-card" style={{ "--ac": "#7c3aed" }}>
                  <i className="bi bi-chat-dots-fill" />
                  <strong>{stats.totalMessages}</strong>
                  <span>Total Messages</span>
                </div>
                <div className="pp-act-card" style={{ "--ac": "#ec4899" }}>
                  <i className="bi bi-collection-fill" />
                  <strong>{stats.totalSessions}</strong>
                  <span>Chat Sessions</span>
                </div>
                <div className="pp-act-card" style={{ "--ac": "#06b6d4" }}>
                  <i className="bi bi-cpu-fill" />
                  <strong>Gemini</strong>
                  <span>AI Provider</span>
                </div>
                <div className="pp-act-card" style={{ "--ac": "#10b981" }}>
                  <i className="bi bi-check-circle-fill" />
                  <strong>Active</strong>
                  <span>Status</span>
                </div>
              </div>

              <div className="pp-capabilities">
                <p className="pp-cap-label">Capabilities</p>
                {[
                  { icon: "bi-code-slash", label: "Code Generation" },
                  { icon: "bi-bug-fill", label: "Debug Assistant" },
                  { icon: "bi-database", label: "SQL Tools" },
                  { icon: "bi-lightning", label: "Code Optimization" },
                ].map((c, i) => (
                  <div key={i} className="pp-cap-row">
                    <div className="pp-cap-icon"><i className={`bi ${c.icon}`} /></div>
                    <span>{c.label}</span>
                    <span className="pp-cap-status">
                      <i className="bi bi-check-circle-fill" /> Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ EDIT PROFILE TAB ════ */}
        {activeTab === "edit" && (
          <div className="pp-card pp-card-single">
            <div className="pp-card-head">
              <i className="bi bi-pencil-square" />
              <h3>Edit Profile</h3>
            </div>

            <form onSubmit={handleNameSave} className="pp-form">
              {nameMsg.text && (
                <div className={`pp-alert ${nameMsg.ok ? "pp-alert-ok" : "pp-alert-err"}`}>
                  <i className={`bi bi-${nameMsg.ok ? "check-circle" : "exclamation-triangle"}-fill`} />
                  {nameMsg.text}
                </div>
              )}

              <div className="pp-field">
                <label><i className="bi bi-person" /> Full Name</label>
                <input
                  type="text"
                  value={nameForm.name}
                  onChange={e => setNameForm({ name: e.target.value })}
                  placeholder="Your full name"
                  disabled={saving}
                />
              </div>

              <div className="pp-field">
                <label><i className="bi bi-envelope" /> Email Address</label>
                <input
                  type="email"
                  value={profile?.email}
                  disabled
                  className="pp-input-disabled"
                />
                <p className="pp-field-hint">Email cannot be changed.</p>
              </div>

              <div className="pp-field">
                <label><i className="bi bi-shield" /> Account Role</label>
                <input
                  type="text"
                  value={profile?.role === "admin" ? "👑 Administrator" : "👤 Developer"}
                  disabled
                  className="pp-input-disabled"
                />
              </div>

              <button type="submit" className="pp-save-btn" disabled={saving}>
                {saving
                  ? <><span className="pp-btn-spinner" /> Saving…</>
                  : <><i className="bi bi-check-lg" /> Save Changes</>}
              </button>
            </form>
          </div>
        )}

        {/* ════ SECURITY TAB ════ */}
        {activeTab === "security" && (
          <div className="pp-card pp-card-single">
            <div className="pp-card-head">
              <i className="bi bi-shield-lock-fill" />
              <h3>Change Password</h3>
            </div>

            <form onSubmit={handlePwSave} className="pp-form">
              {pwMsg.text && (
                <div className={`pp-alert ${pwMsg.ok ? "pp-alert-ok" : "pp-alert-err"}`}>
                  <i className={`bi bi-${pwMsg.ok ? "check-circle" : "exclamation-triangle"}-fill`} />
                  {pwMsg.text}
                </div>
              )}

              {/* Current password */}
              <div className="pp-field">
                <label><i className="bi bi-lock" /> Current Password</label>
                <div className="pp-input-wrap">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    disabled={pwSaving}
                  />
                  <button type="button" className="pp-eye" onClick={() => setShowCurrent(!showCurrent)}>
                    <i className={`bi bi-eye${showCurrent ? "-slash" : ""}`} />
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="pp-field">
                <label><i className="bi bi-lock-fill" /> New Password</label>
                <div className="pp-input-wrap">
                  <input
                    type={showNew ? "text" : "password"}
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    disabled={pwSaving}
                  />
                  <button type="button" className="pp-eye" onClick={() => setShowNew(!showNew)}>
                    <i className={`bi bi-eye${showNew ? "-slash" : ""}`} />
                  </button>
                </div>
                {pwForm.newPassword && (
                  <div className="pp-strength">
                    <div className="pp-strength-bars">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="pp-strength-seg"
                          style={{ background: i <= strength.level ? strength.color : "rgba(255,255,255,0.07)" }} />
                      ))}
                    </div>
                    {strength.label && <span style={{ color: strength.color }}>{strength.label}</span>}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="pp-field">
                <label><i className="bi bi-shield-lock" /> Confirm Password</label>
                <div className="pp-input-wrap">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={pwForm.confirm}
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat new password"
                    disabled={pwSaving}
                  />
                  <button type="button" className="pp-eye" onClick={() => setShowConfirm(!showConfirm)}>
                    <i className={`bi bi-eye${showConfirm ? "-slash" : ""}`} />
                  </button>
                </div>
                {pwForm.confirm && (
                  <div className={`pp-match ${pwForm.newPassword === pwForm.confirm ? "pp-match-ok" : "pp-match-fail"}`}>
                    <i className={`bi bi-${pwForm.newPassword === pwForm.confirm ? "check" : "x"}-circle-fill`} />
                    {pwForm.newPassword === pwForm.confirm ? "Passwords match" : "Do not match"}
                  </div>
                )}
              </div>

              <button type="submit" className="pp-save-btn" disabled={pwSaving}>
                {pwSaving
                  ? <><span className="pp-btn-spinner" /> Changing…</>
                  : <><i className="bi bi-shield-check" /> Change Password</>}
              </button>
            </form>

            {/* Security tips */}
            <div className="pp-security-tips">
              <p className="pp-tips-label"><i className="bi bi-lightbulb-fill" /> Security Tips</p>
              {[
                "Use at least 8 characters",
                "Mix uppercase, lowercase, numbers",
                "Add special characters (!@#$)",
                "Never reuse old passwords",
              ].map((tip, i) => (
                <div key={i} className="pp-tip">
                  <i className="bi bi-check-circle" />
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
