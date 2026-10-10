import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./DocsGeneratorPage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const DOC_TYPES = [
  {
    id: "jsdoc",
    icon: "bi-file-earmark-code-fill",
    label: "JSDoc / Docstrings",
    color: "#7c3aed",
    desc: "Add JSDoc, Python docstrings, or inline comments",
    prompt: (code, lang) =>
      `Add complete ${lang} documentation to this code. Include JSDoc/docstring comments for every function, class, and method. Add parameter types, return types, descriptions, and usage examples:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\nReturn the fully documented code.`,
  },
  {
    id: "readme",
    icon: "bi-file-earmark-text-fill",
    label: "README Generator",
    color: "#06b6d4",
    desc: "Generate a professional README.md for your project",
    prompt: (code, lang) =>
      `Generate a professional README.md file for this ${lang} code/project:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\nInclude: Project title, description, features list, installation steps, usage examples, API reference (if applicable), contributing guidelines, and license section. Use proper Markdown formatting.`,
  },
  {
    id: "api",
    icon: "bi-cloud-fill",
    label: "API Documentation",
    color: "#10b981",
    desc: "Generate REST API docs in Markdown format",
    prompt: (code, lang) =>
      `Generate comprehensive REST API documentation for this ${lang} code:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\nFor each endpoint include: HTTP method, URL, description, request headers, request body (with types), response format, status codes, and curl examples.`,
  },
  {
    id: "inline",
    icon: "bi-chat-left-text-fill",
    label: "Inline Comments",
    color: "#f59e0b",
    desc: "Add clear inline comments explaining logic",
    prompt: (code, lang) =>
      `Add clear, helpful inline comments to this ${lang} code. Explain the logic, algorithms, and non-obvious parts. Don't over-comment obvious lines, focus on WHY not just WHAT:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\nReturn the code with comments added.`,
  },
  {
    id: "changelog",
    icon: "bi-clock-history",
    label: "Changelog",
    color: "#ec4899",
    desc: "Generate CHANGELOG from code or description",
    prompt: (code, lang) =>
      `Generate a professional CHANGELOG.md based on this ${lang} code or description:\n\n${code}\n\nUse Keep a Changelog format with sections: Added, Changed, Fixed, Removed. Include version numbers and dates.`,
  },
  {
    id: "wiki",
    icon: "bi-book-fill",
    label: "Technical Wiki",
    color: "#f97316",
    desc: "Create wiki-style technical documentation",
    prompt: (code, lang) =>
      `Create detailed technical wiki documentation for this ${lang} code:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\nInclude: Architecture overview, data flow, key components explanation, configuration options, troubleshooting guide, and FAQ section.`,
  },
];

const LANGUAGES = ["javascript", "typescript", "python", "java", "php", "go", "rust", "c++", "c#", "sql", "bash", "kotlin", "swift"];

const QUICK_EXAMPLES = [
  { label: "Express Route", lang: "javascript", code: `router.post('/api/users', authenticate, async (req, res) => {\n  const { name, email, password } = req.body;\n  const user = await User.create({ name, email, password });\n  res.status(201).json({ success: true, user });\n});` },
  { label: "Python Class", lang: "python", code: `class DatabaseManager:\n  def __init__(self, host, port, db_name):\n    self.host = host\n    self.port = port\n    self.db_name = db_name\n    self.connection = None\n\n  def connect(self):\n    self.connection = psycopg2.connect(host=self.host, port=self.port, dbname=self.db_name)\n    return self.connection` },
  { label: "React Hook", lang: "javascript", code: `function useAuth() {\n  const [user, setUser] = useState(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    const token = localStorage.getItem('token');\n    if (token) verifyToken(token).then(setUser);\n    setLoading(false);\n  }, []);\n\n  return { user, loading };\n}` },
];

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="dg-code-wrap">
      <div className="dg-code-bar">
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

export default function DocsGeneratorPage() {
  const [activeType, setActiveType] = useState("jsdoc");
  const [code, setCode] = useState("");
  const [lang, setLang] = useState("javascript");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const docType = DOC_TYPES.find(d => d.id === activeType);

  const handleGenerate = async () => {
    if (!code.trim()) return setError("Please paste some code or description first.");
    setLoading(true); setResult(""); setError("");
    try {
      const res = await axios.post(API, { message: docType.prompt(code, lang) });
      setResult(res.data.reply);
    } catch (e) {
      setError(e?.response?.data?.message || "AI service unavailable. Try again.");
    } finally { setLoading(false); }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadExample = (ex) => {
    setCode(ex.code);
    setLang(ex.lang);
    setResult(""); setError("");
  };

  return (
    <div className="dg-root">
      <div className="dg-glow-a" /><div className="dg-glow-b" />
      <div className="dg-inner">

        {/* Header */}
        <div className="dg-header">
          <div className="dg-header-left">
            <div className="dg-header-icon"><i className="bi bi-file-earmark-text-fill" /></div>
            <div>
              <h1 className="dg-title">Documentation Generator</h1>
              <p className="dg-sub">Generate JSDoc, README, API docs, changelogs and more with AI</p>
            </div>
          </div>
          {result && (
            <button className={`dg-copy-all ${copied ? "dg-copied" : ""}`} onClick={handleCopyAll}>
              <i className={`bi bi-${copied ? "check-lg" : "clipboard"}`} />
              {copied ? "Copied!" : "Copy All"}
            </button>
          )}
        </div>

        {/* Doc type grid */}
        <div className="dg-type-grid">
          {DOC_TYPES.map(t => (
            <button
              key={t.id}
              className={`dg-type-btn ${activeType === t.id ? "dg-type-active" : ""}`}
              style={{ "--tc": t.color }}
              onClick={() => { setActiveType(t.id); setResult(""); setError(""); }}
            >
              <div className="dg-type-icon"><i className={`bi ${t.icon}`} /></div>
              <div className="dg-type-info">
                <strong>{t.label}</strong>
                <span>{t.desc}</span>
              </div>
              {activeType === t.id && <i className="bi bi-check-circle-fill dg-type-check" />}
            </button>
          ))}
        </div>

        <div className="dg-workspace">

          {/* Left — Input */}
          <div className="dg-left">
            <div className="dg-panel">
              <div className="dg-panel-head">
                <div className="dg-panel-title">
                  <i className={`bi ${docType.icon}`} style={{ color: docType.color }} />
                  <span>Input Code</span>
                </div>
                <div className="dg-controls">
                  <select className="dg-lang-select" value={lang} onChange={e => setLang(e.target.value)}>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button className="dg-clear-btn" onClick={() => { setCode(""); setResult(""); }} title="Clear">
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
              </div>
              <textarea
                className="dg-code-input"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={`Paste your ${lang} code here…\n\n${docType.id === "readme" || docType.id === "changelog" ? "Or describe your project/changes in plain text." : "AI will generate documentation for it."}`}
                spellCheck={false}
              />
              {error && (
                <div className="dg-error">
                  <i className="bi bi-exclamation-triangle-fill" /> {error}
                </div>
              )}
              <button
                className="dg-generate-btn"
                style={{ "--tc": docType.color }}
                onClick={handleGenerate}
                disabled={loading || !code.trim()}
              >
                {loading
                  ? <><div className="dg-spinner" /><span>Generating docs…</span></>
                  : <><i className={`bi ${docType.icon}`} /><span>Generate {docType.label}</span></>}
              </button>
            </div>

            {/* Quick examples */}
            <div className="dg-examples">
              <p className="dg-examples-label"><i className="bi bi-lightning-fill" /> Quick Examples</p>
              {QUICK_EXAMPLES.map((ex, i) => (
                <button key={i} className="dg-example-btn" onClick={() => loadExample(ex)}>
                  <i className="bi bi-code-slash" />
                  <span>{ex.label}</span>
                  <span className="dg-example-lang">{ex.lang}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right — Result */}
          <div className="dg-panel dg-result-panel">
            <div className="dg-panel-head">
              <div className="dg-panel-title">
                <i className="bi bi-stars" style={{ color: "#c084fc" }} />
                <span>Generated Documentation</span>
              </div>
              {result && (
                <div className="dg-result-actions">
                  <span className="dg-word-count">{result.split(" ").length} words</span>
                  <button className="dg-copy-btn" onClick={handleCopyAll}>
                    <i className={`bi bi-${copied ? "check-lg" : "clipboard"}`} />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>

            <div className="dg-result-area">
              {!result && !loading && (
                <div className="dg-empty">
                  <div className="dg-empty-icon" style={{ "--tc": docType.color }}>
                    <i className={`bi ${docType.icon}`} />
                  </div>
                  <h3>{docType.label}</h3>
                  <p>{docType.desc}</p>
                  <div className="dg-empty-steps">
                    <span><i className="bi bi-1-circle-fill" /> Paste your code</span>
                    <span><i className="bi bi-2-circle-fill" /> Choose language</span>
                    <span><i className="bi bi-3-circle-fill" /> Click Generate</span>
                  </div>
                </div>
              )}

              {loading && (
                <div className="dg-loading">
                  <div className="dg-loading-ring" style={{ "--tc": docType.color }} />
                  <p>Generating {docType.label}…</p>
                  <span>AI is analyzing your code and writing documentation</span>
                </div>
              )}

              {result && !loading && (
                <div className="dg-result-content">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline
                          ? <CodeBlock language={match?.[1]}>{children}</CodeBlock>
                          : <code className="dg-inline-code" {...props}>{children}</code>;
                      },
                      p: ({ children }) => <p className="dg-p">{children}</p>,
                      h1: ({ children }) => <h1 className="dg-h1">{children}</h1>,
                      h2: ({ children }) => <h2 className="dg-h2">{children}</h2>,
                      h3: ({ children }) => <h3 className="dg-h3">{children}</h3>,
                      ul: ({ children }) => <ul className="dg-ul">{children}</ul>,
                      ol: ({ children }) => <ol className="dg-ol">{children}</ol>,
                      li: ({ children }) => <li className="dg-li">{children}</li>,
                      strong: ({ children }) => <strong className="dg-strong">{children}</strong>,
                      em: ({ children }) => <em className="dg-em">{children}</em>,
                      blockquote: ({ children }) => <blockquote className="dg-bq">{children}</blockquote>,
                      hr: () => <hr className="dg-hr" />,
                      a: ({ href, children }) => <a className="dg-link" href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
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
