import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ChatPopup.css";

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const QUICK_CHIPS = [
  "Fix my code 🐛",
  "Explain this 💡",
  "Write SQL query 🗄️",
  "Review my code 🔍",
];

/* ── Time helper ─────────────────────────────────── */
const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* ══════════════════════════════════════════════════
   Lightweight Markdown Renderer
   Handles: **bold**, *italic*, `code`, ```blocks```,
            numbered lists, bullet lists, blank lines
══════════════════════════════════════════════════ */
function renderInline(text) {
  // Split on **bold**, *italic*, `code`
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let last = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2] !== undefined) {
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      parts.push(<code key={key++} className="md-inline-code">{match[4]}</code>);
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownMessage({ text }) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Code block ```
    if (line.trimStart().startsWith("```")) {
      const lang = line.replace(/```/g, "").trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={key++} className="md-code-block">
          {lang && <div className="md-code-lang">{lang}</div>}
          <pre><code>{codeLines.join("\n")}</code></pre>
        </div>
      );
      i++;
      continue;
    }

    // ── Heading # ## ###
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const Tag = `h${level}`;
      elements.push(
        <Tag key={key++} className={`md-h${level}`}>
          {renderInline(headingMatch[2])}
        </Tag>
      );
      i++;
      continue;
    }

    // ── Numbered list  1. 2. 3.
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={key++} className="md-ol">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // ── Bullet list  - or *
    if (/^[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={key++} className="md-ul">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // ── Blank line → spacer
    if (line.trim() === "") {
      // only add spacer if not at start/end
      if (elements.length > 0) {
        elements.push(<div key={key++} className="md-spacer" />);
      }
      i++;
      continue;
    }

    // ── Regular paragraph line
    elements.push(
      <p key={key++} className="md-p">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="md-body">{elements}</div>;
}

/* ══════════════════════════════════════════════════
   ChatPopup Component
══════════════════════════════════════════════════ */
export default function ChatPopup({ theme = "dark", userInitials = "U" }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 100) + "px";
    }
  }, [input]);

  useEffect(() => {
    if (!open && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === "ai") setUnread(u => u + 1);
    }
  }, [messages]); // eslint-disable-line

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setUnread(0);
      setConfirmClear(false);
      setTimeout(() => inputRef.current?.focus(), 320);
    }
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && open) setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sendMessage = async (override) => {
    const msg = (override ?? input).trim();
    if (!msg || loading) return;
    setMessages(prev => [...prev, { role: "user", text: msg, time: now() }]);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post(API_URL, { message: msg });
      setMessages(prev => [...prev, { role: "ai", text: res.data.reply, time: now() }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "ai",
        text: `⚠️ ${e?.response?.data?.message || "Connection failed. Check your backend."}`,
        time: now(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleChip = (chip) => {
    sendMessage(chip.replace(/\p{Emoji}/gu, "").trim());
  };

  const clearChat = () => { setMessages([]); setConfirmClear(false); };

  return (
    <>
      {/* ── Toggle Button ──────────────────────────── */}
      <button
        className={`chat-popup-toggle ${open ? "toggle-open" : "toggle-closed"}`}
        onClick={handleToggle}
        title={open ? "Close chat" : "Open AI Chat"}
        aria-label={open ? "Close AI chat" : "Open AI chat"}
      >
        <i className={`bi bi-${open ? "x-lg" : "chat-dots-fill"}`} />
        {!open && unread > 0 && (
          <span className="chat-popup-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {/* ── Panel ─────────────────────────────────── */}
      <div
        className={`chat-popup-panel ${open ? "popup-open" : "popup-closed"}`}
        role="dialog"
        aria-label="VEXORA AI AI Chat"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="popup-header">
          <div className="popup-header-left">
            <div className="popup-ai-avatar">
              <i className="bi bi-stars" />
            </div>
            <div className="popup-header-info">
              <strong>VEXORA <span style={{ color: "#8d76ff" }}>AI</span></strong>
              <div className="popup-status">
                <span className="popup-status-dot" />
                AI Online · Always ready
              </div>
            </div>
          </div>
          <div className="popup-header-actions">
            {messages.length > 0 && !confirmClear && (
              <button className="popup-header-btn" onClick={() => setConfirmClear(true)} title="Clear chat">
                <i className="bi bi-trash3" />
              </button>
            )}
            <button className="popup-header-btn popup-close-btn" onClick={() => setOpen(false)} title="Close">
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="popup-messages">
          {messages.length === 0 && !loading && (
            <div className="popup-welcome">
              <div className="popup-welcome-icon"><i className="bi bi-stars" /></div>
              <h4>Hey {userInitials === "U" ? "there" : userInitials}! 👋</h4>
              <p>Ask me anything about code, SQL, debugging, or architecture.</p>
              <div className="popup-chips">
                {QUICK_CHIPS.map(chip => (
                  <button key={chip} className="popup-chip" onClick={() => handleChip(chip)}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`popup-msg ${m.role === "user" ? "popup-msg-user" : "popup-msg-ai"}`}>
              <div className="popup-msg-avatar">
                {m.role === "user" ? <span>{userInitials}</span> : <i className="bi bi-stars" />}
              </div>
              <div className="popup-msg-content">
                <div className="popup-msg-bubble">
                  {m.role === "ai"
                    ? <MarkdownMessage text={m.text} />
                    : m.text
                  }
                </div>
                <div className="popup-msg-time">{m.time}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="popup-msg popup-msg-ai">
              <div className="popup-msg-avatar"><i className="bi bi-stars" /></div>
              <div className="popup-typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Confirm clear */}
        {confirmClear && (
          <div className="popup-clear-bar">
            <span>Clear all messages?</span>
            <button className="popup-clear-cancel" onClick={() => setConfirmClear(false)}>Cancel</button>
            <button onClick={clearChat}>Clear</button>
          </div>
        )}

        {/* Input */}
        <div className="popup-input-area">
          <div className="popup-input-wrap">
            <textarea
              ref={inputRef}
              className="popup-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything… (Enter to send)"
              rows={1}
              disabled={loading}
            />
            <button
              className="popup-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              {loading ? <i className="bi bi-hourglass-split" /> : <i className="bi bi-send-fill" />}
            </button>
          </div>
          <p className="popup-hint">⚡ Powered by VEXORA AI · Enter to send</p>
        </div>
      </div>
    </>
  );
}
