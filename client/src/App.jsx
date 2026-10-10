import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import CodeEditor from "./components/CodeEditor";
import HomeScreen from "./components/HomeScreen";
import AdminDashboard from "./components/AdminDashboard";
import ChatPopup from "./components/ChatPopup";
import MessageBubble from "./components/MessageBubble";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import HistoryPage from "./pages/HistoryPage";
import AIToolsPage from "./pages/AIToolsPage";
import SQLAssistantPage from "./pages/SQLAssistantPage";
import ProjectGeneratorPage from "./pages/ProjectGeneratorPage";
import DocsGeneratorPage from "./pages/DocsGeneratorPage";
import TestGeneratorPage from "./pages/TestGeneratorPage";
import CodeRefactorPage from "./pages/CodeRefactorPage";
import ExecutionPage from "./pages/ExecutionPage";
import PreviewPage from "./pages/PreviewPage";
import GitHubPage from "./pages/GitHubPage";
import GitPage from "./pages/GitPage";
import ImportPage from "./pages/ImportPage";
import ExportPage from "./pages/ExportPage";
import DeployPage from "./pages/DeployPage";
import SecurityPage from "./pages/SecurityPage";
import { useAuth } from "./context/AuthContext";
import "./App.css";

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';
const CHAT_API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const NAV_ITEMS = [
  { id: "home", icon: "bi-house-fill", label: "Home", adminOnly: false },
  { id: "chat", icon: "bi-chat-dots-fill", label: "AI Chat", adminOnly: false },
  { id: "history", icon: "bi-clock-history", label: "History", adminOnly: false },
  { id: "aitools", icon: "bi-stars", label: "AI Tools", adminOnly: false },
  { id: "refactor", icon: "bi-arrow-repeat", label: "Code Refactoring", adminOnly: false },
  { id: "tests", icon: "bi-check2-circle", label: "Test Generator", adminOnly: false },
  { id: "docs", icon: "bi-file-earmark-text-fill", label: "Docs Generator", adminOnly: false },
  { id: "sql", icon: "bi-database-fill", label: "SQL Assistant", adminOnly: false },
  { id: "project", icon: "bi-folder2-open", label: "Project Generator", adminOnly: false },
  { id: "execute", icon: "bi-play-circle-fill", label: "Run & Debug", adminOnly: false },
  { id: "preview", icon: "bi-eye-fill", label: "Live Preview", adminOnly: false },
  { id: "code", icon: "bi-code-slash", label: "Code Editor", adminOnly: false },
  { id: "github", icon: "bi-github", label: "GitHub", adminOnly: false },
  { id: "git", icon: "bi-git", label: "Git Assistant", adminOnly: false },
  { id: "import", icon: "bi-upload", label: "Import Project", adminOnly: false },
  { id: "export", icon: "bi-download", label: "Export / Download", adminOnly: false },
  { id: "deploy", icon: "bi-rocket-takeoff-fill", label: "Deployment", adminOnly: false },
  { id: "security", icon: "bi-shield-fill-check", label: "Security & Testing", adminOnly: false },
  { id: "profile", icon: "bi-person-circle", label: "Profile", adminOnly: false },
  { id: "admin", icon: "bi-speedometer2", label: "Admin Panel", adminOnly: true },
];

function App() {
  const { isAuthenticated, user, logout, token } = useAuth();
  const [authPage, setAuthPage] = useState("login");

  // ── Default nav based on role ─────────────────────
  const defaultNav = user?.role === "admin" ? "admin" : "home";

  const [activeNav, setActiveNav] = useState(defaultNav);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("vx-sidebar");
    return saved === null ? true : saved === "true";
  });
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    const saved = localStorage.getItem("vx-sidebar-visible");
    return saved === null ? true : saved === "true";
  });
  const [recentOpen, setRecentOpen] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const toggleGroup = (label) => setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));

  // Persist sidebar state
  const toggleSidebar = (val) => {
    const next = typeof val === "boolean" ? val : !sidebarOpen;
    setSidebarOpen(next);
    localStorage.setItem("vx-sidebar", String(next));
  };
  const toggleSidebarVisible = () => {
    setSidebarVisible(v => {
      const next = !v;
      localStorage.setItem("vx-sidebar-visible", String(next));
      return next;
    });
  };
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const [recentSessions, setRecentSessions] = useState([]);

  const [attachOpen, setAttachOpen] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const handleAttachOption = (type) => {
    setAttachOpen(false);
    if (type === "image") imageInputRef.current?.click();
    if (type === "file") fileInputRef.current?.click();
    if (type === "code") {
      setInput(prev => prev + "\n```\n// paste your code here\n```\n");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (type === "link") {
      setInput(prev => prev + " https://");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const label = type === "image" ? `[Image: ${file.name}]` : `[File: ${file.name}]`;
    setInput(prev => (prev ? prev + "\n" + label : label));
    inputRef.current?.focus();
    e.target.value = "";
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Close attach menu on outside click
  useEffect(() => {
    if (!attachOpen) return;
    const handler = (e) => {
      if (!e.target.closest(".attach-wrap")) setAttachOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [attachOpen]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 140) + "px";
    }
  }, [input]);

  // ── Step 25: Save to chat history DB ──────────────
  const saveToHistory = useCallback(async (role, text) => {
    if (!token) return;
    try {
      await axios.post(`${CHAT_API}/message`,
        { session_id: sessionId, role: role === "ai" ? "assistant" : "user", message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) { /* silent */ }
  }, [sessionId, token]);

  const loadSessions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${CHAT_API}/sessions`, { headers: { Authorization: `Bearer ${token}` } });
      setRecentSessions(res.data.sessions?.slice(0, 5) || []);
    } catch (e) { /* silent */ }
  }, [token]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  if (!isAuthenticated) {
    return authPage === "login"
      ? <LoginPage
        onSwitchToRegister={() => setAuthPage("register")}
        onLoginSuccess={(role) => setActiveNav(role === "admin" ? "admin" : "home")}
      />
      : <RegisterPage onSwitchToLogin={() => setAuthPage("login")} />;
  }

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages(p => [...p, { role: "user", text }]);
    setInput("");
    setLoading(true);
    if (activeNav === "home" || activeNav !== "chat") setActiveNav("chat");
    saveToHistory("user", text);
    try {
      const res = await axios.post(API_URL, { message: text });
      const reply = res.data.reply;
      setMessages(p => [...p, { role: "ai", text: reply }]);
      saveToHistory("ai", reply);
      loadSessions();
    } catch (e) {
      setMessages(p => [...p, {
        role: "ai",
        text: `⚠️ ${e?.response?.data?.message || "Connection failed. Check your backend."}`,
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const initials = user?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U";
  const isDark = theme === "dark";

  return (
    <div className={`shell ${isDark ? "theme-dark" : "theme-light"}`}>

      {/* ══ SIDEBAR — ChatGPT Style ═══════════════════════ */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"} ${!sidebarVisible ? "sidebar-hidden" : ""}`}>

        {/* Top */}
        <div className="gpt-sb-top">
          {sidebarOpen ? (
            <div className="gpt-sb-header">
              <div className="gpt-logo">
                <img src="/logo.png" alt="A" className="gpt-logo-img" />
                <span className="gpt-logo-name">VEXORA <b>AI</b></span>
              </div>
              <button className="gpt-icon-btn" onClick={() => toggleSidebar()} title="Close sidebar">
                <i className="bi bi-layout-sidebar" />
              </button>
            </div>
          ) : (
            <div className="gpt-collapsed-header">
              <button className="gpt-icon-btn" onClick={() => toggleSidebar()} title="Open sidebar">
                <i className="bi bi-layout-sidebar-reverse" />
              </button>
            </div>
          )}
          <button
            className="gpt-new-chat-btn"
            onClick={() => { setMessages([]); setSessionId(uuidv4()); setActiveNav("home"); }}
            title="New chat"
          >
            <i className="bi bi-plus-lg" />
            {sidebarOpen && <span>New chat</span>}
          </button>
        </div>

        {/* Recent */}

        {/* Nav */}
        <nav className="gpt-nav">
          {user?.role === "admin" ? (
            // Admin: show only admin item, no section labels
            NAV_ITEMS.filter(n => n.adminOnly).map(n => (
              <button
                key={n.id}
                className={`gpt-nav-item ${activeNav === n.id ? "gpt-nav-active" : ""} gpt-nav-admin`}
                onClick={() => setActiveNav(n.id)}
                title={!sidebarOpen ? n.label : ""}
              >
                <i className={`bi ${n.icon}`} />
                {sidebarOpen && <span>{n.label}</span>}
              </button>
            ))
          ) : (
            // Non-admin: show grouped sections
            [
              { label: "WORKSPACE", ids: ["home", "chat", "history"] },
              { label: "AI TOOLS", ids: ["aitools", "refactor", "tests", "docs", "sql", "project"] },
              { label: "DEVELOPMENT", ids: ["execute", "preview", "code"] },
              { label: "INTEGRATIONS", ids: ["github", "git", "import", "export", "deploy", "security"] },
              { label: "ACCOUNT", ids: ["profile"] },
            ].map(group => {
              const items = NAV_ITEMS.filter(n => group.ids.includes(n.id) && !n.adminOnly);
              if (items.length === 0) return null;
              const isCollapsed = !!collapsedGroups[group.label];
              return (
                <div key={group.label} className="gpt-nav-group">
                  {sidebarOpen && (
                    <button className="gpt-nav-section-btn" onClick={() => toggleGroup(group.label)}>
                      <span>{group.label}</span>
                      <i className={`bi bi-chevron-${isCollapsed ? "down" : "up"} gpt-nav-section-chevron`} />
                    </button>
                  )}
                  {!isCollapsed && items.map(n => (
                    <button
                      key={n.id}
                      className={`gpt-nav-item ${activeNav === n.id ? "gpt-nav-active" : ""}`}
                      onClick={() => setActiveNav(n.id)}
                      title={!sidebarOpen ? n.label : ""}
                    >
                      <i className={`bi ${n.icon}`} />
                      {sidebarOpen && <span>{n.label}</span>}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </nav>

        {/* Bottom */}
        <div className="gpt-sb-bottom">

          {/* Recent — collapsible */}
          {sidebarOpen && (
            <div className="gpt-recents">
              <button className="gpt-recents-toggle" onClick={() => setRecentOpen(o => !o)}>
                <span className="gpt-section-label" style={{ pointerEvents: "none" }}>Recent</span>
                <i className={`bi bi-chevron-${recentOpen ? "up" : "down"} gpt-recents-chevron`} />
              </button>
              {recentOpen && (
                <div className="gpt-recents-body">
                  {messages.length > 0 && (
                    <div className="gpt-chat-item gpt-chat-active">
                      <i className="bi bi-chat-dots" /><span>Current chat</span>
                    </div>
                  )}
                  {recentSessions.slice(0, 5).map((s, i) => {
                    const d = s.started_at ? new Date(s.started_at) : null;
                    const timeStr = d
                      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "";
                    return (
                      <div key={i} className="gpt-chat-item" onClick={() => setActiveNav("history")}>
                        <i className="bi bi-chat" />
                        <span>Session {recentSessions.length - i}</span>
                        {timeStr && <span className="gpt-chat-time">{timeStr}</span>}
                      </div>
                    );
                  })}
                  {recentSessions.length === 0 && messages.length === 0 && (
                    <div className="gpt-chat-empty">No conversations yet</div>
                  )}
                </div>
              )}
            </div>
          )}
          <button className="gpt-nav-item" onClick={() => setTheme(isDark ? "light" : "dark")} title="Toggle theme">
            <i className={`bi bi-${isDark ? "sun" : "moon"}`} />
            {sidebarOpen && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
          </button>
          <div className="gpt-user-row" onClick={() => setActiveNav("profile")} title="Profile">
            <div className="gpt-user-avatar">{initials}</div>
            {sidebarOpen && (
              <>
                <div className="gpt-user-meta">
                  <strong>{user?.name}</strong>
                  <span>{user?.role === "admin" ? "Admin" : "Free plan"}</span>
                </div>
                <button className="gpt-icon-btn gpt-signout" onClick={e => { e.stopPropagation(); logout(); }} title="Sign out">
                  <i className="bi bi-box-arrow-right" />
                </button>
              </>
            )}
          </div>
        </div>

      </aside>

      {/* ══ MAIN ═══════════════════════════════════════ */}
      <div className="main">

        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="topbar-toggle" onClick={toggleSidebarVisible} title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}>
              <i className={`bi bi-layout-sidebar${sidebarVisible ? "" : "-reverse"}`} />
            </button>
            <div className="topbar-title">
              <span>{NAV_ITEMS.find(n => n.id === activeNav)?.label || "VEXORA AI"}</span>
              <div className="topbar-status">
                <span className="status-dot" />
                AI Online
              </div>
            </div>
          </div>

          <div className="topbar-right">
            {messages.length > 0 && (
              <button className="topbar-btn" onClick={() => { setMessages([]); setSessionId(uuidv4()); setActiveNav("home"); }} title="Clear chat">
                <i className="bi bi-arrow-counterclockwise" />
              </button>
            )}
            <button className="topbar-btn" title="Search">
              <i className="bi bi-search" />
            </button>
            <div className="topbar-avatar">{initials}</div>
          </div>
        </header >

        {/* CONTENT */}
        < div className="content" >

          {/* Profile Page */}
          {activeNav === "profile" && <ProfilePage />}

          {/* ── PHASE 7 — Integrations ── */}
          {activeNav === "github" && <GitHubPage />}
          {activeNav === "git" && <GitPage />}
          {activeNav === "import" && <ImportPage />}
          {activeNav === "export" && <ExportPage />}
          {activeNav === "deploy" && <DeployPage />}
          {activeNav === "security" && <SecurityPage />}

          {/* History Page */}
          {activeNav === "history" && <HistoryPage />}

          {/* AI Tools Page */}
          {activeNav === "aitools" && <AIToolsPage />}

          {/* Test Generator - Step 27 */}
          {activeNav === "tests" && <TestGeneratorPage />}

          {/* Execution Page - Steps 31-33 */}
          {activeNav === "execute" && <ExecutionPage />}

          {/* Live Preview - Steps 34-35 */}
          {activeNav === "preview" && <PreviewPage />}

          {/* Code Refactor - Step 26 */}
          {activeNav === "refactor" && <CodeRefactorPage />}

          {/* Docs Generator - Step 28 */}
          {activeNav === "docs" && <DocsGeneratorPage />}

          {/* SQL Assistant */}
          {activeNav === "sql" && <SQLAssistantPage />}

          {/* Project Generator */}
          {activeNav === "project" && <ProjectGeneratorPage />}

          {/* Admin Dashboard — admin role only */}
          {activeNav === "admin" && user?.role === "admin" && <AdminDashboard />}

          {/* Admin access denied */}
          {
            activeNav === "admin" && user?.role !== "admin" && (
              <div className="placeholder-view">
                <i className="bi bi-shield-lock-fill" style={{ color: "#ff4d6d" }} />
                <h3>Access Denied</h3>
                <p>Admin panel is only accessible to administrators.</p>
                <button onClick={() => setActiveNav("home")}>
                  <i className="bi bi-house-fill" /> Go Home
                </button>
              </div>
            )
          }

          {/* Code Editor */}
          {activeNav === "code" && <CodeEditor />}

          {/* Chat / Home */}
          {
            !["code", "admin", "profile", "history", "aitools", "refactor", "tests", "docs", "sql", "project", "execute", "preview"].includes(activeNav) && (
              <div className="chat-view">

                {/* Home screen */}
                {(activeNav === "home" || activeNav === "chat") && messages.length === 0 && (
                  <HomeScreen
                    userName={user?.name}
                    onPrompt={(p) => { setInput(p); inputRef.current?.focus(); }}
                  />
                )}

                {/* Other nav — placeholder */}
                {!["home", "chat"].includes(activeNav) && (
                  <div className="placeholder-view">
                    <i className={`bi ${NAV_ITEMS.find(n => n.id === activeNav)?.icon}`} />
                    <h3>{NAV_ITEMS.find(n => n.id === activeNav)?.label}</h3>
                    <p>Coming soon — switch to AI Chat to get started.</p>
                    <button onClick={() => setActiveNav("chat")}>
                      <i className="bi bi-chat-dots-fill" /> Open AI Chat
                    </button>
                  </div>
                )}

                {/* Messages */}
                {messages.length > 0 && (
                  <div className="messages">
                    {/* Session header */}
                    <div className="msg-session-start">
                      <i className="bi bi-stars" style={{ fontSize: "10px" }} />
                      {new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                    </div>

                    {messages.map((m, i) => (
                      <MessageBubble
                        key={i}
                        role={m.role}
                        message={m.text}
                        userName={user?.name}
                        initials={initials}
                        time={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      />
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                      <div className="ai-loading-row">
                        <div className="ai-loading-avatar">
                          <img src="/logo.png" alt="AI" className="ai-loading-logo" />
                          <span className="ai-loading-ring" />
                        </div>
                        <div className="ai-loading-body">
                          <div className="ai-loading-name">
                            <span>VEXORA AI</span>
                            <span className="ai-loading-badge">generating</span>
                          </div>
                          <div className="ai-loading-bar-wrap">
                            <div className="ai-loading-bar">
                              <div className="ai-loading-bar-fill" />
                            </div>
                            <div className="ai-loading-dots">
                              <span /><span /><span />
                            </div>
                            <span className="ai-loading-text">Thinking…</span>
                          </div>
                          <div className="ai-loading-chips">
                            <span className="ai-chip">
                              <i className="bi bi-cpu" /> Processing
                            </span>
                            <span className="ai-chip">
                              <i className="bi bi-braces" /> Generating code
                            </span>
                            <span className="ai-chip ai-chip-pulse">
                              <i className="bi bi-activity" /> Live
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}

                {/* Input area */}
                <div className="input-wrap">
                  <div className="input-bar">

                    {/* Hidden file inputs */}
                    <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={e => handleFileChange(e, "file")} />
                    <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFileChange(e, "image")} />

                    {/* Attach button — far left */}
                    <div className="attach-wrap">
                      <button
                        className={`input-icon-btn ${attachOpen ? "input-icon-active" : ""}`}
                        title="Attach"
                        onClick={() => setAttachOpen(o => !o)}
                        type="button"
                      >
                        <i className={`bi bi-${attachOpen ? "x-lg" : "plus-lg"}`} />
                      </button>

                      {attachOpen && (
                        <div className="attach-menu">
                          <div className="attach-menu-head">Attach</div>
                          {[
                            { type: "image", icon: "bi-image", label: "Image", sub: "PNG, JPG, GIF, WebP" },
                            { type: "file", icon: "bi-file-earmark", label: "File", sub: "PDF, TXT, CSV, JSON" },
                            { type: "code", icon: "bi-code-slash", label: "Code Snippet", sub: "Insert code block" },
                            { type: "link", icon: "bi-link-45deg", label: "URL / Link", sub: "Paste a web link" },
                          ].map(opt => (
                            <button
                              key={opt.type}
                              className="attach-option"
                              onClick={() => handleAttachOption(opt.type)}
                              type="button"
                            >
                              <div className="attach-opt-icon">
                                <i className={`bi ${opt.icon}`} />
                              </div>
                              <div className="attach-opt-info">
                                <strong>{opt.label}</strong>
                                <span>{opt.sub}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Textarea — centre */}
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Ask VEXORA AI anything…"
                      rows={1}
                      disabled={loading}
                    />

                    {/* Right actions */}
                    <div className="input-actions">
                      <button
                        className={`send-btn ${!input.trim() || loading ? "send-disabled" : ""}`}
                        onClick={sendMessage}
                        disabled={!input.trim() || loading}
                        title="Send (Enter)"
                      >
                        {loading
                          ? <i className="bi bi-hourglass-split" />
                          : <i className="bi bi-arrow-up" />}
                      </button>
                    </div>
                  </div>
                  <p className="input-hint">VEXORA AI can make mistakes. Check important info.</p>
                </div>

              </div>
            )
          }
        </div >

        {/* ══ FOOTER ══════════════════════════════════════ */}
        <footer className="app-footer">
          <div className="app-footer-left">
            <img src="/logo.png" alt="VEXORA AI" className="app-footer-logo" />
            <span className="app-footer-brand">VEXORA <b>AI</b></span>
          </div>
          <div className="app-footer-center">
            <span>© {new Date().getFullYear()} VEXORA AI. All rights reserved.</span>
          </div>
          <div className="app-footer-right">
            <a href="#" title="Terms">Terms</a>
            <span className="app-footer-dot" />
            <a href="#" title="Privacy">Privacy</a>
            <span className="app-footer-dot" />
            <a href="#" title="Support">Support</a>
            <span className="app-footer-divider" />
            <span className="app-footer-version">v1.0.0</span>
          </div>
        </footer>

      </div >

      {/* ══ FLOATING CHAT POPUP ══════════════════════════ */}
      < ChatPopup theme={theme} userInitials={initials} />

    </div >
  );
}

export default App;
