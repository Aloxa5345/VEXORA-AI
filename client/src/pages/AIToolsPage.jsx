import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./AIToolsPage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const TOOLS = [
  {
    id: "refactor",
    icon: "bi-arrow-repeat",
    label: "Code Refactoring",
    color: "#7c3aed",
    desc: "Improve code quality, readability and performance",
    placeholder: "// Paste your code here to refactor...\nfunction getData(d) {\n  var x = [];\n  for(var i=0;i<d.length;i++) { x.push(d[i]) }\n  return x\n}",
    buildPrompt: (code, lang) =>
      `Refactor the following ${lang} code. Improve naming, readability, performance, and follow best practices. Explain each change:\n\n\`\`\`${lang}\n${code}\n\`\`\``,
  },
  {
    id: "tests",
    icon: "bi-check2-circle",
    label: "Test Generation",
    color: "#10b981",
    desc: "Auto-generate unit tests for your code",
    placeholder: "// Paste the function or class you want tests for...\nfunction add(a, b) {\n  return a + b;\n}",
    buildPrompt: (code, lang) =>
      `Generate comprehensive unit tests for the following ${lang} code. Use the most popular testing framework for ${lang} (Jest for JS/TS, pytest for Python, etc). Include edge cases:\n\n\`\`\`${lang}\n${code}\n\`\`\``,
  },
  {
    id: "docs",
    icon: "bi-file-earmark-text",
    label: "Documentation Generator",
    color: "#06b6d4",
    desc: "Generate JSDoc, docstrings, and README sections",
    placeholder: "// Paste your code to document...\nfunction fetchUser(id) {\n  return db.query('SELECT * FROM users WHERE id = ?', [id]);\n}",
    buildPrompt: (code, lang) =>
      `Generate complete documentation for the following ${lang} code. Include: JSDoc/docstrings for all functions, parameter descriptions, return types, usage examples, and a README section:\n\n\`\`\`${lang}\n${code}\n\`\`\``,
  },
];

const LANGUAGES = ["javascript", "typescript", "python", "java", "php", "go", "rust", "c++", "c#", "sql", "bash"];

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="at-code-wrap">
      <div className="at-code-bar">
        <span>{language || "code"}</span>
        <button onClick={copy}><i className={`bi bi-${copied ? "check-lg" : "clipboard"}`} /> {copied ? "Copied!" : "Copy"}</button>
      </div>
      <SyntaxHighlighter style={oneDark} language={language || "text"} PreTag="div"
        customStyle={{ margin: 0, borderRadius: "0 0 8px 8px", fontSize: "12.5px", padding: "14px", background: "#0d1117" }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState("refactor");
  const [code, setCode] = useState("");
  const [lang, setLang] = useState("javascript");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tool = TOOLS.find(t => t.id === activeTool);

  const handleRun = async () => {
    if (!code.trim()) return setError("Please paste some code first.");
    setLoading(true); setResult(""); setError("");
    try {
      const res = await axios.post(`${API}`, { message: tool.buildPrompt(code, lang) });
      setResult(res.data.reply);
    } catch (e) {
      setError(e?.response?.data?.message || "AI service unavailable. Try again.");
    } finally { setLoading(false); }
  };

  const handleCopyResult = () => {
    if (result) navigator.clipboard.writeText(result);
  };

  return (
    <div className="at-root">
      <div className="at-glow-a" /><div className="at-glow-b" />

      <div className="at-inner">

        {/* Header */}
        <div className="at-header">
          <div className="at-header-left">
            <div className="at-header-icon"><i className="bi bi-stars" /></div>
            <div>
              <h1 className="at-title">AI Developer Tools</h1>
              <p className="at-sub">Refactor, test, and document your code with AI</p>
            </div>
          </div>
        </div>

        {/* Tool selector */}
        <div className="at-tool-tabs">
          {TOOLS.map(t => (
            <button
              key={t.id}
              className={`at-tool-tab ${activeTool === t.id ? "at-tool-active" : ""}`}
              style={{ "--tc": t.color }}
              onClick={() => { setActiveTool(t.id); setResult(""); setError(""); }}
            >
              <i className={`bi ${t.icon}`} />
              <div>
                <strong>{t.label}</strong>
                <span>{t.desc}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Main workspace */}
        <div className="at-workspace">

          {/* Left — Input */}
          <div className="at-panel">
            <div className="at-panel-head">
              <div className="at-panel-title">
                <i className={`bi ${tool.icon}`} style={{ color: tool.color }} />
                <span>Input Code</span>
              </div>
              <div className="at-lang-wrap">
                <select className="at-lang-select" value={lang} onChange={e => setLang(e.target.value)}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button className="at-clear-btn" onClick={() => setCode("")} title="Clear">
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            </div>
            <textarea
              className="at-code-input"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={tool.placeholder}
              spellCheck={false}
            />
            {error && (
              <div className="at-error">
                <i className="bi bi-exclamation-triangle-fill" /> {error}
              </div>
            )}
            <button
              className={`at-run-btn ${loading ? "at-running" : ""}`}
              style={{ "--tc": tool.color }}
              onClick={handleRun}
              disabled={loading || !code.trim()}
            >
              {loading
                ? <><div className="at-btn-spinner" /><span>Processing…</span></>
                : <><i className={`bi ${tool.icon}`} /><span>{tool.label}</span></>}
            </button>
          </div>

          {/* Right — Result */}
          <div className="at-panel">
            <div className="at-panel-head">
              <div className="at-panel-title">
                <i className="bi bi-stars" style={{ color: "#c084fc" }} />
                <span>AI Result</span>
              </div>
              {result && (
                <button className="at-copy-result" onClick={handleCopyResult}>
                  <i className="bi bi-clipboard" /> Copy All
                </button>
              )}
            </div>

            <div className="at-result-area">
              {!result && !loading && (
                <div className="at-result-empty">
                  <i className={`bi ${tool.icon}`} />
                  <p>Paste your code and click <strong>{tool.label}</strong></p>
                  <span>AI will analyze and {
                    activeTool === "refactor" ? "improve your code" :
                      activeTool === "tests" ? "generate unit tests for it" :
                        "generate documentation for it"
                  }</span>
                </div>
              )}

              {loading && (
                <div className="at-result-loading">
                  <div className="at-loading-ring" />
                  <p>AI is analyzing your code…</p>
                  <span>This may take a few seconds</span>
                </div>
              )}

              {result && !loading && (
                <div className="at-result-content">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline
                          ? <CodeBlock language={match?.[1]}>{children}</CodeBlock>
                          : <code className="at-inline-code" {...props}>{children}</code>;
                      },
                      p: ({ children }) => <p className="at-p">{children}</p>,
                      h1: ({ children }) => <h1 className="at-h1">{children}</h1>,
                      h2: ({ children }) => <h2 className="at-h2">{children}</h2>,
                      h3: ({ children }) => <h3 className="at-h3">{children}</h3>,
                      ul: ({ children }) => <ul className="at-ul">{children}</ul>,
                      ol: ({ children }) => <ol className="at-ol">{children}</ol>,
                      li: ({ children }) => <li className="at-li">{children}</li>,
                      strong: ({ children }) => <strong className="at-strong">{children}</strong>,
                      blockquote: ({ children }) => <blockquote className="at-bq">{children}</blockquote>,
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
