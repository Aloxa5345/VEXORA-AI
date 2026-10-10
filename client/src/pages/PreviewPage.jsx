import { useState, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import "./PreviewPage.css";

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VEXORA AI Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Inter", "Segoe UI", sans-serif;
      background: #0a0a0f;
      color: #f0f0ff;
      min-height: 100vh;
      padding: 32px;
    }
    .hero {
      text-align: center;
      padding: 60px 20px;
    }
    .hero h1 {
      font-size: 3rem;
      font-weight: 900;
      background: linear-gradient(90deg, #7c3aed, #ec4899, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 16px;
    }
    .hero p { color: #8888aa; font-size: 1.1rem; margin-bottom: 32px; }
    .btn {
      display: inline-block;
      padding: 12px 28px;
      border-radius: 12px;
      background: linear-gradient(135deg, #7c3aed, #ec4899);
      color: white;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: none;
      font-size: 1rem;
      transition: transform .2s, box-shadow .2s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,.4); }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 40px;
    }
    .card {
      background: #111118;
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 14px;
      padding: 20px;
      transition: border-color .2s, transform .2s;
    }
    .card:hover { border-color: #7c3aed; transform: translateY(-3px); }
    .card h3 { font-size: 1rem; margin-bottom: 8px; }
    .card p  { color: #8888aa; font-size: .875rem; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>VEXORA AI ✨</h1>
    <p>Edit the HTML, CSS and JS panels — see changes live</p>
    <button class="btn" onclick="alert('Hello from VEXORA AI!')">Click Me</button>
  </div>

  <div class="cards">
    <div class="card">
      <h3>🚀 Live Preview</h3>
      <p>Changes reflect instantly as you type</p>
    </div>
    <div class="card">
      <h3>🎨 Multi-Panel</h3>
      <p>Edit HTML, CSS and JS separately</p>
    </div>
    <div class="card">
      <h3>🔒 Sandboxed</h3>
      <p>Runs in an isolated iframe safely</p>
    </div>
  </div>

  <script>
    console.log("VEXORA AI Preview loaded!");
    document.querySelectorAll(".card").forEach((card, i) => {
      card.style.animationDelay = i * 0.1 + "s";
    });
  </script>
</body>
</html>`;

const DEFAULT_CSS = `/* Extra styles injected into preview */
body {
  background: linear-gradient(135deg, #0a0a0f 0%, #0d0520 100%);
}`;

const DEFAULT_JS = `// JavaScript injected into preview
console.log("JS panel loaded");

// Example: animate on load
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".card");
  cards.forEach((c, i) => {
    c.style.opacity = "0";
    c.style.transform = "translateY(20px)";
    c.style.transition = \`opacity .4s \${i*0.1}s, transform .4s \${i*0.1}s\`;
    requestAnimationFrame(() => {
      c.style.opacity = "1";
      c.style.transform = "translateY(0)";
    });
  });
});`;

const DEVICE_SIZES = [
  { id: "desktop",  icon: "bi-display",         label: "Desktop",  w: "100%",  h: "100%" },
  { id: "laptop",   icon: "bi-laptop",           label: "Laptop",   w: "1024px",h: "768px" },
  { id: "tablet",   icon: "bi-tablet-landscape", label: "Tablet",   w: "768px", h: "1024px" },
  { id: "mobile",   icon: "bi-phone",            label: "Mobile",   w: "390px", h: "844px" },
];

const buildSrcdoc = (html, css, js) => {
  // Inject CSS and JS into HTML
  const withCss = html.replace("</head>", `<style>\n${css}\n</style>\n</head>`);
  const withJs  = withCss.replace("</body>", `<script>\n${js}\n<\/script>\n</body>`);
  return withJs;
};

export default function PreviewPage() {
  const [html,       setHtml]       = useState(DEFAULT_HTML);
  const [css,        setCss]        = useState(DEFAULT_CSS);
  const [js,         setJs]         = useState(DEFAULT_JS);
  const [activeEdit, setActiveEdit] = useState("html");
  const [device,     setDevice]     = useState("desktop");
  const [autoRefresh,setAutoRefresh]= useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  const [consoleLog, setConsoleLog] = useState([]);
  const [showConsole,setShowConsole]= useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const frameRef = useRef(null);

  const refresh = () => setPreviewKey(k => k + 1);

  const srcdoc = buildSrcdoc(html, css, js);

  const devObj = DEVICE_SIZES.find(d => d.id === device);

  const EDITORS = [
    { id: "html", lang: "html", label: "HTML", icon: "bi-filetype-html", color: "#e34c26", value: html, onChange: setHtml },
    { id: "css",  lang: "css",  label: "CSS",  icon: "bi-filetype-css",  color: "#264de4", value: css,  onChange: setCss  },
    { id: "js",   lang: "javascript", label: "JS", icon: "bi-filetype-js", color: "#f7df1e", value: js, onChange: setJs },
  ];

  const activeEditor = EDITORS.find(e => e.id === activeEdit);

  const handleChange = (val) => {
    activeEditor?.onChange(val || "");
  };

  return (
    <div className={`pv-root ${fullscreen ? "pv-fullscreen" : ""}`}>
      <div className="pv-glow-a" /><div className="pv-glow-b" />

      {/* Header */}
      <div className="pv-header">
        <div className="pv-header-left">
          <div className="pv-header-icon"><i className="bi bi-eye-fill" /></div>
          <div>
            <h1 className="pv-title">Live Preview</h1>
            <p className="pv-sub">HTML + CSS + JS sandbox with instant rendering</p>
          </div>
        </div>

        <div className="pv-header-right">
          {/* Device selector */}
          <div className="pv-devices">
            {DEVICE_SIZES.map(d => (
              <button
                key={d.id}
                className={`pv-dev-btn ${device === d.id ? "pv-dev-active" : ""}`}
                onClick={() => setDevice(d.id)}
                title={d.label}
              >
                <i className={`bi ${d.icon}`} />
              </button>
            ))}
          </div>

          <button
            className={`pv-toggle-btn ${autoRefresh ? "pv-toggle-on" : ""}`}
            onClick={() => setAutoRefresh(a => !a)}
            title="Auto-refresh"
          >
            <i className="bi bi-arrow-repeat" />
            <span>Auto</span>
          </button>

          {!autoRefresh && (
            <button className="pv-refresh-btn" onClick={refresh} title="Refresh preview">
              <i className="bi bi-arrow-clockwise" /> Refresh
            </button>
          )}

          <button
            className="pv-console-btn"
            onClick={() => setShowConsole(s => !s)}
            title="Toggle console"
          >
            <i className="bi bi-terminal" />
          </button>

          <button
            className="pv-fullscreen-btn"
            onClick={() => setFullscreen(f => !f)}
            title="Fullscreen"
          >
            <i className={`bi bi-${fullscreen ? "fullscreen-exit" : "fullscreen"}`} />
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="pv-layout">

        {/* Left: Editor */}
        <div className="pv-editor-panel">
          {/* Editor tabs */}
          <div className="pv-editor-tabs">
            {EDITORS.map(e => (
              <button
                key={e.id}
                className={`pv-editor-tab ${activeEdit === e.id ? "pv-editor-tab-active" : ""}`}
                style={{ "--ec": e.color }}
                onClick={() => setActiveEdit(e.id)}
              >
                <i className={`bi ${e.icon}`} />
                <span>{e.label}</span>
              </button>
            ))}
          </div>

          <div className="pv-monaco-wrap">
            <Editor
              key={activeEdit}
              height="100%"
              language={activeEditor?.lang}
              value={activeEditor?.value}
              theme="vs-dark"
              onChange={handleChange}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                automaticLayout: true,
                wordWrap: "on",
                padding: { top: 12 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
        </div>

        {/* Right: Preview */}
        <div className="pv-preview-side">
          <div className="pv-preview-head">
            <div className="pv-preview-title">
              <span className="pv-dot pv-dot-r"/><span className="pv-dot pv-dot-y"/><span className="pv-dot pv-dot-g"/>
              <span className="pv-preview-url">preview://localhost</span>
            </div>
            <div className="pv-preview-info">
              <i className={`bi ${devObj?.icon}`} />
              <span>{devObj?.label}</span>
              {devObj?.w !== "100%" && <span className="pv-preview-size">{devObj?.w} × {devObj?.h}</span>}
            </div>
          </div>

          <div className="pv-frame-wrap">
            <div
              className="pv-frame-container"
              style={{
                width:  devObj?.w,
                height: devObj?.w === "100%" ? "100%" : devObj?.h,
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            >
              <iframe
                ref={frameRef}
                key={autoRefresh ? srcdoc : previewKey}
                className="pv-frame"
                srcDoc={srcdoc}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                title="Live Preview"
              />
            </div>
          </div>

          {/* Console */}
          {showConsole && (
            <div className="pv-console">
              <div className="pv-console-head">
                <i className="bi bi-terminal-fill" /> Console
                <button onClick={() => setConsoleLog([])}><i className="bi bi-x-lg" /></button>
              </div>
              <div className="pv-console-body">
                {consoleLog.length === 0 ? (
                  <span className="pv-console-empty">Console output will appear here</span>
                ) : (
                  consoleLog.map((l, i) => <div key={i} className="pv-console-line">{l}</div>)
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
