import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./ProjectGeneratorPage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const TEMPLATES = [
  { id: "api", icon: "bi-server", label: "REST API", stack: "Node.js + Express + MySQL", color: "#10b981" },
  { id: "react", icon: "bi-filetype-jsx", label: "React App", stack: "React + Vite + Tailwind", color: "#06b6d4" },
  { id: "fullstack", icon: "bi-layers-fill", label: "Full Stack", stack: "React + Node + MySQL", color: "#7c3aed" },
  { id: "python", icon: "bi-filetype-py", label: "Python API", stack: "FastAPI + PostgreSQL", color: "#f59e0b" },
  { id: "auth", icon: "bi-shield-lock-fill", label: "Auth System", stack: "JWT + bcrypt + MySQL", color: "#ec4899" },
  { id: "custom", icon: "bi-magic", label: "Custom Project", stack: "You define the stack", color: "#f97316" },
];

const FEATURES = ["Authentication (JWT)", "Database integration", "REST API", "File uploads", "Email notifications", "Payment integration", "Real-time (WebSocket)", "Docker setup", "CI/CD pipeline", "Testing suite"];

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) };
  return (
    <div className="pg-code-wrap">
      <div className="pg-code-bar">
        <span>{language || "code"}</span>
        <button onClick={copy}><i className={`bi bi-${copied ? "check-lg" : "clipboard"}`} /> {copied ? "Copied!" : "Copy"}</button>
      </div>
      <SyntaxHighlighter style={oneDark} language={language || "bash"} PreTag="div"
        customStyle={{ margin: 0, borderRadius: "0 0 8px 8px", fontSize: "12px", padding: "14px", background: "#0d1117" }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default function ProjectGeneratorPage() {
  const [template, setTemplate] = useState("fullstack");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFeat, setSelectedFeat] = useState(["Authentication (JWT)", "Database integration", "REST API"]);
  const [customStack, setCustomStack] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState(null);

  const tmpl = TEMPLATES.find(t => t.id === template);

  const toggleFeature = (f) => {
    setSelectedFeat(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const buildPrompt = () => {
    const stack = template === "custom" ? customStack : tmpl.stack;
    return `Generate a complete full-stack project structure and starter code for:

**Project Name:** ${projectName || "MyApp"}
**Description:** ${description || "A web application"}
**Tech Stack:** ${stack}
**Features:** ${selectedFeat.join(", ")}

Please provide:
1. 📁 Complete folder/file structure
2. 📦 package.json with all dependencies
3. 🚀 Main entry point code
4. 🗄️ Database schema/models
5. 🔐 Authentication setup (if applicable)
6. 🌐 Key API routes with code
7. 📋 Step-by-step setup instructions
8. ⚙️ Environment variables needed (.env.example)

Make it production-ready with best practices.`;
  };

  const handleGenerate = async () => {
    if (!description.trim()) return setError("Please describe your project.");
    setLoading(true); setResult(""); setError(""); setActiveSection(null);
    try {
      const res = await axios.post(API, { message: buildPrompt() });
      setResult(res.data.reply);
    } catch (e) {
      setError(e?.response?.data?.message || "AI service unavailable.");
    } finally { setLoading(false); }
  };

  return (
    <div className="pg-root">
      <div className="pg-glow-a" /><div className="pg-glow-b" />
      <div className="pg-inner">

        {/* Header */}
        <div className="pg-header">
          <div className="pg-header-left">
            <div className="pg-header-icon"><i className="bi bi-folder2-open" /></div>
            <div>
              <h1 className="pg-title">Project Generator</h1>
              <p className="pg-sub">Generate complete project boilerplate with AI</p>
            </div>
          </div>
          {result && (
            <button className="pg-copy-all" onClick={() => navigator.clipboard.writeText(result)}>
              <i className="bi bi-clipboard" /> Copy All
            </button>
          )}
        </div>

        <div className="pg-workspace">

          {/* Config panel */}
          <div className="pg-config">

            {/* Template selector */}
            <div className="pg-section">
              <p className="pg-section-label"><i className="bi bi-grid-3x3-gap-fill" /> Choose Template</p>
              <div className="pg-template-grid">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    className={`pg-template ${template === t.id ? "pg-template-active" : ""}`}
                    style={{ "--tc": t.color }}
                    onClick={() => setTemplate(t.id)}
                  >
                    <i className={`bi ${t.icon}`} />
                    <strong>{t.label}</strong>
                    <span>{t.stack}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Project name + description */}
            <div className="pg-section">
              <p className="pg-section-label"><i className="bi bi-pencil-fill" /> Project Details</p>
              <input
                className="pg-input"
                type="text"
                placeholder="Project name (e.g. ShopEasy)"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
              />
              <textarea
                className="pg-textarea"
                placeholder="Describe your project…&#10;&#10;e.g. An e-commerce platform where users can browse products, add to cart, checkout with Stripe, and track orders."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
              />
              {template === "custom" && (
                <input
                  className="pg-input"
                  type="text"
                  placeholder="Your tech stack (e.g. Vue 3 + Laravel + PostgreSQL)"
                  value={customStack}
                  onChange={e => setCustomStack(e.target.value)}
                />
              )}
            </div>

            {/* Feature toggles */}
            <div className="pg-section">
              <p className="pg-section-label"><i className="bi bi-toggle-on" /> Features</p>
              <div className="pg-features">
                {FEATURES.map(f => (
                  <button
                    key={f}
                    className={`pg-feature-btn ${selectedFeat.includes(f) ? "pg-feat-on" : ""}`}
                    onClick={() => toggleFeature(f)}
                  >
                    <i className={`bi bi-${selectedFeat.includes(f) ? "check-square-fill" : "square"}`} />
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="pg-error"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}

            {/* Generate button */}
            <button className="pg-generate-btn" onClick={handleGenerate} disabled={loading || !description.trim()}>
              {loading
                ? <><div className="pg-spinner" /><span>Generating project…</span></>
                : <><i className="bi bi-folder2-open" /><span>Generate Full Project</span></>}
            </button>
          </div>

          {/* Result panel */}
          <div className="pg-result-panel">
            <div className="pg-result-head">
              <div className="pg-panel-title">
                <i className="bi bi-stars" style={{ color: "#c084fc" }} />
                <span>Generated Project</span>
              </div>
              {result && <span className="pg-ready-badge"><i className="bi bi-check-circle-fill" /> Ready</span>}
            </div>

            <div className="pg-result-area">
              {!result && !loading && (
                <div className="pg-empty">
                  <div className="pg-empty-icon"><i className="bi bi-folder2-open" /></div>
                  <h3>Ready to Generate</h3>
                  <p>Configure your project on the left and click Generate to get a complete project structure with code.</p>
                  <div className="pg-empty-features">
                    {["File structure", "Database schema", "API routes", "Setup guide"].map(f => (
                      <span key={f}><i className="bi bi-check2-circle" /> {f}</span>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="pg-loading">
                  <div className="pg-loading-ring" />
                  <p>Building your project…</p>
                  <span>AI is generating structure, code, and documentation</span>
                  <div className="pg-loading-steps">
                    {["Analyzing requirements", "Designing architecture", "Writing code", "Creating documentation"].map((s, i) => (
                      <div key={i} className="pg-loading-step" style={{ animationDelay: `${i * 0.3}s` }}>
                        <div className="pg-step-dot" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result && !loading && (
                <div className="pg-result-content">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline
                          ? <CodeBlock language={match?.[1]}>{children}</CodeBlock>
                          : <code className="pg-inline-code" {...props}>{children}</code>;
                      },
                      p: ({ children }) => <p className="pg-p">{children}</p>,
                      h1: ({ children }) => <h1 className="pg-h1">{children}</h1>,
                      h2: ({ children }) => <h2 className="pg-h2">{children}</h2>,
                      h3: ({ children }) => <h3 className="pg-h3">{children}</h3>,
                      ul: ({ children }) => <ul className="pg-ul">{children}</ul>,
                      ol: ({ children }) => <ol className="pg-ol">{children}</ol>,
                      li: ({ children }) => <li className="pg-li">{children}</li>,
                      strong: ({ children }) => <strong className="pg-strong">{children}</strong>,
                      blockquote: ({ children }) => <blockquote className="pg-bq">{children}</blockquote>,
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
