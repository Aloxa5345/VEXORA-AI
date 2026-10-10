import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./SQLAssistantPage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const SQL_TOOLS = [
  { id: "generate", icon: "bi-magic", label: "Generate Query", color: "#7c3aed", placeholder: "Describe what you need:\n\nGet all users who registered in the last 30 days with their total order count" },
  { id: "explain", icon: "bi-lightbulb-fill", label: "Explain Query", color: "#06b6d4", placeholder: "Paste a SQL query to explain:\n\nSELECT u.name, COUNT(o.id) as orders\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id\nGROUP BY u.id" },
  { id: "optimize", icon: "bi-lightning-fill", label: "Optimize Query", color: "#f59e0b", placeholder: "Paste a slow query to optimize:\n\nSELECT * FROM orders WHERE YEAR(created_at) = 2024" },
  { id: "schema", icon: "bi-diagram-3-fill", label: "Design Schema", color: "#10b981", placeholder: "Describe your database needs:\n\nE-commerce app with users, products, orders, categories, and reviews" },
  { id: "migrate", icon: "bi-arrow-up-circle-fill", label: "Write Migration", color: "#ec4899", placeholder: "Describe the change:\n\nAdd a 'status' column (active/inactive) to the users table with default 'active'" },
];

const DB_TYPES = ["MySQL", "PostgreSQL", "SQLite", "SQL Server", "Oracle", "MongoDB"];

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) };
  return (
    <div className="sql-code-wrap">
      <div className="sql-code-bar">
        <span>{language || "sql"}</span>
        <button onClick={copy}><i className={`bi bi-${copied ? "check-lg" : "clipboard"}`} /> {copied ? "Copied!" : "Copy"}</button>
      </div>
      <SyntaxHighlighter style={oneDark} language={language || "sql"} PreTag="div"
        customStyle={{ margin: 0, borderRadius: "0 0 8px 8px", fontSize: "12.5px", padding: "14px", background: "#0d1117" }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

const buildPrompt = (toolId, input, dbType) => {
  const db = dbType;
  switch (toolId) {
    case "generate": return `Generate a ${db} SQL query for: ${input}\n\nProvide the query with explanation and any indexes that would help performance.`;
    case "explain": return `Explain this ${db} SQL query step by step:\n\n\`\`\`sql\n${input}\n\`\`\`\n\nInclude: what each clause does, performance implications, and suggestions.`;
    case "optimize": return `Optimize this ${db} SQL query for better performance:\n\n\`\`\`sql\n${input}\n\`\`\`\n\nExplain the bottlenecks and provide the optimized version with indexing suggestions.`;
    case "schema": return `Design a complete ${db} database schema for: ${input}\n\nInclude: CREATE TABLE statements, indexes, foreign keys, and explain design decisions.`;
    case "migrate": return `Write a ${db} database migration for: ${input}\n\nInclude: ALTER TABLE statements, rollback query, and any data migration needed.`;
    default: return input;
  }
};

export default function SQLAssistantPage() {
  const [activeTool, setActiveTool] = useState("generate");
  const [input, setInput] = useState("");
  const [dbType, setDbType] = useState("MySQL");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tool = SQL_TOOLS.find(t => t.id === activeTool);

  const handleRun = async () => {
    if (!input.trim()) return setError("Please describe your query or paste SQL.");
    setLoading(true); setResult(""); setError("");
    try {
      const res = await axios.post(API, { message: buildPrompt(activeTool, input, dbType) });
      setResult(res.data.reply);
    } catch (e) {
      setError(e?.response?.data?.message || "AI service unavailable.");
    } finally { setLoading(false); }
  };

  const QUICK_PROMPTS = [
    "Get top 10 users by order value",
    "Find duplicate email addresses",
    "Users who haven't logged in 30 days",
    "Monthly revenue last 12 months",
    "Products with low stock",
    "Most popular categories",
  ];

  return (
    <div className="sql-root">
      <div className="sql-glow-a" /><div className="sql-glow-b" />
      <div className="sql-inner">

        {/* Header */}
        <div className="sql-header">
          <div className="sql-header-left">
            <div className="sql-header-icon"><i className="bi bi-database-fill" /></div>
            <div>
              <h1 className="sql-title">SQL Assistant</h1>
              <p className="sql-sub">Generate, explain, optimize and design SQL with AI</p>
            </div>
          </div>
          <select className="sql-db-select" value={dbType} onChange={e => setDbType(e.target.value)}>
            {DB_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Tool pills */}
        <div className="sql-tools">
          {SQL_TOOLS.map(t => (
            <button
              key={t.id}
              className={`sql-tool-btn ${activeTool === t.id ? "sql-tool-active" : ""}`}
              style={{ "--tc": t.color }}
              onClick={() => { setActiveTool(t.id); setResult(""); setError("") }}
            >
              <i className={`bi ${t.icon}`} /> {t.label}
            </button>
          ))}
        </div>

        <div className="sql-workspace">

          {/* Left */}
          <div className="sql-left">
            <div className="sql-panel">
              <div className="sql-panel-head">
                <div className="sql-panel-title">
                  <i className={`bi ${tool.icon}`} style={{ color: tool.color }} />
                  <span>{tool.label}</span>
                  <span className="sql-db-badge">{dbType}</span>
                </div>
                <button className="sql-clear" onClick={() => setInput("")}><i className="bi bi-x-lg" /></button>
              </div>
              <textarea
                className="sql-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={tool.placeholder}
                spellCheck={false}
              />
              {error && <div className="sql-error"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}
              <button
                className="sql-run-btn"
                style={{ "--tc": tool.color }}
                onClick={handleRun}
                disabled={loading || !input.trim()}
              >
                {loading
                  ? <><div className="sql-spinner" /><span>Processing…</span></>
                  : <><i className={`bi ${tool.icon}`} /><span>{tool.label}</span></>}
              </button>
            </div>

            {/* Quick prompts */}
            <div className="sql-quick-panel">
              <p className="sql-quick-label"><i className="bi bi-lightning-fill" /> Quick Prompts</p>
              <div className="sql-quick-grid">
                {QUICK_PROMPTS.map((p, i) => (
                  <button key={i} className="sql-quick-btn" onClick={() => setInput(p)}>
                    <i className="bi bi-arrow-right-short" /> {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right — result */}
          <div className="sql-panel sql-result-panel">
            <div className="sql-panel-head">
              <div className="sql-panel-title">
                <i className="bi bi-stars" style={{ color: "#c084fc" }} />
                <span>AI Result</span>
              </div>
              {result && (
                <button className="sql-copy-btn" onClick={() => navigator.clipboard.writeText(result)}>
                  <i className="bi bi-clipboard" /> Copy
                </button>
              )}
            </div>
            <div className="sql-result-area">
              {!result && !loading && (
                <div className="sql-empty">
                  <i className="bi bi-database" />
                  <p>Select a tool and describe your SQL needs</p>
                  <span>AI will generate production-ready SQL</span>
                </div>
              )}
              {loading && (
                <div className="sql-empty">
                  <div className="sql-loading-ring" />
                  <p>Generating SQL…</p>
                </div>
              )}
              {result && !loading && (
                <div className="sql-result-content">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline
                          ? <CodeBlock language={match?.[1]}>{children}</CodeBlock>
                          : <code className="sql-inline-code" {...props}>{children}</code>;
                      },
                      p: ({ c }) => <p className="sql-p">{c}</p>,
                      h1: ({ children }) => <h1 className="sql-h1">{children}</h1>,
                      h2: ({ children }) => <h2 className="sql-h2">{children}</h2>,
                      h3: ({ children }) => <h3 className="sql-h3">{children}</h3>,
                      ul: ({ children }) => <ul className="sql-ul">{children}</ul>,
                      li: ({ children }) => <li className="sql-li">{children}</li>,
                      strong: ({ children }) => <strong className="sql-strong">{children}</strong>,
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
