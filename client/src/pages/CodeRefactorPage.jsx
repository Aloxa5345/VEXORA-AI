import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./CodeRefactorPage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const REFACTOR_MODES = [
  {
    id: "clean",
    icon: "bi-stars",
    label: "Clean Code",
    color: "#7c3aed",
    desc: "Improve naming, readability, and structure",
    prompt: (code, lang) => `Refactor this ${lang} code for clean code principles. Improve variable/function naming, reduce complexity, remove duplication, and follow SOLID principles. Explain each change:\n\n\`\`\`${lang}\n${code}\n\`\`\``,
  },
  {
    id: "performance",
    icon: "bi-lightning-fill",
    label: "Performance",
    color: "#f97316",
    desc: "Optimize for speed and efficiency",
    prompt: (code, lang) => `Optimize this ${lang} code for maximum performance. Identify bottlenecks, improve algorithms, reduce time/space complexity, optimize loops and data structures. Show Big-O analysis:\n\n\`\`\`${lang}\n${code}\n\`\`\``,
  },
  {
    id: "security",
    icon: "bi-shield-fill-check",
    label: "Security",
    color: "#10b981",
    desc: "Fix security vulnerabilities",
    prompt: (code, lang) => `Audit and fix security vulnerabilities in this ${lang} code. Check for: SQL injection, XSS, CSRF, insecure data handling, authentication issues, exposed secrets, input validation. Provide secure version:\n\n\`\`\`${lang}\n${code}\n\`\`\``,
  },
  {
    id: "modern",
    icon: "bi-arrow-up-circle-fill",
    label: "Modernize",
    color: "#06b6d4",
    desc: "Upgrade to modern syntax & patterns",
    prompt: (code, lang) => `Modernize this ${lang} code using the latest language features and best practices. Replace old patterns with modern alternatives (async/await, destructuring, optional chaining, etc.). Explain each upgrade:\n\n\`\`\`${lang}\n${code}\n\`\`\``,
  },
  {
    id: "dry",
    icon: "bi-arrow-repeat",
    label: "DRY Principle",
    color: "#ec4899",
    desc: "Remove duplication, extract reusable code",
    prompt: (code, lang) => `Apply the DRY (Don't Repeat Yourself) principle to this ${lang} code. Identify duplicated logic, extract reusable functions/components, create abstractions. Show before/after:\n\n\`\`\`${lang}\n${code}\n\`\`\``,
  },
  {
    id: "patterns",
    icon: "bi-diagram-3-fill",
    label: "Design Patterns",
    color: "#f59e0b",
    desc: "Apply appropriate design patterns",
    prompt: (code, lang) => `Analyze this ${lang} code and apply appropriate design patterns (Factory, Observer, Strategy, Repository, etc.). Explain which patterns fit and why, then provide the refactored version:\n\n\`\`\`${lang}\n${code}\n\`\`\``,
  },
];

const LANGUAGES = ["javascript", "typescript", "python", "java", "php", "go", "rust", "c++", "c#", "kotlin", "swift", "sql"];

const QUICK_EXAMPLES = [
  {
    label: "Messy function",
    lang: "javascript",
    code: `function p(d) {
  var r = [];
  for(var i=0;i<d.length;i++) {
    if(d[i].age>18 && d[i].active==true) {
      var obj = {};
      obj.n = d[i].firstName + ' ' + d[i].lastName;
      obj.e = d[i].email;
      obj.a = d[i].age;
      r.push(obj);
    }
  }
  return r;
}`,
  },
  {
    label: "SQL injection risk",
    lang: "javascript",
    code: `app.get('/user', (req, res) => {
  const id = req.query.id;
  const query = "SELECT * FROM users WHERE id = " + id;
  db.query(query, (err, result) => {
    res.json(result);
  });
});`,
  },
  {
    label: "Callback hell",
    lang: "javascript",
    code: `function getUser(id, cb) {
  db.query('SELECT * FROM users WHERE id=?', [id], function(err, user) {
    if(err) return cb(err);
    db.query('SELECT * FROM orders WHERE user_id=?', [user.id], function(err, orders) {
      if(err) return cb(err);
      db.query('SELECT * FROM payments WHERE order_id=?', [orders[0].id], function(err, payments) {
        if(err) return cb(err);
        cb(null, { user, orders, payments });
      });
    });
  });
}`,
  },
];

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="cr-code-wrap">
      <div className="cr-code-bar">
        <span>{language || "code"}</span>
        <button onClick={copy}><i className={`bi bi-${copied ? "check-lg" : "clipboard"}`} /> {copied ? "Copied!" : "Copy"}</button>
      </div>
      <SyntaxHighlighter style={oneDark} language={language || "javascript"} PreTag="div"
        customStyle={{ margin: 0, borderRadius: "0 0 8px 8px", fontSize: "12.5px", padding: "14px", background: "#0d1117" }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default function CodeRefactorPage() {
  const [mode, setMode] = useState("clean");
  const [code, setCode] = useState("");
  const [lang, setLang] = useState("javascript");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const activeMode = REFACTOR_MODES.find(m => m.id === mode);

  const handleRefactor = async () => {
    if (!code.trim()) return setError("Please paste your code first.");
    setLoading(true); setResult(""); setError("");
    try {
      const res = await axios.post(API, { message: activeMode.prompt(code, lang) });
      setResult(res.data.reply);
    } catch (e) {
      setError(e?.response?.data?.message || "AI service unavailable. Try again.");
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cr-root">
      <div className="cr-glow-a" /><div className="cr-glow-b" />
      <div className="cr-inner">

        {/* Header */}
        <div className="cr-header">
          <div className="cr-header-left">
            <div className="cr-header-icon"><i className="bi bi-arrow-repeat" /></div>
            <div>
              <h1 className="cr-title">Code Refactoring</h1>
              <p className="cr-sub">Clean, optimize, secure and modernize your code with AI</p>
            </div>
          </div>
          {result && (
            <button className={`cr-copy-all ${copied ? "cr-copied" : ""}`} onClick={handleCopy}>
              <i className={`bi bi-${copied ? "check-lg" : "clipboard"}`} />
              {copied ? "Copied!" : "Copy Result"}
            </button>
          )}
        </div>

        {/* Mode selector */}
        <div className="cr-modes">
          {REFACTOR_MODES.map(m => (
            <button
              key={m.id}
              className={`cr-mode-btn ${mode === m.id ? "cr-mode-active" : ""}`}
              style={{ "--mc": m.color }}
              onClick={() => { setMode(m.id); setResult(""); setError(""); }}
            >
              <div className="cr-mode-icon"><i className={`bi ${m.icon}`} /></div>
              <div className="cr-mode-info">
                <strong>{m.label}</strong>
                <span>{m.desc}</span>
              </div>
              {mode === m.id && <i className="bi bi-check-circle-fill cr-mode-check" />}
            </button>
          ))}
        </div>

        {/* Workspace */}
        <div className="cr-workspace">

          {/* Left — input */}
          <div className="cr-left">
            <div className="cr-panel">
              <div className="cr-panel-head">
                <div className="cr-panel-title">
                  <i className={`bi ${activeMode.icon}`} style={{ color: activeMode.color }} />
                  <span>Input Code</span>
                </div>
                <div className="cr-controls">
                  <select className="cr-lang-select" value={lang} onChange={e => setLang(e.target.value)}>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button className="cr-clear-btn" onClick={() => { setCode(""); setResult(""); }} title="Clear">
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
              </div>

              <textarea
                className="cr-code-input"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={`// Paste your ${lang} code here…\n// AI will ${activeMode.label.toLowerCase()} it for you`}
                spellCheck={false}
              />

              {error && (
                <div className="cr-error">
                  <i className="bi bi-exclamation-triangle-fill" /> {error}
                </div>
              )}

              <button
                className="cr-refactor-btn"
                style={{ "--mc": activeMode.color }}
                onClick={handleRefactor}
                disabled={loading || !code.trim()}
              >
                {loading
                  ? <><div className="cr-spinner" /><span>Refactoring…</span></>
                  : <><i className={`bi ${activeMode.icon}`} /><span>{activeMode.label}</span></>}
              </button>
            </div>

            {/* Quick examples */}
            <div className="cr-examples">
              <p className="cr-section-label">
                <i className="bi bi-lightning-fill" style={{ color: "#f59e0b" }} /> Quick Examples
              </p>
              {QUICK_EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  className="cr-example-btn"
                  onClick={() => { setCode(ex.code); setLang(ex.lang); setResult(""); setError(""); }}
                >
                  <i className="bi bi-code-slash" />
                  <span>{ex.label}</span>
                  <span className="cr-ex-lang">{ex.lang}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right — result */}
          <div className="cr-panel cr-result-panel">
            <div className="cr-panel-head">
              <div className="cr-panel-title">
                <i className="bi bi-stars" style={{ color: "#c084fc" }} />
                <span>Refactored Code</span>
                {result && (
                  <span className="cr-mode-badge" style={{ "--mc": activeMode.color }}>
                    {activeMode.label}
                  </span>
                )}
              </div>
            </div>

            <div className="cr-result-area">
              {!result && !loading && (
                <div className="cr-empty">
                  <div className="cr-empty-icon" style={{ "--mc": activeMode.color }}>
                    <i className={`bi ${activeMode.icon}`} />
                  </div>
                  <h3>{activeMode.label}</h3>
                  <p>{activeMode.desc}</p>
                  <div className="cr-empty-tips">
                    <span><i className="bi bi-1-circle-fill" /> Paste your code</span>
                    <span><i className="bi bi-2-circle-fill" /> Select language</span>
                    <span><i className="bi bi-3-circle-fill" /> Click Refactor</span>
                  </div>
                </div>
              )}

              {loading && (
                <div className="cr-loading">
                  <div className="cr-loading-ring" style={{ "--mc": activeMode.color }} />
                  <p>Analyzing & refactoring…</p>
                  <span>AI is improving your code quality</span>
                  <div className="cr-loading-steps">
                    {["Analyzing code", "Identifying issues", "Applying improvements", "Writing explanations"].map((s, i) => (
                      <div key={i} className="cr-step" style={{ animationDelay: `${i * 0.25}s` }}>
                        <div className="cr-step-dot" style={{ "--mc": activeMode.color }} /><span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result && !loading && (
                <div className="cr-result-content">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline
                          ? <CodeBlock language={match?.[1]}>{children}</CodeBlock>
                          : <code className="cr-inline-code" {...props}>{children}</code>;
                      },
                      p: ({ children }) => <p className="cr-p">{children}</p>,
                      h1: ({ children }) => <h1 className="cr-h1">{children}</h1>,
                      h2: ({ children }) => <h2 className="cr-h2">{children}</h2>,
                      h3: ({ children }) => <h3 className="cr-h3">{children}</h3>,
                      ul: ({ children }) => <ul className="cr-ul">{children}</ul>,
                      ol: ({ children }) => <ol className="cr-ol">{children}</ol>,
                      li: ({ children }) => <li className="cr-li">{children}</li>,
                      strong: ({ children }) => <strong className="cr-strong">{children}</strong>,
                      blockquote: ({ children }) => <blockquote className="cr-bq">{children}</blockquote>,
                    }}
                  >{result}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
