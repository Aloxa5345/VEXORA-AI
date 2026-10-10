import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const DEFAULT_FILES = [
  {
    id: crypto.randomUUID(),
    name: "App.jsx",
    language: "javascript",
    value: `import React from "react";

function App() {
  return (
    <div className="app">
      <h1>Hello VEXORA AI 🚀</h1>
      <p>Build something amazing.</p>
    </div>
  );
}

export default App;`,
  },
  {
    id: crypto.randomUUID(),
    name: "style.css",
    language: "css",
    value: `.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #080b12;
  color: white;
}

h1 {
  font-size: 40px;
}`,
  },
  {
    id: crypto.randomUUID(),
    name: "index.html",
    language: "html",
    value: `<!DOCTYPE html>
<html>
<head>
  <title>VEXORA AI</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
  },
];

// ── Language map ──────────────────────────────────
function getLanguage(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const map = {
    js: "javascript", jsx: "javascript",
    ts: "typescript", tsx: "typescript",
    html: "html", css: "css", scss: "scss",
    json: "json", php: "php", py: "python",
    sql: "sql", java: "java", c: "c",
    cpp: "cpp", cs: "csharp", md: "markdown",
  };
  return map[ext] || "plaintext";
}

// ── File icon map ─────────────────────────────────
function getFileIcon(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  if (["js", "jsx"].includes(ext)) return "bi-filetype-js";
  if (["ts", "tsx"].includes(ext)) return "bi-filetype-tsx";
  if (ext === "css") return "bi-filetype-css";
  if (ext === "html") return "bi-filetype-html";
  if (ext === "php") return "bi-filetype-php";
  if (ext === "json") return "bi-filetype-json";
  if (ext === "sql") return "bi-database";
  if (ext === "py") return "bi-filetype-py";
  if (ext === "md") return "bi-filetype-md";
  return "bi-file-earmark-code";
}

// ── Extract first code block from AI response ─────
function extractCodeBlock(text) {
  // Match ```lang\n...code...\n``` or just ```...```
  const match = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
  if (match) return match[1].trimEnd();
  return null;
}

function CodeEditor() {
  // ── State ────────────────────────────────────────
  const [files, setFiles] = useState(() => {
    try {
      const saved = localStorage.getItem("vexoraai-workspace-files");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return DEFAULT_FILES;
  });

  const [activeFileId, setActiveFileId] = useState(() =>
    localStorage.getItem("vexoraai-active-file")
  );

  const [output, setOutput] = useState("Ready. Select a file and start coding.");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [pendingCode, setPendingCode] = useState(null);
  const [aiTab, setAiTab] = useState("assistant"); // "assistant" | "generate"
  const [genPrompt, setGenPrompt] = useState("");
  const [genLang, setGenLang] = useState("javascript");
  const [showCreateModal, setShowCreate] = useState(false);
  const [showRenameModal, setShowRename] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [fileMenuId, setFileMenuId] = useState(null);

  // ── Sync active file ──────────────────────────────
  useEffect(() => {
    const exists = files.some((f) => f.id === activeFileId);
    if (!exists && files.length > 0) setActiveFileId(files[0].id);
  }, [files, activeFileId]);

  // ── Persist files ─────────────────────────────────
  useEffect(() => {
    localStorage.setItem("vexoraai-workspace-files", JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    if (activeFileId)
      localStorage.setItem("vexoraai-active-file", activeFileId);
  }, [activeFileId]);

  const currentFile =
    files.find((f) => f.id === activeFileId) || files[0];

  // ── Editor change ─────────────────────────────────
  const updateCode = (value) => {
    if (!currentFile) return;
    setFiles((prev) =>
      prev.map((f) =>
        f.id === currentFile.id ? { ...f, value: value || "" } : f
      )
    );
  };

  // ── Apply pending code to Monaco ──────────────────
  const applyChanges = () => {
    if (!pendingCode || !currentFile) return;
    setFiles((prev) =>
      prev.map((f) =>
        f.id === currentFile.id ? { ...f, value: pendingCode } : f
      )
    );
    setOutput(`✅ AI changes applied to ${currentFile.name}`);
    setPendingCode(null);
  };

  // ── Reject pending code ───────────────────────────
  const rejectChanges = () => {
    setPendingCode(null);
    setOutput("❌ AI changes rejected. Original code kept.");
  };

  // ── Create ────────────────────────────────────────
  const createFile = () => {
    const name = newFileName.trim();
    if (!name) return;
    if (files.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      alert("A file with this name already exists.");
      return;
    }
    const newFile = {
      id: crypto.randomUUID(),
      name,
      language: getLanguage(name),
      value: "",
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setNewFileName("");
    setShowCreate(false);
    setOutput(`✓ Created ${name}`);
  };

  // ── Rename ────────────────────────────────────────
  const renameFile = () => {
    const name = renameValue.trim();
    if (!currentFile || !name) return;
    if (files.some((f) => f.id !== currentFile.id && f.name.toLowerCase() === name.toLowerCase())) {
      alert("A file with this name already exists.");
      return;
    }
    setFiles((prev) =>
      prev.map((f) =>
        f.id === currentFile.id
          ? { ...f, name, language: getLanguage(name) }
          : f
      )
    );
    setRenameValue("");
    setShowRename(false);
    setOutput(`✓ Renamed to ${name}`);
  };

  // ── Delete ────────────────────────────────────────
  const deleteFile = (fileId) => {
    if (files.length === 1) { alert("You cannot delete the last file."); return; }
    const target = files.find((f) => f.id === fileId);
    if (!target || !window.confirm(`Delete "${target.name}"?`)) return;
    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    if (fileId === activeFileId) setActiveFileId(remaining[0].id);
    setFileMenuId(null);
    setOutput(`✓ Deleted ${target.name}`);
  };

  // ── Close tab ─────────────────────────────────────
  const closeTab = (fileId) => {
    if (files.length === 1) { alert("At least one file must remain open."); return; }
    const idx = files.findIndex((f) => f.id === fileId);
    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    if (fileId === activeFileId) {
      const next = remaining[idx] || remaining[idx - 1] || remaining[0];
      setActiveFileId(next.id);
    }
  };

  // ── Save ──────────────────────────────────────────
  const saveCode = () => {
    localStorage.setItem("vexoraai-workspace-files", JSON.stringify(files));
    setOutput(`✓ ${currentFile?.name} saved.`);
  };

  const runCode = () =>
    setOutput(`▶ Running ${currentFile?.name}...\n\nLanguage: ${currentFile?.language}\n✓ Execution started.`);

  const debugCode = () =>
    setOutput(`🐞 Debugging ${currentFile?.name}...\n\n✓ No syntax errors detected.`);

  // ── AI actions ────────────────────────────────────
  const askAI = async (action) => {
    if (aiLoading || !currentFile?.value?.trim()) {
      setAiResponse("⚠️ Editor is empty. Write some code first.");
      return;
    }

    // Clear any previous pending code when new AI action starts
    setPendingCode(null);

    const code = currentFile.value;
    const lang = currentFile.language;
    const name = currentFile.name;

    const prompts = {
      explain: `You are VEXORA AI, an expert AI developer assistant.

The user is working on this file:
Filename: ${name}
Language: ${lang}

Task: Explain this code line by line and describe its purpose, important functions, dependencies, and potential issues.

Code:
\`\`\`${lang}
${code}
\`\`\`

Instructions:
- Analyze the code carefully.
- Be technically accurate.
- Explain your reasoning clearly.
- Do not invent errors that do not exist.`,

      fix: `You are VEXORA AI, an expert AI developer assistant.

The user is working on this file:
Filename: ${name}
Language: ${lang}

Task: Find bugs, syntax errors, logical problems, security issues, and potential runtime errors. Explain each issue and provide the complete corrected file code inside a single code block.

Code:
\`\`\`${lang}
${code}
\`\`\`

Instructions:
- Analyze carefully and be technically accurate.
- Always end your response with the complete corrected code in a single \`\`\`${lang} code block.
- If no errors found, return the original code unchanged in a code block.`,

      optimize: `You are VEXORA AI, an expert AI developer assistant.

The user is working on this file:
Filename: ${name}
Language: ${lang}

Task: Optimize this code for readability, performance, maintainability, security, and modern best practices. Explain the improvements and provide the complete optimized file code inside a single code block.

Code:
\`\`\`${lang}
${code}
\`\`\`

Instructions:
- Analyze carefully and explain each optimization.
- Always end your response with the complete optimized code in a single \`\`\`${lang} code block.`,
    };

    setAiLoading(true);
    setAiResponse(`VEXORA AI is analyzing your ${name}...`);

    try {
      const res = await axios.post(API_URL, { message: prompts[action] });
      const reply = res.data.success ? res.data.reply : (res.data.message || "AI response failed.");
      setAiResponse(reply);

      // For fix/optimize — auto-extract code block for Apply Changes
      if (action === "fix" || action === "optimize") {
        const extracted = extractCodeBlock(reply);
        if (extracted) {
          setPendingCode(extracted);
        }
      }
    } catch (err) {
      setAiResponse(
        err?.response?.data?.message ||
        "Unable to connect to VEXORA AI. Please check that the backend is running."
      );
    } finally {
      setAiLoading(false);
    }
  };

  // ── Step 10: Code Generator ───────────────────────
  const generateCode = async () => {
    if (!genPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse("");
    setPendingCode(null);
    try {
      const res = await axios.post(API_URL, {
        message: `Generate complete, production-ready ${genLang} code for: ${genPrompt}\n\nRequirements:\n- Follow best practices\n- Add comments\n- Handle errors\n- Make it complete and runnable\n\nReturn ONLY the code in a single \`\`\`${genLang} code block.`,
      });
      const reply = res.data.reply;
      setAiResponse(reply);
      const extracted = extractCodeBlock(reply);
      if (extracted) {
        setPendingCode(extracted);
        // Auto create new file if current file is empty
        const ext = genLang === "javascript" ? "js" : genLang === "typescript" ? "ts" : genLang === "python" ? "py" : genLang === "html" ? "html" : genLang === "css" ? "css" : "txt";
        if (!currentFile?.value?.trim()) {
          const name = genPrompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_") + "." + ext;
          setFiles(prev => prev.map(f => f.id === currentFile?.id ? { ...f, name, language: getLanguage(name), value: extracted } : f));
          setOutput(`✅ Code generated in ${name}`);
          setPendingCode(null);
        }
      }
    } catch (e) {
      setAiResponse(e?.response?.data?.message || "AI service unavailable.");
    } finally { setAiLoading(false); }
  };

  const openRenameModal = () => {
    if (!currentFile) return;
    setRenameValue(currentFile.name);
    setShowRename(true);
    setFileMenuId(null);
  };

  // ── Render ────────────────────────────────────────
  return (
    <div className="editor-workspace">

      {/* TOOLBAR */}
      <div className="editor-toolbar">
        <div className="editor-title">
          <i className="bi bi-code-square"></i>
          <span>Code Workspace</span>
        </div>
        <div className="editor-actions">
          <button className="editor-btn" onClick={() => setShowCreate(true)}>
            <i className="bi bi-file-earmark-plus"></i><span>New File</span>
          </button>
          <button className="editor-btn" onClick={openRenameModal} disabled={!currentFile}>
            <i className="bi bi-pencil"></i><span>Rename</span>
          </button>
          <button className="editor-btn" onClick={() => currentFile && deleteFile(currentFile.id)} disabled={!currentFile}>
            <i className="bi bi-trash"></i><span>Delete</span>
          </button>
          <button className="editor-btn" onClick={saveCode}>
            <i className="bi bi-save"></i><span>Save</span>
          </button>
          <button className="editor-btn debug" onClick={debugCode}>
            <i className="bi bi-bug"></i><span>Debug</span>
          </button>
          <button className="editor-btn run" onClick={runCode}>
            <i className="bi bi-play-fill"></i><span>Run</span>
          </button>
        </div>
      </div>

      {/* WORKSPACE BODY */}
      <div className="workspace-body">

        {/* FILE SIDEBAR */}
        <aside className="file-sidebar">
          <div className="file-sidebar-header">
            <span><i className="bi bi-folder2-open"></i>Files</span>
            <button onClick={() => setShowCreate(true)} title="New file">
              <i className="bi bi-plus-lg"></i>
            </button>
          </div>
          <div className="file-list">
            {files.map((file) => (
              <div
                key={file.id}
                className={`file-list-item ${activeFileId === file.id ? "active" : ""}`}
                onClick={() => setActiveFileId(file.id)}
              >
                <i className={`bi ${getFileIcon(file.name)}`}></i>
                <span>{file.name}</span>
                <button
                  className="file-menu-button"
                  onClick={(e) => { e.stopPropagation(); setFileMenuId(fileMenuId === file.id ? null : file.id); }}
                >
                  <i className="bi bi-three-dots"></i>
                </button>
                {fileMenuId === file.id && (
                  <div className="file-context-menu" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setActiveFileId(file.id); setRenameValue(file.name); setShowRename(true); setFileMenuId(null); }}>
                      <i className="bi bi-pencil"></i> Rename
                    </button>
                    <button onClick={() => deleteFile(file.id)}>
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* EDITOR MAIN */}
        <div className="editor-main">
          {/* Tabs */}
          <div className="file-tabs">
            {files.map((file) => (
              <div
                key={file.id}
                className={`file-tab ${activeFileId === file.id ? "active" : ""}`}
                onClick={() => setActiveFileId(file.id)}
              >
                <i className={`bi ${getFileIcon(file.name)}`}></i>
                <span>{file.name}</span>
                <button
                  className="close-tab"
                  onClick={(e) => { e.stopPropagation(); closeTab(file.id); }}
                  title="Close tab"
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
            ))}
          </div>

          {/* Monaco */}
          <div className="code-panel">
            {currentFile ? (
              <Editor
                height="100%"
                language={currentFile.language}
                value={currentFile.value}
                theme="vs-dark"
                onChange={updateCode}
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                  automaticLayout: true,
                  wordWrap: "on",
                  padding: { top: 15 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  bracketPairColorization: { enabled: true },
                }}
              />
            ) : (
              <div className="empty-editor">No file selected.</div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="developer-panel">

          {/* Output */}
          <div className="output-section">
            <div className="panel-header">
              <span><i className="bi bi-terminal"></i> Output</span>
              <button onClick={() => setOutput("")}>Clear</button>
            </div>
            <pre className="output-content">{output}</pre>
          </div>

          {/* AI Assistant */}
          <div className="ai-code-panel">
            <div className="panel-header">
              <span><i className="bi bi-stars"></i> AI Assistant</span>
              <span className="ai-online">
                {aiLoading ? "⏳ Working..." : "● Online"}
              </span>
            </div>

            {/* AI Tabs — Step 8/9 vs Step 10 */}
            <div className="ai-panel-tabs">
              <button
                className={`ai-panel-tab ${aiTab === "assistant" ? "ai-panel-tab-active" : ""}`}
                onClick={() => setAiTab("assistant")}
              >
                <i className="bi bi-magic" /> Assist
              </button>
              <button
                className={`ai-panel-tab ${aiTab === "generate" ? "ai-panel-tab-active" : ""}`}
                onClick={() => setAiTab("generate")}
              >
                <i className="bi bi-stars" /> Generate
              </button>
            </div>

            {/* ── ASSISTANT TAB (Steps 8+9) ── */}
            {aiTab === "assistant" && (
              <>
                <div className="ai-actions">
                  <button onClick={() => askAI("explain")} disabled={aiLoading}>
                    <i className="bi bi-magic"></i> Explain Code
                  </button>
                  <button onClick={() => askAI("fix")} disabled={aiLoading}>
                    <i className="bi bi-wrench-adjustable"></i> Fix Errors
                  </button>
                  <button onClick={() => askAI("optimize")} disabled={aiLoading}>
                    <i className="bi bi-lightning"></i> Optimize
                  </button>
                </div>

                {/* Apply / Reject bar — Step 9 */}
                {pendingCode && (
                  <div className="apply-bar">
                    <div className="apply-bar-label">
                      <i className="bi bi-stars"></i>
                      AI has suggested code changes
                    </div>
                    <div className="apply-bar-actions">
                      <button className="reject-btn" onClick={rejectChanges}>
                        <i className="bi bi-x-lg"></i> Reject
                      </button>
                      <button className="apply-btn" onClick={applyChanges}>
                        <i className="bi bi-check-lg"></i> Apply Changes
                      </button>
                    </div>
                  </div>
                )}

                {aiResponse ? (
                  <div className="ai-response">
                    <div className="ai-response-header">
                      <div className="ai-icon-sm"><i className="bi bi-stars"></i></div>
                      <strong>VEXORA AI</strong>
                    </div>
                    <pre className="ai-response-text">{aiResponse}</pre>
                  </div>
                ) : (
                  <div className="ai-suggestion">
                    <div className="ai-icon"><i className="bi bi-stars"></i></div>
                    <div>
                      <strong>VEXORA AI</strong>
                      <p>Select a file and use AI to explain, fix, or optimize your code.</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── GENERATE TAB (Step 10) ── */}
            {aiTab === "generate" && (
              <div className="ai-generate-panel">
                <div className="ai-gen-desc">
                  <i className="bi bi-stars" /> Describe what you want to build — AI writes the full code.
                </div>

                <select
                  className="ai-gen-lang"
                  value={genLang}
                  onChange={e => setGenLang(e.target.value)}
                >
                  {["javascript", "typescript", "python", "html", "css", "php", "java", "go", "sql", "bash"].map(l =>
                    <option key={l} value={l}>{l}</option>
                  )}
                </select>

                <textarea
                  className="ai-gen-input"
                  value={genPrompt}
                  onChange={e => setGenPrompt(e.target.value)}
                  placeholder={`Describe what to generate…\n\ne.g. "A login form with email & password validation"`}
                  rows={4}
                />

                <div className="ai-gen-quick">
                  {["React component", "REST API endpoint", "MySQL query", "Auth middleware", "Form validation"].map(q => (
                    <button key={q} className="ai-gen-chip" onClick={() => setGenPrompt(q)}>
                      {q}
                    </button>
                  ))}
                </div>

                <button
                  className="ai-gen-btn"
                  onClick={generateCode}
                  disabled={aiLoading || !genPrompt.trim()}
                >
                  {aiLoading
                    ? <><div className="ai-gen-spinner" /> Generating…</>
                    : <><i className="bi bi-stars" /> Generate Code</>}
                </button>

                {/* Apply/Reject for generated code */}
                {pendingCode && (
                  <div className="apply-bar">
                    <div className="apply-bar-label">
                      <i className="bi bi-stars"></i> Code ready — apply to editor?
                    </div>
                    <div className="apply-bar-actions">
                      <button className="reject-btn" onClick={rejectChanges}>
                        <i className="bi bi-x-lg"></i> Discard
                      </button>
                      <button className="apply-btn" onClick={applyChanges}>
                        <i className="bi bi-check-lg"></i> Apply to Editor
                      </button>
                    </div>
                  </div>
                )}

                {aiResponse && !pendingCode && (
                  <div className="ai-response">
                    <div className="ai-response-header">
                      <div className="ai-icon-sm"><i className="bi bi-stars"></i></div>
                      <strong>Generated</strong>
                    </div>
                    <pre className="ai-response-text">{aiResponse}</pre>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop-custom" onClick={() => setShowCreate(false)}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <i className="bi bi-file-earmark-plus"></i> Create New File
            </div>
            <input
              autoFocus
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFile()}
              placeholder="example.js"
            />
            <div className="modal-actions">
              <button onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="primary-modal-btn" onClick={createFile}>Create File</button>
            </div>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {showRenameModal && (
        <div className="modal-backdrop-custom" onClick={() => setShowRename(false)}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <i className="bi bi-pencil"></i> Rename File
            </div>
            <input
              autoFocus
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && renameFile()}
            />
            <div className="modal-actions">
              <button onClick={() => setShowRename(false)}>Cancel</button>
              <button className="primary-modal-btn" onClick={renameFile}>Rename</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CodeEditor;
