import React, { useState } from "react";
import axios from "axios";
import "./AdminLogin.css";

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${(import.meta.env.VITE_API_URL || 'http://localhost:5000')}/api/auth/admin/login`,
        {
          email: email.trim(),
          password,
        }
      );

      if (response.data.success) {
        const { token, admin } = response.data;

        sessionStorage.setItem("vexoraai_admin_token", token);
        sessionStorage.setItem("vexoraai_admin", JSON.stringify(admin));

        onLogin(admin);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to login. Check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* Background glows */}
      <div className="al-glow al-glow-1" />
      <div className="al-glow al-glow-2" />

      <div className="admin-login-card">

        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo">A</div>
          <h1>VEXORA AI</h1>
          <p>Admin Control Center</p>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h2>Welcome Back</h2>
          <p>Sign in to manage your AI platform.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>

          <label htmlFor="admin-email">Email Address</label>
          <div className="al-input-wrap">
            <i className="bi bi-envelope al-input-icon" />
            <input
              id="admin-email"
              type="email"
              placeholder="admin@vexoraai.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <label htmlFor="admin-password">Password</label>
          <div className="al-input-wrap">
            <i className="bi bi-lock al-input-icon" />
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="al-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <i className={`bi bi-eye${showPassword ? "-slash" : ""}`} />
            </button>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <i className="bi bi-exclamation-triangle-fill" />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="al-submit-btn">
            {loading ? (
              <>
                <span className="al-spinner" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <i className="bi bi-arrow-right" />
              </>
            )}
          </button>

        </form>

        {/* Security badge */}
        <div className="login-footer">
          <i className="bi bi-shield-lock-fill" />
          Protected VEXORA AI Admin Area
        </div>

      </div>
    </div>
  );
}

export default AdminLogin;
