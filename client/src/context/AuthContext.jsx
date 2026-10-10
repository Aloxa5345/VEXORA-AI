import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth';

const AuthContext = createContext(null);

// ── Helper: decode JWT payload (no library needed) ──
function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// ── Helper: check if token is expired ───────────────
function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}

export function AuthProvider({ children }) {
  // Restore from localStorage on first load
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem("VEXORA AI-token");
    if (saved && !isTokenExpired(saved)) return saved;
    localStorage.removeItem("VEXORA AI-token");
    localStorage.removeItem("VEXORA AI-user");
    return null;
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("VEXORA AI-user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // ── Login ──────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await axios.post(`${BASE_URL}/login`, { email, password });
      const { token: newToken, user: newUser } = res.data;

      localStorage.setItem("VEXORA AI-token", newToken);
      localStorage.setItem("VEXORA AI-user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return { success: true, role: newUser.role };
    } catch (err) {
      const msg = err?.response?.data?.message || "Login failed. Please try again.";
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ── Register ───────────────────────────────────────
  const register = useCallback(async (name, email, password, role = "user") => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await axios.post(`${BASE_URL}/register`, { name, email, password, role });
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || "Registration failed. Please try again.";
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ── Forgot Password ────────────────────────────────
  const forgotPassword = useCallback(async (email) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await axios.post(`${BASE_URL}/forgot-password`, { email });
      return { success: true, ...res.data };
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to send OTP. Please try again.";
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ── Verify OTP ──────────────────────────────────────
  const verifyOtp = useCallback(async (email, otp) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await axios.post(`${BASE_URL}/verify-otp`, { email, otp });
      return { success: true, ...res.data };
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid OTP. Please try again.";
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ── Reset Password ──────────────────────────────────
  const resetPassword = useCallback(async (email, otp, password) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await axios.post(`${BASE_URL}/reset-password`, { email, otp, password });
      return { success: true, ...res.data };
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to reset password. Please try again.";
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setAuthLoading(false);
    }
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem("VEXORA AI-token");
    localStorage.removeItem("VEXORA AI-user");
    setToken(null);
    setUser(null);
    setAuthError("");
  }, []);

  const clearError = useCallback(() => setAuthError(""), []);

  const isAuthenticated = !!token && !isTokenExpired(token);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      authLoading,
      authError,
      login,
      register,
      logout,
      forgotPassword,
      verifyOtp,
      resetPassword,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Custom hook ────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
