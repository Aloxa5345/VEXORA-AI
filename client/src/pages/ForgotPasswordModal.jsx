import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * ForgotPasswordModal — 3-step OTP forgot-password flow
 *
 * Step 1 — Enter email  → POST /api/auth/forgot-password  → OTP shown (dev mode)
 * Step 2 — Enter 6-digit OTP (individual boxes, auto-advance, paste support)
 * Step 3 — Set new password (strength bar + confirm)
 */

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function ForgotPasswordModal({ onClose }) {
  const { forgotPassword, verifyOtp, resetPassword, authLoading } = useAuth();

  // ── Steps: "email" | "otp" | "password" | "done" ──
  const [step, setStep] = useState("email");

  // Step 1
  const [email, setEmail] = useState("");
  const [devOtp, setDevOtp] = useState(""); // returned from server (dev mode)

  // Step 2
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef([]);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const timerRef = useRef(null);

  // Step 3
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Countdown timer for resend ──
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setResendTimer(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Password strength ──
  const strength = (() => {
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 6) s++;
    if (pwd.length >= 10) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  })();
  const strColor = ["#3f3f4f", "#f87171", "#fb923c", "#facc15", "#34d399", "#10b981"][strength];
  const strLabel = ["", "Weak", "Fair", "Good", "Strong", "Very strong"][strength];

  // ── Step 1 submit ──
  const submitEmail = async (e) => {
    e.preventDefault();
    setErr("");
    if (!email.trim()) return setErr("Email is required.");
    if (!email.includes("@")) return setErr("Enter a valid email address.");
    setLoading(true);
    const res = await forgotPassword(email.trim().toLowerCase());
    setLoading(false);
    if (!res.success) return setErr(res.message || "Something went wrong.");
    setDevOtp(res.otp || "");
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    startTimer();
    setStep("otp");
    // Auto-focus first OTP box after render
    setTimeout(() => otpRefs.current[0]?.focus(), 80);
  };

  // ── OTP box handlers ──
  const handleOtpChange = (i, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[i] = digit;
    setOtpDigits(next);
    setErr("");
    if (digit && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, idx) => { next[idx] = d; });
    setOtpDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIdx]?.focus();
  };

  // ── Step 2 submit ──
  const submitOtp = async (e) => {
    e.preventDefault();
    setErr("");
    const otp = otpDigits.join("");
    if (otp.length < OTP_LENGTH) return setErr("Please enter all 6 digits.");
    setLoading(true);
    const res = await verifyOtp(email.trim().toLowerCase(), otp);
    setLoading(false);
    if (!res.success) return setErr(res.message || "Invalid OTP.");
    setStep("password");
  };

  // ── Resend OTP ──
  const resendOtp = async () => {
    if (resendTimer > 0) return;
    setErr("");
    setLoading(true);
    const res = await forgotPassword(email.trim().toLowerCase());
    setLoading(false);
    if (!res.success) return setErr(res.message || "Failed to resend OTP.");
    setDevOtp(res.otp || "");
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    startTimer();
    setTimeout(() => otpRefs.current[0]?.focus(), 80);
  };

  // ── Step 3 submit ──
  const submitPassword = async (e) => {
    e.preventDefault();
    setErr("");
    if (!pwd) return setErr("Password is required.");
    if (pwd.length < 6) return setErr("Password must be at least 6 characters.");
    if (pwd !== confirmPwd) return setErr("Passwords do not match.");
    setLoading(true);
    const otp = otpDigits.join("");
    const res = await resetPassword(email.trim().toLowerCase(), otp, pwd);
    setLoading(false);
    if (!res.success) return setErr(res.message || "Something went wrong.");
    setStep("done");
  };

  // ── Shared styles ──
  const cardStyle = {
    width: "100%", maxWidth: "420px",
    background: "rgba(14,12,26,0.97)",
    border: "1px solid rgba(124,58,237,0.22)",
    borderRadius: "16px", padding: "32px 28px",
    boxShadow: "0 40px 80px rgba(0,0,0,0.70), 0 0 60px rgba(124,58,237,0.10)",
    position: "relative",
  };

  const stepTitle = { email: "Forgot Password?", otp: "Enter OTP", password: "Set New Password", done: "Password Updated!" };
  const stepSub = {
    email: "Enter your email and we'll send a 6-digit OTP.",
    otp: `Enter the 6-digit code sent to ${email}.`,
    password: "Almost there — choose your new password.",
    done: "Your password has been changed. You can sign in now.",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(7,6,15,0.82)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "nv-in .25s cubic-bezier(.34,1.1,.64,1) both",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={cardStyle}>

        {/* Animated accent bar */}
        <div className="nv-accent-bar" style={{ marginBottom: "22px" }} />

        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: "16px", right: "16px",
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(249,168,212,0.40)", fontSize: "18px", lineHeight: 1,
        }}>
          <i className="bi bi-x-lg" />
        </button>

        {/* Icon */}
        <div style={{
          width: "52px", height: "52px", borderRadius: "14px",
          background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", color: "#ec4899", marginBottom: "18px",
          boxShadow: "0 0 24px rgba(124,58,237,0.20)",
        }}>
          <i className={`bi bi-${step === "done" ? "check-circle-fill" : step === "otp" ? "phone-fill" : "shield-lock-fill"}`} />
        </div>

        {/* Step indicator dots */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
          {["email", "otp", "password"].map((s, i) => (
            <div key={s} style={{
              height: "3px", flex: 1, borderRadius: "2px",
              background: ["email", "otp", "password", "done"].indexOf(step) >= i
                ? "linear-gradient(90deg,#7c3aed,#ec4899)"
                : "rgba(255,255,255,0.07)",
              transition: "background .3s",
            }} />
          ))}
        </div>

        <h2 style={{ margin: "0 0 5px", fontSize: "20px", fontWeight: 900, color: "#f5f0ff", letterSpacing: "-.4px" }}>
          {stepTitle[step]}
        </h2>
        <p style={{ margin: "0 0 22px", fontSize: "13px", color: "rgba(249,168,212,0.38)", lineHeight: 1.55 }}>
          {stepSub[step]}
        </p>

        {/* Error */}
        {err && (
          <div className="nv-err" style={{ marginBottom: "14px" }}>
            <i className="bi bi-exclamation-circle-fill" />
            <span>{err}</span>
          </div>
        )}

        {/* ════════════════════ STEP 1 — Email ════════════════════ */}
        {step === "email" && (
          <form onSubmit={submitEmail} noValidate>
            <div className="nv-field" style={{ marginBottom: "18px" }}>
              <label>Email Address</label>
              <div className="nv-inp-wrap">
                <i className="bi bi-envelope-fill nv-inp-icon" />
                <input
                  type="email" value={email} autoFocus
                  onChange={(e) => { setErr(""); setEmail(e.target.value); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading || authLoading}
                />
              </div>
            </div>

            <button type="submit" className="nv-btn" style={{ height: "46px" }} disabled={loading || authLoading}>
              <span className="nv-btn-inner" style={{ fontSize: "13px" }}>
                {loading || authLoading
                  ? <><span className="nv-spin" /><span>Sending OTP…</span></>
                  : <><i className="bi bi-send-fill" /><span>Send OTP</span></>}
              </span>
              <div className="nv-btn-glow" />
            </button>

            <p style={{ textAlign: "center", marginTop: "14px", fontSize: "12.5px", color: "rgba(249,168,212,0.28)" }}>
              Remembered it?{" "}
              <button type="button" onClick={onClose} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: "12.5px", fontWeight: 700, padding: 0,
                backgroundImage: "linear-gradient(135deg,#7c3aed,#ec4899,#f97316)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                Back to Sign In
              </button>
            </p>
          </form>
        )}

        {/* ════════════════════ STEP 2 — OTP ════════════════════ */}
        {step === "otp" && (
          <form onSubmit={submitOtp} noValidate>

            {/* Dev-mode OTP hint */}
            {devOtp && (
              <div style={{
                background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.22)",
                borderRadius: "9px", padding: "10px 14px", marginBottom: "18px",
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <i className="bi bi-info-circle-fill" style={{ color: "#7c3aed", fontSize: "14px", flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "rgba(124,58,237,0.70)", textTransform: "uppercase", letterSpacing: ".08em" }}>Dev mode — your OTP</p>
                  <p style={{ margin: "3px 0 0", fontSize: "22px", fontWeight: 900, letterSpacing: "6px", color: "#c4b5fd", fontVariantNumeric: "tabular-nums" }}>{devOtp}</p>
                </div>
              </div>
            )}

            {/* 6 OTP boxes */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "20px" }} onPaste={handleOtpPaste}>
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  disabled={loading || authLoading}
                  style={{
                    width: "46px", height: "54px",
                    textAlign: "center", fontSize: "22px", fontWeight: 800,
                    background: d ? "rgba(124,58,237,0.12)" : "rgba(0,0,0,0.32)",
                    border: `1.5px solid ${d ? "rgba(124,58,237,0.50)" : "rgba(124,58,237,0.18)"}`,
                    borderRadius: "10px", color: "#f5f0ff",
                    outline: "none", fontFamily: "inherit",
                    transition: "border-color .15s, background .15s",
                    caretColor: "#ec4899",
                  }}
                />
              ))}
            </div>

            {/* Resend */}
            <div style={{ textAlign: "center", marginBottom: "16px", fontSize: "12px", color: "rgba(249,168,212,0.35)" }}>
              {resendTimer > 0
                ? <>Resend OTP in <strong style={{ color: "rgba(196,181,253,0.70)" }}>{resendTimer}s</strong></>
                : <button type="button" onClick={resendOtp} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: "12px", fontWeight: 700,
                  backgroundImage: "linear-gradient(135deg,#7c3aed,#ec4899,#f97316)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  padding: 0,
                }}>
                  Resend OTP
                </button>
              }
            </div>

            <button type="submit" className="nv-btn" style={{ height: "46px" }}
              disabled={loading || authLoading || otpDigits.join("").length < OTP_LENGTH}>
              <span className="nv-btn-inner" style={{ fontSize: "13px" }}>
                {loading || authLoading
                  ? <><span className="nv-spin" /><span>Verifying…</span></>
                  : <><i className="bi bi-shield-check" /><span>Verify OTP</span></>}
              </span>
              <div className="nv-btn-glow" />
            </button>

            <p style={{ textAlign: "center", marginTop: "12px", fontSize: "12px", color: "rgba(249,168,212,0.28)" }}>
              Wrong email?{" "}
              <button type="button" onClick={() => { setStep("email"); setErr(""); }} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: "12px", fontWeight: 700, padding: 0,
                backgroundImage: "linear-gradient(135deg,#7c3aed,#ec4899,#f97316)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                Change email
              </button>
            </p>
          </form>
        )}

        {/* ════════════════════ STEP 3 — New Password ════════════════════ */}
        {step === "password" && (
          <form onSubmit={submitPassword} noValidate className="nv-form">

            <div className="nv-field">
              <label>New Password</label>
              <div className="nv-inp-wrap">
                <i className="bi bi-lock-fill nv-inp-icon" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={pwd} onChange={e => { setErr(""); setPwd(e.target.value); }}
                  placeholder="At least 6 characters"
                  autoComplete="new-password" autoFocus
                  disabled={loading || authLoading}
                />
                <button type="button" className="nv-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                  <i className={`bi bi-eye${showPwd ? "-slash" : ""}`} />
                </button>
              </div>
              {pwd && (
                <div className="nv-strength" style={{ marginTop: "6px" }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} className="nv-str" style={{ background: n <= strength ? strColor : "rgba(255,255,255,0.06)" }} />
                  ))}
                  <span style={{ fontSize: "10px", color: strColor, marginLeft: "4px", fontWeight: 700 }}>{strLabel}</span>
                </div>
              )}
            </div>

            <div className="nv-field" style={{ marginTop: "14px" }}>
              <label>Confirm Password</label>
              <div className="nv-inp-wrap">
                <i className="bi bi-lock-fill nv-inp-icon" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPwd} onChange={e => { setErr(""); setConfirmPwd(e.target.value); }}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={loading || authLoading}
                />
                <button type="button" className="nv-eye" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                  <i className={`bi bi-eye${showConfirm ? "-slash" : ""}`} />
                </button>
              </div>
              {confirmPwd && (
                <div className={`nv-match ${pwd === confirmPwd ? "nv-m-ok" : "nv-m-fail"}`} style={{ marginTop: "5px" }}>
                  <i className={`bi bi-${pwd === confirmPwd ? "check-circle-fill" : "x-circle-fill"}`} />
                  {pwd === confirmPwd ? "Passwords match" : "Passwords do not match"}
                </div>
              )}
            </div>

            <button type="submit" className="nv-btn" style={{ height: "46px", marginTop: "18px" }}
              disabled={loading || authLoading}>
              <span className="nv-btn-inner" style={{ fontSize: "13px" }}>
                {loading || authLoading
                  ? <><span className="nv-spin" /><span>Updating…</span></>
                  : <><i className="bi bi-shield-lock-fill" /><span>Update Password</span></>}
              </span>
              <div className="nv-btn-glow" />
            </button>
          </form>
        )}

        {/* ════════════════════ DONE ════════════════════ */}
        {step === "done" && (
          <div>
            <div className="nv-ok" style={{ marginBottom: "20px" }}>
              <i className="bi bi-check-circle-fill" />
              <span>All set! Your password has been updated successfully.</span>
            </div>
            <button className="nv-btn" style={{ height: "46px" }} onClick={onClose}>
              <span className="nv-btn-inner" style={{ fontSize: "13px" }}>
                <i className="bi bi-arrow-right-circle-fill" />
                <span>Sign In Now</span>
              </span>
              <div className="nv-btn-glow" />
            </button>
          </div>
        )}

        {/* Trust row */}
        <div className="nv-trust-row" style={{ marginTop: "18px" }}>
          <span><i className="bi bi-shield-lock" /> Secure</span>
          <span className="nv-dot" />
          <span><i className="bi bi-lock" /> Encrypted</span>
          <span className="nv-dot" />
          <span><i className="bi bi-stars" /> AI Powered</span>
        </div>

      </div>
    </div>
  );
}
