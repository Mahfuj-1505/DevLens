import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { analyzeCommits, analyzeGithubRepo } from "./api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./ResultPage.css";

const hasOption = (selectedOptions, name) =>
  selectedOptions?.some((o) => o.toLowerCase().includes(name.toLowerCase()));

function ChatPanel({ width, onResize, commitData, locData }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I can answer questions about this repository's metrics. Ask me anything!" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (e) => {
      const newWidth = window.innerWidth - e.clientX;
      onResize(Math.max(240, Math.min(newWidth, window.innerWidth * 0.6)));
    };

    const onMouseUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [onResize]);

  const sendMessage = async () => {
    if (!input.trim() || typing) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setTyping(true);

    const context = [
      commitData && `Repository has ${commitData.totalCommits} commits. Total additions: ${commitData.summary.totalAdditions}, deletions: ${commitData.summary.totalDeletions}.`,
      locData && `Lines of code: ${locData.summary.totalLoc}. Total files: ${locData.summary.totalFiles}. Languages: ${locData.summary.languages?.join(", ")}.`,
    ].filter(Boolean).join(" ");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a code quality assistant. Repository data: ${context}. Answer concisely.`,
          messages: [{ role: "user", content: userMsg }],
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response.";
      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Something went wrong. Please try again." }]);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <div className="resize-handle" onMouseDown={onMouseDown} />
      <div className="chat-panel" style={{ width }}>
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-avatar">✦</div>
            <div className="chat-header-info">
              <div className="chat-header-title">AI Assistant</div>
              <div className="chat-header-sub">analyzing repo...</div>
            </div>
          </div>
          <div className="chat-header-status">
            <div className="status-dot" />
            <span className="status-label">online</span>
          </div>
        </div>
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>
              <div className="msg-avatar">{msg.role === "ai" ? "✦" : "U"}</div>
              <div className="chat-bubble">
                {msg.text}
                {i === 0 && msg.role === "ai" && (
                  <div className="chat-chips">
                    <span className="chat-chip" onClick={() => setInput("Give me a summary of this repo")}>📊 Summary</span>
                    <span className="chat-chip" onClick={() => setInput("How is the code quality?")}>🔍 Code quality</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="chat-msg ai">
              <div className="msg-avatar">✦</div>
              <div className="chat-typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-row">
          <textarea
            className="chat-input"
            rows={2}
            placeholder="Ask about this repo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="chat-send" onClick={sendMessage} disabled={typing || !input.trim()}>↑</button>
        </div>
      </div>
    </>
  );
}

function ComingSoon({ title }) {
  return (
    <div className="metric-card" style={{ opacity: 0.6 }}>
      <h2>{title}</h2>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: 80, border: "1px dashed rgba(255,255,255,0.2)",
        borderRadius: 10, color: "#e9d5ff", fontFamily: "var(--mono)",
        fontSize: "0.78rem", gap: 8
      }}>
        🚧 Coming Soon
      </div>
    </div>
  );
}

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { repoLink, selectedOptions, isDefault, spl } = location.state || {};

  const [commitData, setCommitData] = useState(null);
  const [locData, setLocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatWidth, setChatWidth] = useState(340);

  const showCommits = isDefault || hasOption(selectedOptions, "Number of commits") || hasOption(selectedOptions, "Changes per commit");
  const showLOC = isDefault || hasOption(selectedOptions, "LOC");

  useEffect(() => {
    if (!repoLink) { navigate("/home"); return; }
    const requests = [];
    if (showCommits) requests.push(analyzeCommits(repoLink).then(setCommitData));
    if (showLOC) requests.push(analyzeGithubRepo(repoLink).then(setLocData));
    if (!requests.length) { setLoading(false); return; }
    Promise.all(requests).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [repoLink]);

  if (loading) return (
    <div className="result-loading">
      <div className="spinner" />
      Analyzing repository...
    </div>
  );

  if (error) return <div className="result-error">Error: {error}</div>;

  const repoName = repoLink?.replace("https://github.com/", "") || "Repository";

  return (
    <div className="result-shell">
      <header className="result-header">
        <h1>Repo Metrics — <span>{repoName}</span></h1>
        <button className="header-back" onClick={() => navigate("/home")}>← Back</button>
      </header>

      <div className="result-body">
        <div className="metrics-panel">

          {showLOC && locData && (
            <div className="metric-card">
              <h2>Lines of Code</h2>
              <div className="stat-grid">
                <div className="stat-item">
                  <div className="stat-label">Total LOC</div>
                  <div className="stat-value accent">{locData.summary.totalLoc?.toLocaleString()}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Files</div>
                  <div className="stat-value">{locData.summary.totalFiles}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Functions</div>
                  <div className="stat-value">{locData.summary.totalFunctions}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Comments</div>
                  <div className="stat-value">{locData.summary.totalComments}</div>
                </div>
              </div>
              {locData.summary.languages?.length > 0 && (
                <p style={{ marginTop: 12, fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--mono)" }}>
                  Languages: {locData.summary.languages.join(", ")}
                </p>
              )}
            </div>
          )}

          {showCommits && commitData && (
            <div className="metric-card">
              <h2>Commit Summary</h2>
              <div className="stat-grid">
                <div className="stat-item">
                  <div className="stat-label">Total Commits</div>
                  <div className="stat-value accent">{commitData.totalCommits}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Total Additions</div>
                  <div className="stat-value green">+{commitData.summary.totalAdditions?.toLocaleString()}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Total Deletions</div>
                  <div className="stat-value red">-{commitData.summary.totalDeletions?.toLocaleString()}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Avg +/Commit</div>
                  <div className="stat-value green">+{commitData.summary.averageAdditionsPerCommit}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Avg -/Commit</div>
                  <div className="stat-value red">-{commitData.summary.averageDeletionsPerCommit}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Avg Files/Commit</div>
                  <div className="stat-value">{commitData.summary.averageFilesChangedPerCommit}</div>
                </div>
              </div>
            </div>
          )}

          {showCommits && commitData && (
            <div className="metric-card">
              <h2>Additions vs Deletions</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ width: 220, height: 220, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Additions", value: commitData.summary.totalAdditions },
                          { name: "Deletions", value: commitData.summary.totalDeletions },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        <Cell fill="#4ade80" />
                        <Cell fill="#f87171" />
                      </Pie>
                      <Tooltip
                        formatter={(value) => value.toLocaleString()}
                        contentStyle={{
                          background: "rgba(20,10,40,0.95)",
                          border: "1px solid rgba(168,85,247,0.3)",
                          borderRadius: 8,
                          color: "#e9d5ff",
                          fontFamily: "monospace",
                          fontSize: 12,
                        }}
                      />
                      <Legend
                        formatter={(value) => (
                          <span style={{ color: "#e9d5ff", fontSize: 12 }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "rgba(233,213,255,0.7)", textTransform: "uppercase", marginBottom: 4 }}>Total Additions</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#4ade80", fontFamily: "var(--mono)" }}>+{commitData.summary.totalAdditions?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "rgba(233,213,255,0.7)", textTransform: "uppercase", marginBottom: 4 }}>Total Deletions</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#f87171", fontFamily: "var(--mono)" }}>-{commitData.summary.totalDeletions?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "rgba(233,213,255,0.7)", textTransform: "uppercase", marginBottom: 4 }}>Net Change</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#e9d5ff", fontFamily: "var(--mono)" }}>
                      {(commitData.summary.totalAdditions - commitData.summary.totalDeletions).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          {isDefault && (
            <>
              <ComingSoon title="Code Complexity — Number of Functions" />
              <ComingSoon title="Code Complexity — Time Complexity" />
              <ComingSoon title="Code Complexity — Code Duplication" />
              <ComingSoon title="Commit — Meaningfulness" />
              <ComingSoon title="Commit — Activity Graph" />
              <ComingSoon title="AI Generated Code %" />
              <ComingSoon title="Naming Conventions" />
            </>
          )}

          {!showLOC && !showCommits && !isDefault && (
            <div className="empty-state">No supported options selected.</div>
          )}

        </div>

        <ChatPanel
          width={chatWidth}
          onResize={setChatWidth}
          commitData={commitData}
          locData={locData}
        />
      </div>
    </div>
  );
}