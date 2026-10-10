import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./IntegrationsPage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const GIT_TOPICS = [
  { label: "Merge Conflict", prompt: "Explain how to resolve a Git merge conflict step by step with examples." },
  { label: "Rebase vs Merge", prompt: "Explain the difference between Git rebase and merge with when to use each." },
  { label: "Git Flow", prompt: "Explain Git Flow branching strategy with best practices." },
  { label: "Undo a Commit", prompt: "How to undo the last Git commit? Show all options: --soft, --mixed, --hard." },
  { label: "Cherry Pick", prompt: "Explain git cherry-pick with examples." },
  { label: "Stash Usage", prompt: "How to use git stash effectively? Show all stash commands." },
];

const COMMON_CMDS = [
  { cmd: "git init", desc: "Initialize a new repository" },
  { cmd: "git clone <url>", desc: "Clone a remote repository" },
  { cmd: "git add .", desc: "Stage all changes" },
  { cmd: 'git commit -m "message"', desc: "Commit staged changes" },
  { cmd: "git push origin main", desc: "Push to remote main branch" },
  { cmd: "git pull origin main", desc: "Pull latest changes" },
  { cmd: "git branch <name>", desc: "Create a new branch" },
  { cmd: "git checkout <branch>", desc: "Switch to branch" },
  { cmd: "git merge <branch>", desc: "Merge branch into current" },
  { cmd: "git log --oneline", desc: "View commit history" },
  { cmd: "git stash", desc: "Stash current changes" },
  { cmd: "git reset --hard HEAD", desc: "Discard all local changes" },
];

export default function GitPage() {
  const { token } = useAuth();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const askAI = async (q) => {
    const msg = q || question.trim();
    if (!msg) { setError("Enter a Git question."); return; }
    setLoading(true); setError(""); setAnswer("");
    try {
      const res = await axios.post(API,
        { message: `You are a Git expert. ${msg}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnswer(res.data.reply);
    } catch (e) {
      setError(e?.response?.data?.message || "AI failed.");
    } finally { setLoading(false); }
  };

  const copyCmd = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopied(cmd);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="int-page">
      <div className="int-bg-glow" style={{ "--glow-color": "rgba(240,100,40,0.12)" }} />
      <div className="int-inner">

        <div className="int-header">
          <div className="int-header-icon" style={{ background: "linear-gradient(135deg,#f05133,#e84d31)" }}>
            <i className="bi bi-git" />
          </div>
          <div>
            <h1>Git Assistant</h1>
            <p>Commands, workflows, and AI help for Git</p>
          </div>
        </div>

        {/* Quick topics */}
        <h3 className="int-section-title"><i className="bi bi-lightning-fill" /> Quick Topics</h3>
        <div className="int-topics">
          {GIT_TOPICS.map(t => (
            <button key={t.label} className="int-topic-btn" onClick={() => { setQuestion(t.prompt); askAI(t.prompt); }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Ask anything */}
        <div className="int-panel">
          <h3><i className="bi bi-chat-dots-fill" /> Ask Git Question</h3>
          <div className="int-input-row">
            <input
              type="text"
              value={question}
              onChange={e => { setQuestion(e.target.value); setError(""); }}
              placeholder="How do I resolve a merge conflict?"
              disabled={loading}
              onKeyDown={e => e.key === "Enter" && askAI()}
            />
            <button className="int-btn-primary" onClick={() => askAI()} disabled={loading || !question.trim()}>
              {loading ? <><span className="int-spinner" /> Thinking...</> : <><i className="bi bi-stars" /> Ask AI</>}
            </button>
          </div>
          {error && <div className="int-error"><i className="bi bi-exclamation-triangle-fill" />{error}</div>}
        </div>

        {answer && (
          <div className="int-result-panel">
            <div className="int-result-header">
              <i className="bi bi-git" />
              <span>Git AI Answer</span>
              <button className="int-copy-btn" onClick={() => navigator.clipboard.writeText(answer)}>
                <i className="bi bi-clipboard" /> Copy
              </button>
            </div>
            <pre className="int-result-content">{answer}</pre>
          </div>
        )}

        {/* Command Reference */}
        <h3 className="int-section-title"><i className="bi bi-terminal-fill" /> Command Reference</h3>
        <div className="int-cmd-grid">
          {COMMON_CMDS.map(c => (
            <div className="int-cmd-card" key={c.cmd}>
              <div className="int-cmd-top">
                <code>{c.cmd}</code>
                <button className="int-cmd-copy" onClick={() => copyCmd(c.cmd)} title="Copy">
                  <i className={`bi bi-${copied === c.cmd ? "check-lg" : "clipboard"}`} />
                </button>
              </div>
              <span>{c.desc}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
