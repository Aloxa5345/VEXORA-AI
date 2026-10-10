import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./IntegrationsPage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

export default function GitHubPage() {
  const { token } = useAuth();
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const analyzeRepo = async () => {
    const url = repoUrl.trim();
    if (!url) { setError("Please enter a GitHub repository URL."); return; }
    if (!url.includes("github.com")) { setError("Enter a valid GitHub URL."); return; }

    setLoading(true); setError(""); setResult(null);
    try {
      const res = await axios.post(`${API}/chat`,
        { message: `Analyze this GitHub repository and provide: 1) Overview 2) Tech stack 3) Key files 4) Suggestions for improvement.\n\nRepo URL: ${url}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data.reply);
    } catch (e) {
      setError(e?.response?.data?.message || "Analysis failed.");
    } finally { setLoading(false); }
  };

  const FEATURES = [
    { icon: "bi-search", title: "Repo Analysis", desc: "AI analyzes your GitHub repo structure and code" },
    { icon: "bi-bug", title: "Bug Detection", desc: "Identify potential bugs and security issues" },
    { icon: "bi-stars", title: "AI Suggestions", desc: "Get improvement suggestions powered by AI" },
    { icon: "bi-code", title: "Code Review", desc: "Comprehensive code quality review" },
  ];

  return (
    <div className="int-page">
      <div className="int-bg-glow" />
      <div className="int-inner">

        <div className="int-header">
          <div className="int-header-icon" style={{ background: "linear-gradient(135deg,#24292e,#586069)" }}>
            <i className="bi bi-github" />
          </div>
          <div>
            <h1>GitHub Integration</h1>
            <p>Analyze any public GitHub repository with AI</p>
          </div>
        </div>

        <div className="int-features">
          {FEATURES.map(f => (
            <div className="int-feature-card" key={f.title}>
              <i className={`bi ${f.icon}`} />
              <strong>{f.title}</strong>
              <span>{f.desc}</span>
            </div>
          ))}
        </div>

        <div className="int-panel">
          <h3><i className="bi bi-link-45deg" /> Repository URL</h3>
          <div className="int-input-row">
            <input
              type="url"
              value={repoUrl}
              onChange={e => { setRepoUrl(e.target.value); setError(""); }}
              placeholder="https://github.com/username/repository"
              disabled={loading}
            />
            <button className="int-btn-primary" onClick={analyzeRepo} disabled={loading || !repoUrl.trim()}>
              {loading ? <><span className="int-spinner" /> Analyzing...</> : <><i className="bi bi-stars" /> Analyze with AI</>}
            </button>
          </div>
          {error && <div className="int-error"><i className="bi bi-exclamation-triangle-fill" />{error}</div>}
        </div>

        {result && (
          <div className="int-result-panel">
            <div className="int-result-header">
              <i className="bi bi-github" />
              <span>AI Repository Analysis</span>
              <button className="int-copy-btn" onClick={() => navigator.clipboard.writeText(result)}>
                <i className="bi bi-clipboard" /> Copy
              </button>
            </div>
            <pre className="int-result-content">{result}</pre>
          </div>
        )}

      </div>
    </div>
  );
}
