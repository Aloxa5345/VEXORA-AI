import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "../context/AuthContext";
import "./HistoryPage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

// ── Inline code block for markdown ───────────────
function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="hp-code-wrap">
      <div className="hp-code-bar">
        <span className="hp-code-lang">{language || "code"}</span>
        <button className="hp-copy-code" onClick={copy}>
          <i className={`bi bi-${copied ? "check-lg" : "clipboard"}`} />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || "text"}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: "0 0 8px 8px", fontSize: "12.5px", padding: "14px", background: "#0d1117" }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default function HistoryPage() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── Load sessions ─────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingSessions(true);
      try {
        const res = await axios.get(`${API}/sessions`, { headers });
        setSessions(res.data.sessions || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSessions(false);
      }
    })();
  }, [token]);

  // ── Load messages for session ─────────────────
  const loadSession = async (session_id) => {
    setActiveSession(session_id);
    setLoadingMsgs(true);
    try {
      const res = await axios.get(`${API}/history/${session_id}`, { headers });
      setMessages(res.data.history || []);
    } catch (e) {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.session_id.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatFullDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const activeSessionData = sessions.find(s => s.session_id === activeSession);
  const userMessages = messages.filter(m => m.role === "user").length;
  const aiMessages = messages.filter(m => m.role === "assistant").length;

  return (
    <div className="hp-root">
      {/* bg glows */}
      <div className="hp-glow-a" />
      <div className="hp-glow-b" />

      <div className="hp-layout">

        {/* ══ LEFT — Session list ══ */}
        <aside className="hp-sidebar">

          {/* Header */}
          <div className="hp-sb-header">
            <div className="hp-sb-title">
              <i className="bi bi-clock-history" />
              <span>Chat History</span>
              <span className="hp-session-count">{sessions.length}</span>
            </div>

            {/* Search */}
            <div className="hp-search-wrap">
              <i className="bi bi-search hp-search-icon" />
              <input
                type="text"
                className="hp-search"
                placeholder="Search sessions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="hp-search-clear" onClick={() => setSearch("")}>
                  <i className="bi bi-x-lg" />
                </button>
              )}
            </div>
          </div>

          {/* Session list */}
          <div className="hp-session-list">
            {loadingSessions ? (
              <div className="hp-loading">
                <div className="hp-spinner" />
                <span>Loading sessions…</span>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="hp-empty-list">
                <i className="bi bi-chat-square-dots" />
                <p>{search ? "No sessions found" : "No chat history yet"}</p>
                {!search && <span>Start a conversation to see history here</span>}
              </div>
            ) : (
              filteredSessions.map((s, i) => (
                <button
                  key={s.session_id}
                  className={`hp-session-item ${activeSession === s.session_id ? "hp-session-active" : ""}`}
                  onClick={() => loadSession(s.session_id)}
                >
                  <div className="hp-session-icon">
                    <i className="bi bi-chat-dots-fill" />
                  </div>
                  <div className="hp-session-info">
                    <strong>Session {sessions.length - i}</strong>
                    <span>{s.session_id.slice(0, 20)}…</span>
                  </div>
                  <div className="hp-session-meta">
                    <span className="hp-session-time">{formatDate(s.started_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ══ RIGHT — Message view ══ */}
        <main className="hp-main">
          {!activeSession ? (
            /* Empty state */
            <div className="hp-empty-state">
              <div className="hp-empty-icon">
                <i className="bi bi-clock-history" />
              </div>
              <h2>Select a Session</h2>
              <p>Choose a chat session from the left to view the full conversation history.</p>
              <div className="hp-empty-stats">
                <div className="hp-empty-stat">
                  <strong>{sessions.length}</strong>
                  <span>Total Sessions</span>
                </div>
                <div className="hp-empty-stat">
                  <strong>{sessions.length > 0 ? formatDate(sessions[0]?.started_at) : "—"}</strong>
                  <span>Last Chat</span>
                </div>
              </div>
            </div>
          ) : loadingMsgs ? (
            /* Loading messages */
            <div className="hp-loading hp-loading-center">
              <div className="hp-spinner hp-spinner-lg" />
              <span>Loading conversation…</span>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div className="hp-conv-header">
                <div className="hp-conv-header-left">
                  <button className="hp-back-btn" onClick={() => setActiveSession(null)}>
                    <i className="bi bi-arrow-left" />
                  </button>
                  <div className="hp-conv-title">
                    <h3>Session {sessions.findIndex(s => s.session_id === activeSession) >= 0
                      ? sessions.length - sessions.findIndex(s => s.session_id === activeSession)
                      : ""
                    }</h3>
                    <span>{formatFullDate(activeSessionData?.started_at)}</span>
                  </div>
                </div>
                <div className="hp-conv-meta-chips">
                  <span className="hp-meta-chip">
                    <i className="bi bi-person-fill" /> {userMessages} prompts
                  </span>
                  <span className="hp-meta-chip">
                    <i className="bi bi-stars" /> {aiMessages} replies
                  </span>
                  <span className="hp-meta-chip">
                    <i className="bi bi-chat-dots" /> {messages.length} total
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="hp-messages">
                {messages.length === 0 ? (
                  <div className="hp-empty-state">
                    <i className="bi bi-chat-square" style={{ fontSize: 40 }} />
                    <p>No messages in this session</p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`hp-msg ${m.role === "user" ? "hp-msg-user" : "hp-msg-ai"}`}>

                      {/* Avatar */}
                      <div className={`hp-msg-avatar ${m.role === "user" ? "hp-av-user" : "hp-av-ai"}`}>
                        {m.role === "user"
                          ? <i className="bi bi-person-fill" />
                          : <img src="/logo.png" alt="AI" className="hp-ai-logo" />}
                      </div>

                      {/* Body */}
                      <div className="hp-msg-body">
                        <div className="hp-msg-name-row">
                          <span className={`hp-msg-name ${m.role === "assistant" ? "hp-name-ai" : ""}`}>
                            {m.role === "user" ? "You" : "VEXORA AI"}
                          </span>
                          {m.role === "assistant" && <span className="hp-ai-badge">AI</span>}
                          <span className="hp-msg-time">{formatFullDate(m.created_at)}</span>
                        </div>

                        <div className={`hp-msg-bubble ${m.role === "user" ? "hp-bubble-user" : "hp-bubble-ai"}`}>
                          {m.role === "user" ? (
                            <p className="hp-plain">{m.message}</p>
                          ) : (
                            <ReactMarkdown
                              components={{
                                code({ node, inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  return !inline ? (
                                    <CodeBlock language={match?.[1]}>{children}</CodeBlock>
                                  ) : (
                                    <code className="hp-inline-code" {...props}>{children}</code>
                                  );
                                },
                                p: ({ children }) => <p className="hp-p">{children}</p>,
                                h1: ({ children }) => <h1 className="hp-h1">{children}</h1>,
                                h2: ({ children }) => <h2 className="hp-h2">{children}</h2>,
                                h3: ({ children }) => <h3 className="hp-h3">{children}</h3>,
                                ul: ({ children }) => <ul className="hp-ul">{children}</ul>,
                                ol: ({ children }) => <ol className="hp-ol">{children}</ol>,
                                li: ({ children }) => <li className="hp-li">{children}</li>,
                                strong: ({ children }) => <strong className="hp-strong">{children}</strong>,
                                blockquote: ({ children }) => <blockquote className="hp-blockquote">{children}</blockquote>,
                                a: ({ href, children }) => <a className="hp-link" href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
                              }}
                            >
                              {m.message}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
