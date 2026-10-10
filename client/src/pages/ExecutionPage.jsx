import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { useAuth } from "../context/AuthContext";
import "./ExecutionPage.css";

const EXEC_API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/execute';
const CHAT_API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const LANGUAGES = [
  { id: "javascript", label: "JavaScript", icon: "bi-filetype-js", color: "#f7df1e", runner: "node" },
  { id: "python", label: "Python", icon: "bi-filetype-py", color: "#3776ab", runner: "python" },
  { id: "html", label: "HTML", icon: "bi-filetype-html", color: "#e34c26", runner: "preview" },
  { id: "css", label: "CSS", icon: "bi-filetype-css", color: "#264de4", runner: "preview" },
];

const STARTER = {
  javascript: `// JavaScript — VEXORA AI Runner
console.log("Hello from VEXORA AI! 🚀");

const nums = [1, 2, 3, 4, 5];
const doubled = nums.map(n => n * 2);
console.log("Doubled:", doubled);

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i <= 8; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}`,

  python: `# Python — VEXORA AI Runner
print("Hello from VEXORA AI! 🚀")

nums = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in nums]
print("Doubled:", doubled)

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(9):
    print(f"fib({i}) = {fibonacci(i)}")`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <style>
    body { margin: 0; padding: 24px; font-family: "Inter", sans-serif;
           background: #0a0a0f; color: #f0f0ff; }
    h1   { background: linear-gradient(90deg,#7c3aed,#ec4899);
           -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    p    { color: #8888aa; }
    .card { background:#111118; border:1px solid rgba(255,255,255,.08);
            border-radius:12px; padding:20px; margin-top:16px; }
  </style>
</head>
<body>
  <h1>VEXORA AI Preview ✨</h1>
  <p>Edit HTML above and see changes live in Preview tab.</p>
  <div class="card">
    <strong>Card component</strong>
    <p>This is a live HTML preview.</p>
  </div>
</body>
</html>`,

  css: `/* CSS Preview */
body {
  margin: 0;
  padding: 24px;
  font-family: "Inter", sans-serif;
  background: linear-gradient(135deg, #0a0a0f, #1a0a3e);
  color: #f0f0ff;
  min-height: 100vh;
}

h1 {
  font-size: 2rem;
  background: linear-gradient(90deg, #7c3aed, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}`,
};

const TERMINAL_HISTORY_KEY = "VEXORA AI-terminal-history";

export default function ExecutionPage() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [lang, setLang] = useState("javascript");
  const [code, setCode] = useState(STARTER.javascript);
  const [activeTab, setActiveTab] = useState("output"); // output | debug | terminal | preview
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState([]);        // [{type, text, ts}]
  const [debugInfo, setDebugInfo] = useState(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [lastError, setLastError] = useState("");

  // Terminal state
  const [termHistory, setTermHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TERMINAL_HISTORY_KEY) || "[]"); } catch { return []; }
  });
  const [termInput, setTermInput] = useState("");
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [cmdHistory, setCmdHistory] = useState([]);
  const termRef = useRef(null);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const langObj = LANGUAGES.find(l => l.id === lang);

  // Scroll output to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output, termHistory, debugInfo]);

  // Save terminal history
  useEffect(() => {
    localStorage.setItem(TERMINAL_HISTORY_KEY, JSON.stringify(termHistory.slice(-200)));
  }, [termHistory]);

  const addOutput = (type, text) => {
    setOutput(prev => [...prev, { type, text, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }]);
  };

  // ── Run Code (Step 32) ────────────────────────────
  const runCode = async () => {
    if (running || !code.trim()) return;
    setRunning(true);
    setLastError("");
    addOutput("info", `▶ Running ${langObj?.label} code…`);
    setActiveTab("output");

    try {
      const res = await axios.post(EXEC_API, { code, language: lang }, { headers });
      if (res.data.success) {
        addOutput("success", res.data.output || "(no output)");
        addOutput("info", `✅ Finished in ${Date.now()}ms`);
      } else {
        const errOut = res.data.output || "Execution failed";
        setLastError(errOut);
        addOutput("error", errOut);
      }
    } catch (e) {
      const msg = e?.response?.data?.output || e?.response?.data?.message || "Server error";
      setLastError(msg);
      addOutput("error", msg);
    } finally {
      setRunning(false);
    }
  };

  // ── Debugger (Step 33) ────────────────────────────
  const debugCode = async () => {
    if (!code.trim()) return;
    setDebugLoading(true);
    setActiveTab("debug");
    setDebugInfo(null);

    try {
      // Ask AI to analyze code + error
      const prompt = lastError
        ? `Debug this ${lang} code. The error was:\n\n${lastError}\n\nCode:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nExplain the bug and provide the fixed code.`
        : `Analyze this ${lang} code for potential bugs, errors, and issues:\n\`\`\`${lang}\n${code}\n\`\`\`\n\nList all issues found and how to fix them.`;

      const res = await axios.post(CHAT_API, { message: prompt });
      setDebugInfo({
        hasError: !!lastError,
        errorText: lastError,
        analysis: res.data.reply,
      });
    } catch (e) {
      setDebugInfo({ hasError: false, errorText: "", analysis: "AI debug unavailable. Check your connection." });
    } finally {
      setDebugLoading(false);
    }
  };

  // ── Terminal (Step 31) ────────────────────────────
  const handleTermCmd = async (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(idx);
      if (cmdHistory[idx]) setTermInput(cmdHistory[idx]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setTermInput(idx === -1 ? "" : cmdHistory[idx] || "");
      return;
    }
    if (e.key !== "Enter") return;
    const cmd = termInput.trim();
    if (!cmd) return;

    setHistoryIdx(-1);
    setCmdHistory(prev => [cmd, ...prev].slice(0, 50));
    setTermInput("");
    setTermHistory(prev => [...prev, { type: "input", text: `$ ${cmd}` }]);

    // Terminal commands
    if (cmd === "clear") { setTermHistory([]); return; }
    if (cmd === "help") {
      setTermHistory(prev => [...prev, {
        type: "output", text: `Available commands:
  help          — show this help
  clear         — clear terminal
  run           — run current editor code
  lang          — show current language
  lang <name>   — switch language (javascript|python|html|css)
  version       — show runtime versions
  about         — about VEXORA AI` }]);
      return;
    }
    if (cmd === "run") { runCode(); setActiveTab("output"); return; }
    if (cmd === "lang") {
      setTermHistory(prev => [...prev, { type: "output", text: `Current language: ${lang}` }]);
      return;
    }
    if (cmd.startsWith("lang ")) {
      const l = cmd.split(" ")[1]?.toLowerCase();
      if (LANGUAGES.find(x => x.id === l)) {
        setLang(l);
        setCode(STARTER[l] || "");
        setTermHistory(prev => [...prev, { type: "output", text: `Switched to ${l}` }]);
      } else {
        setTermHistory(prev => [...prev, { type: "error", text: `Unknown language: ${l}` }]);
      }
      return;
    }
    if (cmd === "version") {
      setTermHistory(prev => [...prev, { type: "output", text: "Node.js v20  |  Python 3.12  |  VEXORA AI v1.0" }]);
      return;
    }
    if (cmd === "about") {
      setTermHistory(prev => [...prev, { type: "output", text: "VEXORA AI — AI Developer Platform\nCode · Run · Debug · Preview" }]);
      return;
    }

    // Unknown command — ask AI
    try {
      setTermHistory(prev => [...prev, { type: "info", text: "Asking AI…" }]);
      const res = await axios.post(CHAT_API, { message: `Terminal command: "${cmd}"\nBriefly explain this command and what it does (1-2 sentences).` });
      setTermHistory(prev => [...prev, { type: "output", text: res.data.reply }]);
    } catch {
      setTermHistory(prev => [...prev, { type: "error", text: `Command not found: ${cmd}` }]);
    }
  };

  const clearOutput = () => setOutput([]);

  return (
    <div className="ex-root">
      <div className="ex-glow-a" /><div className="ex-glow-b" />

      {/* ── Header ── */}
      <div className="ex-header">
        <div className="ex-header-left">
          <div className="ex-header-icon"><i className="bi bi-play-circle-fill" /></div>
          <div>
            <h1 className="ex-title">Execution Engine</h1>
            <p className="ex-sub">Run, debug and preview code in real-time</p>
          </div>
        </div>

        {/* Language selector */}
        <div className="ex-lang-row">
          {LANGUAGES.map(l => (
            <button
              key={l.id}
              className={`ex-lang-btn ${lang === l.id ? "ex-lang-active" : ""}`}
              style={{ "--lc": l.color }}
              onClick={() => { setLang(l.id); setCode(STARTER[l.id]); setOutput([]); setDebugInfo(null); setLastError(""); }}
            >
              <i className={`bi ${l.icon}`} />
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="ex-layout">

        {/* Left — Editor */}
        <div className="ex-editor-panel">
          <div className="ex-editor-head">
            <div className="ex-editor-title">
              <i className={`bi ${langObj?.icon}`} style={{ color: langObj?.color }} />
              <span>main.{lang === "javascript" ? "js" : lang === "python" ? "py" : lang}</span>
              {lastError && <span className="ex-error-dot" title="Error detected" />}
            </div>
            <div className="ex-editor-actions">
              <button className="ex-action-btn ex-debug-btn" onClick={debugCode} title="Debug with AI">
                <i className="bi bi-bug-fill" /> Debug
              </button>
              <button
                className={`ex-action-btn ex-run-btn ${running ? "ex-running" : ""}`}
                onClick={runCode}
                disabled={running}
                style={{ "--lc": langObj?.color }}
              >
                {running
                  ? <><div className="ex-run-spinner" /><span>Running…</span></>
                  : <><i className="bi bi-play-fill" /><span>Run</span></>}
              </button>
            </div>
          </div>

          <div className="ex-monaco-wrap">
            <Editor
              height="100%"
              language={lang === "html" ? "html" : lang === "css" ? "css" : lang === "python" ? "python" : "javascript"}
              value={code}
              theme="vs-dark"
              onChange={v => setCode(v || "")}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                automaticLayout: true,
                wordWrap: "on",
                padding: { top: 12 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                lineNumbers: "on",
                folding: true,
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
        </div>

        {/* Right — Output/Debug/Terminal/Preview */}
        <div className="ex-right-panel">

          {/* Tab bar */}
          <div className="ex-tabs">
            {[
              { id: "output", icon: "bi-terminal-fill", label: "Output" },
              { id: "debug", icon: "bi-bug-fill", label: "Debugger" },
              { id: "terminal", icon: "bi-terminal", label: "Terminal" },
              { id: "preview", icon: "bi-eye-fill", label: "Preview" },
            ].map(t => (
              <button
                key={t.id}
                className={`ex-tab ${activeTab === t.id ? "ex-tab-active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                <i className={`bi ${t.icon}`} />
                <span>{t.label}</span>
                {t.id === "debug" && lastError && <span className="ex-tab-badge" />}
              </button>
            ))}
            {activeTab === "output" && output.length > 0 && (
              <button className="ex-clear-btn" onClick={clearOutput} title="Clear output">
                <i className="bi bi-x-lg" />
              </button>
            )}
          </div>

          {/* ── OUTPUT TAB ── */}
          {activeTab === "output" && (
            <div className="ex-output-area">
              {output.length === 0 ? (
                <div className="ex-empty">
                  <i className="bi bi-play-circle" />
                  <p>Press <strong>Run</strong> to execute your code</p>
                  <div className="ex-shortcuts">
                    <span><kbd>Ctrl+Enter</kbd> Run</span>
                    <span><kbd>Ctrl+D</kbd> Debug</span>
                  </div>
                </div>
              ) : (
                <div className="ex-output-lines">
                  {output.map((line, i) => (
                    <div key={i} className={`ex-line ex-line-${line.type}`}>
                      <span className="ex-line-ts">{line.ts}</span>
                      <pre className="ex-line-text">{line.text}</pre>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
          )}

          {/* ── DEBUGGER TAB (Step 33) ── */}
          {activeTab === "debug" && (
            <div className="ex-debug-area">
              {debugLoading ? (
                <div className="ex-empty">
                  <div className="ex-debug-ring" />
                  <p>AI is analyzing your code…</p>
                </div>
              ) : debugInfo ? (
                <div className="ex-debug-content">
                  {debugInfo.hasError && (
                    <div className="ex-debug-error-box">
                      <div className="ex-debug-error-head">
                        <i className="bi bi-exclamation-triangle-fill" /> Error Detected
                      </div>
                      <pre className="ex-debug-error-text">{debugInfo.errorText}</pre>
                    </div>
                  )}
                  <div className="ex-debug-ai">
                    <div className="ex-debug-ai-head">
                      <img src="/logo.png" alt="AI" className="ex-debug-logo" />
                      <span>VEXORA AI Analysis</span>
                    </div>
                    <pre className="ex-debug-analysis">{debugInfo.analysis}</pre>
                  </div>
                </div>
              ) : (
                <div className="ex-empty">
                  <i className="bi bi-bug" />
                  <p>Click <strong>Debug</strong> to analyze your code with AI</p>
                  <p className="ex-empty-sub">Run code first to capture errors for deeper analysis</p>
                </div>
              )}
            </div>
          )}

          {/* ── TERMINAL TAB (Step 31) ── */}
          {activeTab === "terminal" && (
            <div className="ex-terminal" ref={termRef} onClick={() => inputRef.current?.focus()}>
              <div className="ex-term-head">
                <div className="ex-term-dots">
                  <span className="ex-dot-r" /><span className="ex-dot-y" /><span className="ex-dot-g" />
                </div>
                <span className="ex-term-title">
                  <i className="bi bi-terminal-fill" /> VEXORA AI — bash
                </span>
                <button className="ex-clear-btn" onClick={() => setTermHistory([])} title="Clear">
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <div className="ex-term-body">
                {termHistory.length === 0 && (
                  <div className="ex-term-welcome">
                    <p className="ex-dim">VEXORA AI Terminal — Type <span className="ex-cyan">help</span> to see commands</p>
                  </div>
                )}
                {termHistory.map((line, i) => (
                  <div key={i} className={`ex-term-line ex-term-${line.type}`}>
                    <pre>{line.text}</pre>
                  </div>
                ))}
                <div ref={bottomRef} />

                {/* Input row */}
                <div className="ex-term-input-row">
                  <span className="ex-term-prompt">
                    <span className="ex-green">VEXORA AI</span>
                    <span className="ex-dim">:</span>
                    <span className="ex-cyan">~</span>
                    <span className="ex-dim"> $ </span>
                  </span>
                  <input
                    ref={inputRef}
                    className="ex-term-input"
                    value={termInput}
                    onChange={e => setTermInput(e.target.value)}
                    onKeyDown={handleTermCmd}
                    placeholder="type a command…"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── PREVIEW TAB (Step 34+35) — shown in PreviewPage instead ── */}
          {activeTab === "preview" && (
            <div className="ex-preview-area">
              {(lang === "html" || lang === "css") ? (
                <iframe
                  className="ex-preview-frame"
                  srcDoc={lang === "html" ? code : `<style>${code}</style><body style="margin:0;padding:24px;font-family:sans-serif;background:#0a0a0f;color:#f0f0ff"><h1>CSS Preview</h1><p>Your styles are applied here.</p></body>`}
                  sandbox="allow-scripts allow-same-origin"
                  title="Preview"
                />
              ) : (
                <div className="ex-empty">
                  <i className="bi bi-eye" />
                  <p>Preview is available for <strong>HTML</strong> and <strong>CSS</strong></p>
                  <p className="ex-empty-sub">Switch language to HTML/CSS to see live preview</p>
                  <button className="ex-switch-btn" onClick={() => { setLang("html"); setCode(STARTER.html); }}>
                    <i className="bi bi-filetype-html" /> Switch to HTML
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
