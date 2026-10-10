import { useState, useEffect } from "react";
import "./HomeScreen.css";

const TOOLS = [
  { icon: "bi-code-slash", label: "Code Generator", desc: "React · Node · PHP · Python", color: "#8b5cf6", glow: "rgba(139,92,246,0.35)", prompt: "Create a modern React login page with Bootstrap 5" },
  { icon: "bi-bug-fill", label: "Debug Code", desc: "AI error analysis & fixes", color: "#ef4444", glow: "rgba(239,68,68,0.35)", prompt: "Debug this JavaScript code and explain each issue" },
  { icon: "bi-database-fill", label: "SQL Assistant", desc: "Queries · Schemas · Indexes", color: "#06b6d4", glow: "rgba(6,182,212,0.35)", prompt: "Create a MySQL database schema for an e-commerce app" },
  { icon: "bi-lightning-charge-fill", label: "Optimize", desc: "Performance & best practices", color: "#f59e0b", glow: "rgba(245,158,11,0.35)", prompt: "Optimize this code for better performance" },
  { icon: "bi-folder2-open", label: "Build Project", desc: "Full-stack architecture plans", color: "#10b981", glow: "rgba(16,185,129,0.35)", prompt: "Create a complete Node.js REST API project structure" },
  { icon: "bi-braces", label: "Explain Code", desc: "Deep code understanding", color: "#ec4899", glow: "rgba(236,72,153,0.35)", prompt: "Explain how this code works step by step" },
  { icon: "bi-file-earmark-text", label: "Write Docs", desc: "Auto-generate documentation", color: "#3b82f6", glow: "rgba(59,130,246,0.35)", prompt: "Write complete JSDoc documentation for this function" },
  { icon: "bi-shield-fill-check", label: "Security Audit", desc: "OWASP top 10 vulnerability scan", color: "#f97316", glow: "rgba(249,115,22,0.35)", prompt: "Perform a security audit on this code" },
  { icon: "bi-check2-circle", label: "Test Generator", desc: "Unit & integration tests", color: "#a855f7", glow: "rgba(168,85,247,0.35)", prompt: "Write unit tests for this JavaScript function" },
  { icon: "bi-arrow-repeat", label: "Code Refactor", desc: "Clean & modernize code", color: "#14b8a6", glow: "rgba(20,184,166,0.35)", prompt: "Refactor this code following clean code principles" },
  { icon: "bi-translate", label: "Convert Code", desc: "Port between languages", color: "#f43f5e", glow: "rgba(244,63,94,0.35)", prompt: "Convert this JavaScript code to Python" },
  { icon: "bi-git", label: "Git Assistant", desc: "Git commands & workflows", color: "#84cc16", glow: "rgba(132,204,22,0.35)", prompt: "Explain git rebase vs merge and when to use each" },
];

const FEATURED = [
  { label: "Start new project", icon: "bi-rocket-takeoff-fill", color: "#8b5cf6", prompt: "Help me plan and start a new full-stack web project" },
  { label: "Fix my bug", icon: "bi-wrench-adjustable", color: "#ef4444", prompt: "I have a bug in my code. Let me describe it to you." },
  { label: "Review my code", icon: "bi-eye-fill", color: "#06b6d4", prompt: "Review my code for bugs, performance, and best practices" },
  { label: "Design database", icon: "bi-diagram-3-fill", color: "#10b981", prompt: "Help me design a database schema for my project" },
];

export default function HomeScreen({ onPrompt, userName }) {
  const [time, setTime] = useState(new Date());
  const [active, setActive] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const h = time.getHours();
  const greet = h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const first = userName?.split(" ")[0] || "Developer";
  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="hs-root">
      {/* ── Animated BG ── */}
      <div className="hs-aurora" />
      <div className="hs-grid-bg" />

      <div className="hs-scroll">
        <div className="hs-inner">

          {/* ════ TOP ROW ════ */}
          <div className="hs-toprow">

            {/* Greeting card */}
            <div className="hs-greeting-card">
              <div className="hs-greeting-pill">
                <span className="hs-live-dot" />
                AI Online · GPT-4o
              </div>
              <h1 className="hs-title">
                {greet},<br />
                <span className="hs-name-grad">{first}</span> 👋
              </h1>
              <p className="hs-subtitle">Your AI developer workspace is ready.</p>
              <div className="hs-time-row">
                <span className="hs-clock">{timeStr}</span>
                <span className="hs-date-txt">{dateStr}</span>
              </div>
            </div>

            {/* Featured actions */}
            <div className="hs-featured">
              <p className="hs-feat-label">
                <i className="bi bi-stars" />Quick Start
              </p>
              {FEATURED.map(f => (
                <button
                  key={f.label}
                  className="hs-feat-btn"
                  style={{ "--fc": f.color }}
                  onClick={() => onPrompt(f.prompt)}
                >
                  <span className="hs-feat-icon">
                    <i className={`bi ${f.icon}`} />
                  </span>
                  <span className="hs-feat-txt">{f.label}</span>
                  <i className="bi bi-arrow-right hs-feat-arrow" />
                </button>
              ))}
            </div>
          </div>

          {/* ════ TOOLS SECTION ════ */}
          <div className="hs-tools-hd">
            <div className="hs-hd-left">
              <div className="hs-hd-icon"><i className="bi bi-grid-3x3-gap-fill" /></div>
              <span>AI Toolkit</span>
              <span className="hs-badge">{TOOLS.length} tools</span>
            </div>
            <p className="hs-hd-sub">Click any tool to get started</p>
          </div>

          <div className="hs-tools-grid">
            {TOOLS.map((t, i) => (
              <button
                key={t.label}
                className={`hs-tool-card ${active === i ? "hs-tool-active" : ""}`}
                style={{ "--tc": t.color, "--tg": t.glow, animationDelay: `${i * 0.035}s` }}
                onClick={() => { setActive(i); onPrompt(t.prompt); }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                {/* Glow layer */}
                <div className="hs-card-glow" />

                {/* Icon */}
                <div className="hs-card-icon">
                  <i className={`bi ${t.icon}`} />
                </div>

                {/* Text */}
                <div className="hs-card-label">{t.label}</div>
                <div className="hs-card-desc">{t.desc}</div>

                {/* Bottom bar */}
                <div className="hs-card-line" />
              </button>
            ))}
          </div>

          {/* ════ PROMPT INPUT HINT ════ */}
          <div className="hs-hint-row">
            <div className="hs-hint-inner">
              <i className="bi bi-chat-dots-fill" />
              <span>Or type anything below — code, questions, ideas...</span>
              <div className="hs-kbd-group">
                <kbd>Enter</kbd>
                <span>send</span>
                <kbd>Shift+Enter</kbd>
                <span>newline</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
