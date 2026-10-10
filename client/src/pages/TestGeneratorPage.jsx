import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./TestGeneratorPage.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/chat';

const FRAMEWORKS = [
  { id: "jest", icon: "bi-check2-circle", label: "Jest", lang: "javascript", color: "#c026d3", desc: "JavaScript / TypeScript" },
  { id: "pytest", icon: "bi-check-circle-fill", label: "Pytest", lang: "python", color: "#06b6d4", desc: "Python unit testing" },
  { id: "junit", icon: "bi-check-all", label: "JUnit 5", lang: "java", color: "#f97316", desc: "Java testing" },
  { id: "vitest", icon: "bi-lightning-fill", label: "Vitest", lang: "javascript", color: "#7c3aed", desc: "Vite-native testing" },
  { id: "phpunit", icon: "bi-shield-check", label: "PHPUnit", lang: "php", color: "#10b981", desc: "PHP unit testing" },
  { id: "go", icon: "bi-gear-fill", label: "Go Test", lang: "go", color: "#38bdf8", desc: "Go built-in testing" },
];

const TEST_TYPES = [
  { id: "unit", label: "Unit Tests", icon: "bi-box", desc: "Test individual functions" },
  { id: "integration", label: "Integration Tests", icon: "bi-diagram-3", desc: "Test component interactions" },
  { id: "edge", label: "Edge Cases", icon: "bi-exclamation-triangle", desc: "Boundary & error scenarios" },
  { id: "full", label: "Full Coverage", icon: "bi-check2-all", desc: "Unit + integration + edge" },
];

const QUICK_EXAMPLES = [
  { label: "Array utils", lang: "javascript", code: `function sum(arr) {\n  return arr.reduce((a, b) => a + b, 0);\n}\n\nfunction average(arr) {\n  if (arr.length === 0) throw new Error('Empty array');\n  return sum(arr) / arr.length;\n}\n\nmodule.exports = { sum, average };` },
  { label: "Auth service", lang: "javascript", code: `async function login(email, password) {\n  const user = await db.findOne({ email });\n  if (!user) throw new Error('User not found');\n  const match = await bcrypt.compare(password, user.password);\n  if (!match) throw new Error('Invalid password');\n  return jwt.sign({ id: user.id }, process.env.JWT_SECRET);\n}` },
  { label: "Python calc", lang: "python", code: `def divide(a, b):\n    if b == 0:\n        raise ValueError("Cannot divide by zero")\n    return a / b\n\ndef factorial(n):\n    if n < 0:\n        raise ValueError("Negative numbers not allowed")\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)` },
];

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="tg-code-wrap">
      <div className="tg-code-bar">
        <span>{language || "javascript"}</span>
        <button onClick={copy}><i className={`bi bi-${copied ? "check-lg" : "clipboard"}`} /> {copied ? "Copied!" : "Copy"}</button>
      </div>
      <SyntaxHighlighter style={oneDark} language={language || "javascript"} PreTag="div"
        customStyle={{ margin: 0, borderRadius: "0 0 8px 8px", fontSize: "12.5px", padding: "14px", background: "#0d1117" }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

const buildPrompt = (code, framework, testType, lang) => {
  const fw = FRAMEWORKS.find(f => f.id === framework);
  const typeDesc = {
    unit: "unit tests for each function/method",
    integration: "integration tests that test how components work together",
    edge: "edge case tests including null values, empty arrays, invalid inputs, boundary values, and error scenarios",
    full: "comprehensive test suite covering unit tests, integration tests, and edge cases",
  }[testType];

  return `Generate ${typeDesc} using ${fw?.label || framework} for the following ${lang} code:

\`\`\`${lang}
${code}
\`\`\`

Requirements:
- Use ${fw?.label} testing framework and its conventions
- Include test descriptions that clearly explain what is being tested
- Cover happy path, error cases, and edge cases
- Add setup/teardown if needed (beforeEach, afterEach)
- Mock external dependencies where appropriate
- Aim for high code coverage
- Add comments explaining complex test scenarios`;
};

export default function TestGeneratorPage() {
  const [framework, setFramework] = useState("jest");
  const [testType, setTestType] = useState("full");
  const [code, setCode] = useState("");
  const [lang, setLang] = useState("javascript");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [coverage, setCoverage] = useState(null);

  const fw = FRAMEWORKS.find(f => f.id === framework);

  const handleGenerate = async () => {
    if (!code.trim()) return setError("Please paste your code first.");
    setLoading(true); setResult(""); setError(""); setCoverage(null);
    try {
      const res = await axios.post(API, { message: buildPrompt(code, framework, testType, lang) });
      setResult(res.data.reply);
      // Estimate coverage from result
      const testCount = (res.data.reply.match(/it\(|test\(|def test_|@Test/g) || []).length;
      setCoverage(testCount);
    } catch (e) {
      setError(e?.response?.data?.message || "AI service unavailable. Try again.");
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tg-root">
      <div className="tg-glow-a" /><div className="tg-glow-b" />
      <div className="tg-inner">

        {/* Header */}
        <div className="tg-header">
          <div className="tg-header-left">
            <div className="tg-header-icon"><i className="bi bi-check2-circle" /></div>
            <div>
              <h1 className="tg-title">Test Generation</h1>
              <p className="tg-sub">Auto-generate unit, integration & edge case tests with AI</p>
            </div>
          </div>
          {result && (
            <div className="tg-header-right">
              {coverage !== null && (
                <div className="tg-coverage-badge">
                  <i className="bi bi-check2-all" />
                  <span>{coverage} test{coverage !== 1 ? "s" : ""} generated</span>
                </div>
              )}
              <button className={`tg-copy-all ${copied ? "tg-copied" : ""}`} onClick={handleCopy}>
                <i className={`bi bi-${copied ? "check-lg" : "clipboard"}`} />
                {copied ? "Copied!" : "Copy All"}
              </button>
            </div>
          )}
        </div>

        {/* Framework selector */}
        <div className="tg-section">
          <p className="tg-section-label"><i className="bi bi-grid-fill" /> Choose Framework</p>
          <div className="tg-framework-grid">
            {FRAMEWORKS.map(f => (
              <button
                key={f.id}
                className={`tg-fw-btn ${framework === f.id ? "tg-fw-active" : ""}`}
                style={{ "--fc": f.color }}
                onClick={() => { setFramework(f.id); setLang(f.lang); setResult(""); }}
              >
                <div className="tg-fw-icon"><i className={`bi ${f.icon}`} /></div>
                <div>
                  <strong>{f.label}</strong>
                  <span>{f.desc}</span>
                </div>
                {framework === f.id && <i className="bi bi-check-circle-fill tg-fw-check" />}
              </button>
            ))}
          </div>
        </div>

        {/* Test type */}
        <div className="tg-section">
          <p className="tg-section-label"><i className="bi bi-list-check" /> Test Type</p>
          <div className="tg-type-row">
            {TEST_TYPES.map(t => (
              <button
                key={t.id}
                className={`tg-type-btn ${testType === t.id ? "tg-type-active" : ""}`}
                onClick={() => setTestType(t.id)}
              >
                <i className={`bi ${t.icon}`} />
                <div>
                  <strong>{t.label}</strong>
                  <span>{t.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main workspace */}
        <div className="tg-workspace">

          {/* Left — code input */}
          <div className="tg-left">
            <div className="tg-panel">
              <div className="tg-panel-head">
                <div className="tg-panel-title">
                  <i className="bi bi-code-slash" style={{ color: fw?.color }} />
                  <span>Your Code</span>
                  <span className="tg-lang-badge" style={{ "--fc": fw?.color }}>{fw?.lang}</span>
                </div>
                <button className="tg-clear-btn" onClick={() => { setCode(""); setResult(""); }} title="Clear">
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <textarea
                className="tg-code-input"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={`// Paste the ${fw?.lang} code you want tests for…\n// Functions, classes, or modules all work!`}
                spellCheck={false}
              />

              {error && (
                <div className="tg-error">
                  <i className="bi bi-exclamation-triangle-fill" /> {error}
                </div>
              )}

              <button
                className="tg-generate-btn"
                style={{ "--fc": fw?.color }}
                onClick={handleGenerate}
                disabled={loading || !code.trim()}
              >
                {loading
                  ? <><div className="tg-spinner" /><span>Generating tests…</span></>
                  : <><i className="bi bi-check2-circle" /><span>Generate {fw?.label} Tests</span></>}
              </button>
            </div>

            {/* Quick examples */}
            <div className="tg-examples">
              <p className="tg-section-label" style={{ marginBottom: 10 }}>
                <i className="bi bi-lightning-fill" style={{ color: "#f59e0b" }} /> Quick Examples
              </p>
              {QUICK_EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  className="tg-example-btn"
                  onClick={() => { setCode(ex.code); setLang(ex.lang); setResult(""); setError(""); }}
                >
                  <i className="bi bi-code-slash" />
                  <span>{ex.label}</span>
                  <span className="tg-ex-lang">{ex.lang}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right — result */}
          <div className="tg-panel tg-result-panel">
            <div className="tg-panel-head">
              <div className="tg-panel-title">
                <i className="bi bi-stars" style={{ color: "#c084fc" }} />
                <span>Generated Tests</span>
                {result && <span className="tg-fw-badge" style={{ "--fc": fw?.color }}>{fw?.label}</span>}
              </div>
            </div>

            <div className="tg-result-area">
              {!result && !loading && (
                <div className="tg-empty">
                  <div className="tg-empty-icon" style={{ "--fc": fw?.color }}>
                    <i className="bi bi-check2-circle" />
                  </div>
                  <h3>Ready to Generate</h3>
                  <p>Paste your code, choose {fw?.label} framework and test type, then click Generate.</p>
                  <div className="tg-features">
                    {["Unit tests", "Mocking", "Edge cases", "Error handling", "Async tests", "Assertions"].map(f => (
                      <span key={f}><i className="bi bi-check2" /> {f}</span>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="tg-loading">
                  <div className="tg-loading-ring" style={{ "--fc": fw?.color }} />
                  <p>Writing {fw?.label} tests…</p>
                  <div className="tg-loading-steps">
                    {["Analyzing code structure", "Identifying test cases", "Writing assertions", "Adding edge cases"].map((s, i) => (
                      <div key={i} className="tg-step" style={{ animationDelay: `${i * 0.25}s` }}>
                        <div className="tg-step-dot" style={{ "--fc": fw?.color }} />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result && !loading && (
                <div className="tg-result-content">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline
                          ? <CodeBlock language={match?.[1]}>{children}</CodeBlock>
                          : <code className="tg-inline-code" {...props}>{children}</code>;
                      },
                      p: ({ children }) => <p className="tg-p">{children}</p>,
                      h1: ({ children }) => <h1 className="tg-h1">{children}</h1>,
                      h2: ({ children }) => <h2 className="tg-h2">{children}</h2>,
                      h3: ({ children }) => <h3 className="tg-h3">{children}</h3>,
                      ul: ({ children }) => <ul className="tg-ul">{children}</ul>,
                      ol: ({ children }) => <ol className="tg-ol">{children}</ol>,
                      li: ({ children }) => <li className="tg-li">{children}</li>,
                      strong: ({ children }) => <strong className="tg-strong">{children}</strong>,
                      blockquote: ({ children }) => <blockquote className="tg-bq">{children}</blockquote>,
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
