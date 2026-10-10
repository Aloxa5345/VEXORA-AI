import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: "#0a0a0f", color: "#f0f0ff", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, fontFamily: "Inter,sans-serif" }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Something went wrong</h2>
          <pre style={{ background: "#111118", padding: "16px 20px", borderRadius: 10, fontSize: 12, color: "#f87171", maxWidth: 700, overflow: "auto", border: "1px solid rgba(248,113,113,0.3)" }}>
            {this.state.error.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ height: 42, padding: "0 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>
);
