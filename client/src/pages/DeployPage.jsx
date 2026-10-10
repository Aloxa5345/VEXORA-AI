import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./IntegrationsPage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const PLATFORMS = [
  {
    id: "vercel", icon: "bi-triangle-fill", label: "Vercel",
    color: "#000000", bg: "#ffffff",
    desc: "Deploy React/Next.js apps instantly",
    steps: ["npm run build", "Install Vercel CLI: npm i -g vercel", "Run: vercel", "Follow prompts to deploy"],
    url: "https://vercel.com",
  },
  {
    id: "netlify", icon: "bi-cloud-fill", label: "Netlify",
    color: "#00c7b7", bg: "#003847",
    desc: "Continuous deployment from Git",
    steps: ["npm run build", "Install: npm i -g netlify-cli", "Run: netlify deploy --prod", "Set build dir to: dist"],
    url: "https://netlify.com",
  },
  {
    id: "railway", icon: "bi-train-front-fill", label: "Railway",
    color: "#0b0d0e", bg: "#7c3aed",
    desc: "Deploy Node.js backend easily",
    steps: ["Push code to GitHub", "Connect Railway to GitHub repo", "Add environment variables", "Deploy automatically"],
    url: "https://railway.app",
  },
  {
    id: "heroku", icon: "bi-cloud-upload-fill", label: "Heroku",
    color: "#430098", bg: "#9b59b6",
    desc: "Classic cloud platform for Node.js",
    steps: ["heroku login", "heroku create my-app", "git push heroku main", "heroku open"],
    url: "https://heroku.com",
  },
  {
    id: "aws", icon: "bi-cloud-fill", label: "AWS EC2",
    color: "#ff9900", bg: "#232f3e",
    desc: "Full control cloud deployment",
    steps: ["Launch EC2 instance", "Install Node.js on server", "Clone repo via Git", "Use PM2: pm2 start server.js"],
    url: "https://aws.amazon.com",
  },
  {
    id: "docker", icon: "bi-box-fill", label: "Docker",
    color: "#0db7ed", bg: "#384d54",
    desc: "Containerize your application",
    steps: ["Create Dockerfile", "docker build -t myapp .", "docker run -p 5000:5000 myapp", "Push to Docker Hub"],
    url: "https://docker.com",
  },
];

export default function DeployPage() {
  const { token } = useAuth();
  const [selected, setSelected] = useState(null);
  const [techStack, setTechStack] = useState("React + Node.js");
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const getDeployGuide = async () => {
    if (!selected) { setError("Select a deployment platform."); return; }
    setLoading(true); setError(""); setGuide("");
    try {
      const res = await axios.post(API,
        { message: `Create a complete step-by-step deployment guide for deploying a ${techStack} application to ${selected.label}. Include: prerequisites, configuration files needed (Dockerfile/Procfile/etc), environment variables setup, CI/CD configuration, common issues and solutions, and production best practices.` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGuide(res.data.reply);
    } catch (e) {
      setError(e?.response?.data?.message || "Guide generation failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="int-page">
      <div className="int-bg-glow" style={{ "--glow-color": "rgba(124,58,237,0.12)" }} />
      <div className="int-inner">

        <div className="int-header">
          <div className="int-header-icon" style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
            <i className="bi bi-rocket-takeoff-fill" />
          </div>
          <div>
            <h1>Deployment</h1>
            <p>Deploy your VEXORA AI project to production</p>
          </div>
        </div>

        {/* Platform cards */}
        <h3 className="int-section-title"><i className="bi bi-cloud-fill" /> Choose Platform</h3>
        <div className="int-deploy-grid">
          {PLATFORMS.map(p => (
            <div key={p.id} className={`int-deploy-card ${selected?.id === p.id ? "int-deploy-active" : ""}`}
              style={{ "--dc": p.color, "--dg": p.bg }}
              onClick={() => { setSelected(p); setError(""); setGuide(""); setExpanded(null); }}
            >
              <div className="int-deploy-card-head">
                <div className="int-deploy-icon">
                  <i className={`bi ${p.icon}`} />
                </div>
                <div>
                  <strong>{p.label}</strong>
                  <span>{p.desc}</span>
                </div>
                {selected?.id === p.id && <i className="bi bi-check-circle-fill int-deploy-check" />}
              </div>

              {/* Quick steps */}
              <button className="int-steps-toggle" onClick={(e) => { e.stopPropagation(); setExpanded(expanded === p.id ? null : p.id); }}>
                {expanded === p.id ? "Hide" : "Quick Steps"} <i className={`bi bi-chevron-${expanded === p.id ? "up" : "down"}`} />
              </button>

              {expanded === p.id && (
                <ol className="int-quick-steps">
                  {p.steps.map((s, i) => <li key={i}><code>{s}</code></li>)}
                </ol>
              )}
            </div>
          ))}
        </div>

        {/* AI Guide generator */}
        <div className="int-panel">
          <h3><i className="bi bi-stars" /> AI Deployment Guide</h3>
          <div className="int-input-row">
            <input
              type="text"
              value={techStack}
              onChange={e => setTechStack(e.target.value)}
              placeholder="e.g. React + Node.js + MySQL"
            />
            <button className="int-btn-primary" onClick={getDeployGuide} disabled={loading || !selected}>
              {loading
                ? <><span className="int-spinner" /> Generating...</>
                : <><i className="bi bi-stars" /> Generate Guide {selected ? `for ${selected.label}` : ""}</>}
            </button>
          </div>
          {!selected && <p className="int-hint"><i className="bi bi-arrow-up" /> Select a platform above first</p>}
          {error && <div className="int-error"><i className="bi bi-exclamation-triangle-fill" />{error}</div>}
        </div>

        {guide && (
          <div className="int-result-panel">
            <div className="int-result-header">
              <i className="bi bi-rocket-takeoff-fill" />
              <span>Deployment Guide — {selected?.label}</span>
              <button className="int-copy-btn" onClick={() => navigator.clipboard.writeText(guide)}>
                <i className="bi bi-clipboard" /> Copy
              </button>
            </div>
            <pre className="int-result-content">{guide}</pre>
          </div>
        )}

        {/* Useful links */}
        <h3 className="int-section-title"><i className="bi bi-link-45deg" /> Platform Links</h3>
        <div className="int-links-row">
          {PLATFORMS.map(p => (
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="int-platform-link">
              <i className={`bi ${p.icon}`} />{p.label} <i className="bi bi-box-arrow-up-right" />
            </a>
          ))}
        </div>

      </div>
    </div>
  );
}
