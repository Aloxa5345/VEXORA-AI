import { useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./IntegrationsPage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const SUPPORTED = [
  { ext: ".js .jsx", icon: "bi-filetype-js", label: "JavaScript / React" },
  { ext: ".ts .tsx", icon: "bi-filetype-tsx", label: "TypeScript" },
  { ext: ".py", icon: "bi-filetype-py", label: "Python" },
  { ext: ".html", icon: "bi-filetype-html", label: "HTML" },
  { ext: ".css .scss", icon: "bi-filetype-css", label: "CSS / SCSS" },
  { ext: ".php", icon: "bi-filetype-php", label: "PHP" },
  { ext: ".json", icon: "bi-filetype-json", label: "JSON" },
  { ext: ".sql", icon: "bi-database", label: "SQL" },
  { ext: ".md", icon: "bi-filetype-md", label: "Markdown" },
  { ext: ".txt", icon: "bi-file-text", label: "Plain Text" },
];

export default function ImportPage() {
  const { token } = useAuth();
  const fileRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState("");
  const [action, setAction] = useState("analyze");

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected); setError(""); setAnalysis("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(dropped); setError(""); setAnalysis("");
  };

  const readFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ name: file.name, content: e.target.result });
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const processFiles = async () => {
    if (!files.length) { setError("Please select files to import."); return; }
    setLoading(true); setError(""); setAnalysis("");

    try {
      const contents = await Promise.all(files.map(readFile));
      const combined = contents.map(f =>
        `\n\n### File: ${f.name}\n\`\`\`\n${f.content.slice(0, 2000)}${f.content.length > 2000 ? "\n...(truncated)" : ""}\n\`\`\``
      ).join("");

      const prompts = {
        analyze: `Analyze these imported files and provide: 1) Overview 2) Code quality 3) Issues found 4) Improvements:${combined}`,
        review: `Do a thorough code review of these files. List bugs, security issues, and best practice violations:${combined}`,
        document: `Generate complete documentation for these files including functions, parameters, and usage examples:${combined}`,
        refactor: `Suggest refactoring improvements for these files with specific examples:${combined}`,
      };

      const res = await axios.post(API,
        { message: prompts[action] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalysis(res.data.reply);
    } catch (e) {
      setError(e?.response?.data?.message || "Processing failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="int-page">
      <div className="int-bg-glow" style={{ "--glow-color": "rgba(16,185,129,0.1)" }} />
      <div className="int-inner">

        <div className="int-header">
          <div className="int-header-icon" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
            <i className="bi bi-upload" />
          </div>
          <div>
            <h1>Import Project</h1>
            <p>Upload files for AI analysis, review, and documentation</p>
          </div>
        </div>

        {/* Supported formats */}
        <div className="int-formats">
          {SUPPORTED.map(s => (
            <div className="int-format-badge" key={s.ext}>
              <i className={`bi ${s.icon}`} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div
          className={`int-dropzone ${files.length ? "int-dropzone-active" : ""}`}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" multiple accept=".js,.jsx,.ts,.tsx,.py,.html,.css,.scss,.php,.json,.sql,.md,.txt" onChange={handleFiles} style={{ display: "none" }} />
          {files.length === 0 ? (
            <>
              <i className="bi bi-cloud-upload int-drop-icon" />
              <strong>Drop files here or click to browse</strong>
              <span>Supports JS, TS, Python, HTML, CSS, PHP, SQL, JSON, MD</span>
            </>
          ) : (
            <>
              <i className="bi bi-check-circle-fill int-drop-icon" style={{ color: "var(--green)" }} />
              <strong>{files.length} file{files.length > 1 ? "s" : ""} selected</strong>
              <div className="int-file-list">
                {files.map(f => <span key={f.name} className="int-file-chip"><i className="bi bi-file-code" />{f.name}</span>)}
              </div>
            </>
          )}
        </div>

        {/* Action selector */}
        <div className="int-panel">
          <h3><i className="bi bi-stars" /> AI Action</h3>
          <div className="int-action-tabs">
            {[
              { id: "analyze", label: "Analyze", icon: "bi-search" },
              { id: "review", label: "Code Review", icon: "bi-eye" },
              { id: "document", label: "Document", icon: "bi-file-text" },
              { id: "refactor", label: "Refactor", icon: "bi-arrow-repeat" },
            ].map(a => (
              <button key={a.id} className={`int-action-tab ${action === a.id ? "active" : ""}`} onClick={() => setAction(a.id)}>
                <i className={`bi ${a.icon}`} />{a.label}
              </button>
            ))}
          </div>

          <button className="int-btn-primary int-btn-full" onClick={processFiles} disabled={loading || !files.length}>
            {loading
              ? <><span className="int-spinner" /> Processing {files.length} file{files.length > 1 ? "s" : ""}...</>
              : <><i className="bi bi-stars" /> Run AI {action.charAt(0).toUpperCase() + action.slice(1)}</>}
          </button>
          {error && <div className="int-error"><i className="bi bi-exclamation-triangle-fill" />{error}</div>}
        </div>

        {analysis && (
          <div className="int-result-panel">
            <div className="int-result-header">
              <i className="bi bi-stars" />
              <span>AI Analysis Result</span>
              <button className="int-copy-btn" onClick={() => navigator.clipboard.writeText(analysis)}>
                <i className="bi bi-clipboard" /> Copy
              </button>
            </div>
            <pre className="int-result-content">{analysis}</pre>
          </div>
        )}

      </div>
    </div>
  );
}
