import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./IntegrationsPage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const TEMPLATES = [
  {
    id: "react-app",
    icon: "bi-filetype-jsx",
    label: "React App",
    desc: "Complete React app with components",
    color: "#61dafb",
    prompt: "Generate a complete React application with: App.jsx, components/Header.jsx, components/Footer.jsx, App.css. Include proper structure and placeholder content.",
  },
  {
    id: "node-api",
    icon: "bi-server",
    label: "Node.js API",
    desc: "Express REST API with routes",
    color: "#68a063",
    prompt: "Generate a complete Node.js Express REST API with: server.js, routes/api.js, controllers/dataController.js, .env.example, package.json. Include CRUD operations.",
  },
  {
    id: "html-page",
    icon: "bi-filetype-html",
    label: "HTML Page",
    desc: "Responsive HTML + CSS page",
    color: "#e34c26",
    prompt: "Generate a complete responsive HTML page with Bootstrap 5, including: header, hero section, features section, footer. Include all HTML and CSS.",
  },
  {
    id: "python-script",
    icon: "bi-filetype-py",
    label: "Python Script",
    desc: "Python utility with CLI",
    color: "#3572A5",
    prompt: "Generate a complete Python utility script with: main.py, utils.py, requirements.txt. Include CLI arguments, error handling, and docstrings.",
  },
  {
    id: "sql-schema",
    icon: "bi-database-fill",
    label: "SQL Schema",
    desc: "MySQL database schema",
    color: "#00758f",
    prompt: "Generate a complete MySQL database schema with: users, products, orders, categories tables. Include indexes, foreign keys, and sample INSERT statements.",
  },
  {
    id: "readme",
    icon: "bi-file-earmark-text",
    label: "README",
    desc: "Professional project README",
    color: "#7c3aed",
    prompt: "Generate a professional GitHub README.md with: badges, description, features, installation, usage, API docs, contributing guide, license sections.",
  },
];

export default function ExportPage() {
  const { token } = useAuth();
  const [selected, setSelected] = useState(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("export");
  const [format, setFormat] = useState("txt");

  const generate = async () => {
    const prompt = custom.trim() || selected?.prompt;
    if (!prompt) { setError("Select a template or enter custom description."); return; }
    setLoading(true); setError(""); setOutput("");
    try {
      const res = await axios.post(API,
        { message: `Generate complete, production-ready code files. Provide all code with proper file headers.\n\n${prompt}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOutput(res.data.reply);
      if (selected) setFileName(selected.id);
    } catch (e) {
      setError(e?.response?.data?.message || "Generation failed.");
    } finally { setLoading(false); }
  };

  const downloadFile = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyAll = () => navigator.clipboard.writeText(output);

  return (
    <div className="int-page">
      <div className="int-bg-glow" style={{ "--glow-color": "rgba(245,158,11,0.1)" }} />
      <div className="int-inner">

        <div className="int-header">
          <div className="int-header-icon" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
            <i className="bi bi-download" />
          </div>
          <div>
            <h1>Export / Download</h1>
            <p>Generate and download complete project files with AI</p>
          </div>
        </div>

        {/* Templates */}
        <h3 className="int-section-title"><i className="bi bi-grid-3x3-gap-fill" /> Project Templates</h3>
        <div className="int-template-grid">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              className={`int-template-card ${selected?.id === t.id ? "int-template-active" : ""}`}
              onClick={() => { setSelected(t); setCustom(""); setError(""); }}
              style={{ "--tc": t.color }}
            >
              <i className={`bi ${t.icon}`} />
              <strong>{t.label}</strong>
              <span>{t.desc}</span>
              {selected?.id === t.id && <i className="bi bi-check-circle-fill int-template-check" />}
            </button>
          ))}
        </div>

        {/* Custom prompt */}
        <div className="int-panel">
          <h3><i className="bi bi-pencil-square" /> Custom Description</h3>
          <textarea
            className="int-textarea"
            value={custom}
            onChange={e => { setCustom(e.target.value); setSelected(null); setError(""); }}
            placeholder="Describe what you want to generate... e.g. 'A full-stack todo app with React frontend and Node.js backend'"
            rows={4}
          />
        </div>

        {/* Settings + Generate */}
        <div className="int-panel">
          <h3><i className="bi bi-gear-fill" /> Export Settings</h3>
          <div className="int-export-settings">
            <div className="int-setting-group">
              <label>File Name</label>
              <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="my-project" />
            </div>
            <div className="int-setting-group">
              <label>Format</label>
              <select value={format} onChange={e => setFormat(e.target.value)}>
                <option value="txt">Plain Text (.txt)</option>
                <option value="md">Markdown (.md)</option>
                <option value="jsx">JSX (.jsx)</option>
                <option value="js">JavaScript (.js)</option>
                <option value="py">Python (.py)</option>
                <option value="html">HTML (.html)</option>
                <option value="css">CSS (.css)</option>
                <option value="sql">SQL (.sql)</option>
              </select>
            </div>
          </div>

          <div className="int-btn-row">
            <button className="int-btn-primary int-btn-flex" onClick={generate} disabled={loading || (!selected && !custom.trim())}>
              {loading ? <><span className="int-spinner" /> Generating...</> : <><i className="bi bi-stars" /> Generate with AI</>}
            </button>
            {output && (
              <>
                <button className="int-btn-secondary" onClick={copyAll}>
                  <i className="bi bi-clipboard" /> Copy All
                </button>
                <button className="int-btn-download" onClick={downloadFile}>
                  <i className="bi bi-download" /> Download {fileName}.{format}
                </button>
              </>
            )}
          </div>
          {error && <div className="int-error"><i className="bi bi-exclamation-triangle-fill" />{error}</div>}
        </div>

        {output && (
          <div className="int-result-panel">
            <div className="int-result-header">
              <i className="bi bi-file-earmark-code" />
              <span>Generated Output</span>
              <span className="int-result-badge">{output.length.toLocaleString()} chars</span>
            </div>
            <pre className="int-result-content">{output}</pre>
          </div>
        )}

      </div>
    </div>
  );
}
