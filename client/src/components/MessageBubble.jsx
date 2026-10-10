import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./MessageBubble.css";

// ── Code block with copy button ───────────────────
function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mb-code-wrap">
      <div className="mb-code-header">
        <span className="mb-code-lang">{language || "code"}</span>
        <button className="mb-copy-btn" onClick={handleCopy} title="Copy code">
          {copied
            ? <><i className="bi bi-check-lg" /> Copied!</>
            : <><i className="bi bi-clipboard" /> Copy</>}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || "text"}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: "0 0 8px 8px",
          fontSize: "13px",
          lineHeight: "1.65",
          padding: "16px",
          background: "#0d1117",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// ── Main MessageBubble component ──────────────────
export default function MessageBubble({ message, role, userName, initials, time }) {
  const [copied, setCopied] = useState(false);

  const handleCopyMsg = () => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (role === "user") {
    return (
      <div className="mb-row mb-user">
        <div className="mb-avatar mb-avatar-user">
          <span>{initials}</span>
        </div>
        <div className="mb-body mb-body-user">
          <div className="mb-name-row">
            <span className="mb-name">{userName || "You"}</span>
            <span className="mb-time">{time}</span>
          </div>
          <div className="mb-bubble mb-bubble-user">
            <p className="mb-plain">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  // AI message with markdown
  return (
    <div className="mb-row mb-ai">
      <div className="mb-avatar mb-avatar-ai">
        <img src="/logo.png" alt="VEXORA AI" className="mb-logo-img" />
      </div>
      <div className="mb-body mb-body-ai">
        <div className="mb-name-row">
          <span className="mb-name mb-name-ai">VEXORA AI</span>
          <span className="mb-ai-badge">AI</span>
          <span className="mb-time">{time}</span>
          <span className="mb-tokens">{message.split(" ").length} words</span>
          <button
            className={`mb-copy-msg-btn ${copied ? "mb-copied" : ""}`}
            onClick={handleCopyMsg}
            title="Copy response"
          >
            {copied
              ? <><i className="bi bi-check-lg" /> Copied</>
              : <><i className="bi bi-clipboard" /> Copy</>}
          </button>
        </div>

        <div className="mb-bubble mb-bubble-ai">
          <ReactMarkdown
            components={{
              // Code blocks
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline ? (
                  <CodeBlock language={match?.[1]}>{children}</CodeBlock>
                ) : (
                  <code className="mb-inline-code" {...props}>{children}</code>
                );
              },
              // Headings
              h1: ({ children }) => <h1 className="mb-h1">{children}</h1>,
              h2: ({ children }) => <h2 className="mb-h2">{children}</h2>,
              h3: ({ children }) => <h3 className="mb-h3">{children}</h3>,
              // Paragraphs
              p: ({ children }) => <p className="mb-p">{children}</p>,
              // Lists
              ul: ({ children }) => <ul className="mb-ul">{children}</ul>,
              ol: ({ children }) => <ol className="mb-ol">{children}</ol>,
              li: ({ children }) => <li className="mb-li">{children}</li>,
              // Bold / italic
              strong: ({ children }) => <strong className="mb-strong">{children}</strong>,
              em: ({ children }) => <em className="mb-em">{children}</em>,
              // Blockquote
              blockquote: ({ children }) => <blockquote className="mb-blockquote">{children}</blockquote>,
              // Horizontal rule
              hr: () => <hr className="mb-hr" />,
              // Links
              a: ({ href, children }) => (
                <a className="mb-link" href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              // Tables
              table: ({ children }) => (
                <div className="mb-table-wrap">
                  <table className="mb-table">{children}</table>
                </div>
              ),
              th: ({ children }) => <th className="mb-th">{children}</th>,
              td: ({ children }) => <td className="mb-td">{children}</td>,
            }}
          >
            {message}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
