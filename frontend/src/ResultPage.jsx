import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { analyzeCommits, analyzeGithubRepo, analyzeHeatmap, analyzeOwnership, analyzeIssues, analyzeChurn } from "./api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./ResultPage.css";

const hasOption = (selectedOptions, name) =>
  selectedOptions?.some((o) => o.toLowerCase().includes(name.toLowerCase()));

const OWNERSHIP_COLORS = ["#a855f7", "#f87171", "#4ade80", "#facc15", "#60a5fa", "#fb923c", "#34d399", "#e879f9"];

function HeatmapGrid({ files }) {
  const [hovered, setHovered] = React.useState(null);
  const maxChanges = files[0]?.changes || 1;
  const SIZE = 620;
  const CENTER = SIZE / 2;
  const OUTER_R = CENTER - 10;

  const bubbles = files.slice(0, 20).map((f, i) => {
    const color = f.color;
    const minR = 22;
    const maxR = 58;
    const r = Math.round(minR + ((f.changes / maxChanges) * (maxR - minR)));
    const golden = Math.PI * (3 - Math.sqrt(5));
    const angle = i * golden;
    const radiusFraction = Math.sqrt((i + 0.5) / files.length);
    const spread = radiusFraction * (OUTER_R - maxR - 12);
    const x = CENTER + spread * Math.cos(angle);
    const y = CENTER + spread * Math.sin(angle);
    return { ...f, color, r, x, y, i };
  });

  const sorted = [...bubbles].sort((a, b) => a.heat - b.heat);

  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", padding: "8px 0", marginBottom: 40 }}>
      <svg width={SIZE} height={SIZE} style={{ overflow: "visible" }}>
        <circle cx={CENTER} cy={CENTER} r={OUTER_R} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
        <circle cx={CENTER} cy={CENTER} r={OUTER_R * 0.66} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeDasharray="4 6" />
        <circle cx={CENTER} cy={CENTER} r={OUTER_R * 0.33} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeDasharray="4 6" />
        {sorted.filter(b => hovered?.i !== b.i).map((b) => (
          <g key={b.i} transform={`translate(${b.x}, ${b.y})`} onMouseEnter={() => setHovered(b)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
            <circle r={b.r} fill={b.color} opacity={0.78} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
            {b.r >= 28 && (
              <text textAnchor="middle" dy="3" fontSize={7} fill="rgba(0,0,0,0.85)" fontFamily="monospace" fontWeight="700" style={{ pointerEvents: "none" }}>
                {(() => { const fname = b.file.split("/").pop(); return fname.length > 9 ? fname.slice(0, 7) + "…" : fname; })()}
              </text>
            )}
          </g>
        ))}
        {sorted.filter(b => hovered?.i === b.i).map((b) => (
          <g key={b.i} transform={`translate(${b.x}, ${b.y})`} onMouseEnter={() => setHovered(b)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
            <circle r={b.r * 1.6 + 20} fill={b.color} opacity={0.08} />
            <circle r={b.r * 1.6 + 10} fill={b.color} opacity={0.14} />
            <circle r={b.r * 1.6 + 4} fill={b.color} opacity={0.22} />
            <circle r={b.r * 1.6} fill={b.color} opacity={0.97} stroke="white" strokeWidth={2} strokeOpacity={0.6} style={{ filter: `drop-shadow(0 0 8px ${b.color})` }} />
            <text textAnchor="middle" dy="-5" fontSize={10} fill="rgba(0,0,0,0.9)" fontFamily="monospace" fontWeight="700" style={{ pointerEvents: "none" }}>
              {(() => { const fname = b.file.split("/").pop(); return fname.length > 9 ? fname.slice(0, 7) + "…" : fname; })()}
            </text>
            <text textAnchor="middle" dy="9" fontSize={10} fill="rgba(0,0,0,0.8)" fontFamily="monospace" fontWeight="700" style={{ pointerEvents: "none" }}>
              {b.changes}x
            </text>
          </g>
        ))}
      </svg>
      {hovered && (
        <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", padding: "6px 14px", background: "rgba(10,0,30,0.92)", border: `1px solid ${hovered.color}`, borderRadius: 8, fontFamily: "monospace", fontSize: "0.72rem", color: "#e9d5ff", whiteSpace: "nowrap", pointerEvents: "none", zIndex: 10 }}>
          <span style={{ color: hovered.color, fontWeight: 700 }}>{hovered.file}</span>
          {" "}— <span style={{ color: "#facc15", fontWeight: 700 }}>{hovered.changes}</span> changes
        </div>
      )}
    </div>
  );
}

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
          <textarea className="chat-input" rows={2} placeholder="Ask about this repo..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} />
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80, border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 10, color: "#e9d5ff", fontFamily: "var(--mono)", fontSize: "0.78rem", gap: 8 }}>
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
  const [heatmapData, setHeatmapData] = useState(null);
  const [ownershipData, setOwnershipData] = useState(null);
  const [issuesData, setIssuesData] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatWidth, setChatWidth] = useState(340);

  const showCommits = isDefault || hasOption(selectedOptions, "Number of commits") || hasOption(selectedOptions, "Changes per commit");
  const showLOC = isDefault || hasOption(selectedOptions, "LOC");
  const showHeatmap = isDefault || hasOption(selectedOptions, "File change heatmap");
  const showOwnership = isDefault || hasOption(selectedOptions, "Code Ownership") || hasOption(selectedOptions, "Code ownership");
  const showIssues = isDefault || hasOption(selectedOptions, "Issue Tracking") || hasOption(selectedOptions, "Issue tracking");
  const showChurn = isDefault || hasOption(selectedOptions, "Churn rate") || hasOption(selectedOptions, "Churn Rate");

  useEffect(() => {
    if (!repoLink) { navigate("/home"); return; }
    const requests = [];
    if (showCommits) requests.push(analyzeCommits(repoLink).then(setCommitData));
    if (showLOC) requests.push(analyzeGithubRepo(repoLink).then(setLocData));
    if (showHeatmap) requests.push(analyzeHeatmap(repoLink).then(setHeatmapData));
    if (showOwnership) requests.push(analyzeOwnership(repoLink).then(setOwnershipData));
    if (showIssues) requests.push(analyzeIssues(repoLink).then(setIssuesData));
    if (showChurn) requests.push(analyzeChurn(repoLink).then(setChurnData));
    if (!requests.length) { setLoading(false); return; }
    Promise.all(requests).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [repoLink]);

  const [progress, setProgress] = React.useState(0);
  const [msgIndex, setMsgIndex] = React.useState(0);
  const cancelledRef = React.useRef(false);

  const loadingMessages = [
    "Cloning repository...",
    "Analyzing commit history...",
    "Counting lines of code...",
    "Measuring code churn...",
    "Detecting file changes...",
    "Checking issue tracker...",
    "Calculating ownership...",
    "Almost there...",
  ];

  React.useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8, 92));
      setMsgIndex((i) => (i + 1) % loadingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [loading]);

  const handleCancel = () => {
    cancelledRef.current = true;
    navigate("/home");
  };

  if (loading) return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)",
      gap: 24, fontFamily: "var(--mono, monospace)",
    }}>
      <div style={{ fontSize: "0.72rem", color: "rgba(233,213,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        DevLens Analysis
      </div>
      <div style={{ fontSize: "1rem", color: "#e9d5ff", fontWeight: 600, minHeight: 24, transition: "all 0.3s ease" }}>
        {loadingMessages[msgIndex]}
      </div>
      <div style={{ width: 320, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: "linear-gradient(90deg, #7c3aed, #a855f7, #7c3aed)",
          backgroundSize: "200% 100%",
          width: `${progress}%`,
          transition: "width 1.5s ease",
          animation: "shimmer 2s linear infinite",
        }} />
      </div>
      <div style={{ fontSize: "0.68rem", color: "rgba(233,213,255,0.4)" }}>
        {Math.round(progress)}% complete
      </div>
      <button
        onClick={handleCancel}
        style={{
          marginTop: 8, padding: "8px 24px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 8, color: "rgba(233,213,255,0.6)",
          cursor: "pointer", fontSize: "0.78rem",
          fontFamily: "var(--mono, monospace)",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.target.style.borderColor = "#f87171"; e.target.style.color = "#f87171"; }}
        onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.color = "rgba(233,213,255,0.6)"; }}
      >
        Cancel
      </button>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  );

  if (error) return <div className="result-error">Error: {error}</div>;

  const repoName = repoLink?.replace("https://github.com/", "") || "Repository";

  const th = { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "rgba(233,213,255,0.5)", fontSize: "0.65rem", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.08em" };
  const td = { padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.72rem", fontFamily: "var(--mono)", color: "#e9d5ff" };

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
                <div className="stat-item"><div className="stat-label">Total LOC</div><div className="stat-value accent">{locData.summary.totalLoc?.toLocaleString()}</div></div>
                <div className="stat-item"><div className="stat-label">Files</div><div className="stat-value">{locData.summary.totalFiles}</div></div>
                <div className="stat-item"><div className="stat-label">Functions</div><div className="stat-value">{locData.summary.totalFunctions}</div></div>
                <div className="stat-item"><div className="stat-label">Comments</div><div className="stat-value">{locData.summary.totalComments}</div></div>
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
                <div className="stat-item"><div className="stat-label">Total Commits</div><div className="stat-value accent">{commitData.totalCommits}</div></div>
                <div className="stat-item"><div className="stat-label">Total Additions</div><div className="stat-value green">+{commitData.summary.totalAdditions?.toLocaleString()}</div></div>
                <div className="stat-item"><div className="stat-label">Total Deletions</div><div className="stat-value red">-{commitData.summary.totalDeletions?.toLocaleString()}</div></div>
                <div className="stat-item"><div className="stat-label">Avg +/Commit</div><div className="stat-value green">+{commitData.summary.averageAdditionsPerCommit}</div></div>
                <div className="stat-item"><div className="stat-label">Avg -/Commit</div><div className="stat-value red">-{commitData.summary.averageDeletionsPerCommit}</div></div>
                <div className="stat-item"><div className="stat-label">Avg Files/Commit</div><div className="stat-value">{commitData.summary.averageFilesChangedPerCommit}</div></div>
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
                      <Pie data={[{ name: "Additions", value: commitData.summary.totalAdditions }, { name: "Deletions", value: commitData.summary.totalDeletions }]} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                        <Cell fill="#4ade80" /><Cell fill="#f87171" />
                      </Pie>
                      <Tooltip formatter={(value) => value.toLocaleString()} contentStyle={{ background: "rgba(20,10,40,0.95)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#e9d5ff", fontFamily: "monospace", fontSize: 12 }} />
                      <Legend formatter={(value) => <span style={{ color: "#e9d5ff", fontSize: 12 }}>{value}</span>} />
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
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#e9d5ff", fontFamily: "var(--mono)" }}>{(commitData.summary.totalAdditions - commitData.summary.totalDeletions).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showOwnership && ownershipData && (
            <div className="metric-card">
              <h2>Code Ownership</h2>
              <p style={{ fontSize: "0.72rem", color: "rgba(233,213,255,0.6)", fontFamily: "var(--mono)", marginBottom: 16 }}>
                {ownershipData.totalContributors} contributors — {ownershipData.totalCommits} total commits
              </p>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", textAlign: "center", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>By Commits</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={ownershipData.contributors.slice(0, 6).map(c => ({ name: c.author, value: c.commits }))} cx="50%" cy="50%" outerRadius={85} dataKey="value" paddingAngle={2}>
                        {ownershipData.contributors.slice(0, 6).map((_, i) => <Cell key={i} fill={OWNERSHIP_COLORS[i % OWNERSHIP_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} commits`, n]} contentStyle={{ background: "rgba(20,10,40,0.95)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#e9d5ff", fontFamily: "monospace", fontSize: 11 }} />
                      <Legend formatter={(v) => <span style={{ color: "#e9d5ff", fontSize: 11 }}>{v.length > 14 ? v.slice(0, 12) + "…" : v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", textAlign: "center", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>By Lines Added</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={ownershipData.contributors.slice(0, 6).map(c => ({ name: c.author, value: c.linesAdded }))} cx="50%" cy="50%" outerRadius={85} dataKey="value" paddingAngle={2}>
                        {ownershipData.contributors.slice(0, 6).map((_, i) => <Cell key={i} fill={OWNERSHIP_COLORS[i % OWNERSHIP_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v.toLocaleString()} lines`, n]} contentStyle={{ background: "rgba(20,10,40,0.95)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#e9d5ff", fontFamily: "monospace", fontSize: 11 }} />
                      <Legend formatter={(v) => <span style={{ color: "#e9d5ff", fontSize: 11 }}>{v.length > 14 ? v.slice(0, 12) + "…" : v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {showIssues && issuesData && (
            <div className="metric-card">
              <h2>Issue Tracking</h2>
              <p style={{ fontSize: "0.72rem", color: "rgba(233,213,255,0.6)", fontFamily: "var(--mono)", marginBottom: 16 }}>
                {issuesData.totalIssues} total issues — {issuesData.openIssues} open, {issuesData.closedIssues} closed
              </p>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ flex: "0 0 220px" }}>
                  <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", textAlign: "center", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Open vs Closed</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={[{ name: "Open", value: issuesData.openIssues }, { name: "Closed", value: issuesData.closedIssues }]} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={3}>
                        <Cell fill="#f87171" /><Cell fill="#4ade80" />
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} (${n === "Open" ? issuesData.openRatio : issuesData.closedRatio}%)`, n]} contentStyle={{ background: "rgba(20,10,40,0.95)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#e9d5ff", fontFamily: "monospace", fontSize: 11 }} />
                      <Legend formatter={(v) => <span style={{ color: "#e9d5ff", fontSize: 12 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {issuesData.labels.length > 0 && (
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Labels</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {issuesData.labels.slice(0, 8).map((l, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", color: "#e9d5ff", width: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.label}</div>
                          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                            <div style={{ width: `${(l.count / issuesData.labels[0].count) * 100}%`, height: "100%", background: OWNERSHIP_COLORS[i % OWNERSHIP_COLORS.length], borderRadius: 3 }} />
                          </div>
                          <div style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: OWNERSHIP_COLORS[i % OWNERSHIP_COLORS.length], fontWeight: 700, width: 24, textAlign: "right" }}>{l.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {showChurn && churnData && (
            <div className="metric-card">
              <h2>Churn Rate</h2>
              <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-item"><div className="stat-label">Overall Churn Rate</div><div className="stat-value accent">{churnData.summary.churnRate}%</div></div>
                <div className="stat-item"><div className="stat-label">Total Additions</div><div className="stat-value green">+{churnData.summary.totalAdditions?.toLocaleString()}</div></div>
                <div className="stat-item"><div className="stat-label">Total Deletions</div><div className="stat-value red">-{churnData.summary.totalDeletions?.toLocaleString()}</div></div>
                <div className="stat-item"><div className="stat-label">Net Lines</div><div className="stat-value">{churnData.summary.netLines?.toLocaleString()}</div></div>
              </div>
              <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Top Most Churned Files</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>File</th>
                      <th style={{ ...th, textAlign: "right" }}>Additions</th>
                      <th style={{ ...th, textAlign: "right" }}>Deletions</th>
                      <th style={{ ...th, textAlign: "right" }}>Commits</th>
                      <th style={{ ...th, textAlign: "right" }}>Churn Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {churnData.files.map((f, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td style={{ ...td, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.file}>{f.file.split("/").pop()}</td>
                        <td style={{ ...td, textAlign: "right", color: "#4ade80" }}>+{f.additions.toLocaleString()}</td>
                        <td style={{ ...td, textAlign: "right", color: "#f87171" }}>-{f.deletions.toLocaleString()}</td>
                        <td style={{ ...td, textAlign: "right" }}>{f.commits}</td>
                        <td style={{ ...td, textAlign: "right", color: f.churnRate > 80 ? "#f87171" : f.churnRate > 40 ? "#facc15" : "#4ade80", fontWeight: 700 }}>{f.churnRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showHeatmap && heatmapData && (
            <div className="metric-card" style={{ paddingBottom: 48 }}>
              <h2>File Change Heatmap</h2>
              <p style={{ fontSize: "0.72rem", color: "rgba(233,213,255,0.6)", fontFamily: "var(--mono)", marginBottom: 16 }}>
                {heatmapData.totalUniqueFiles} unique files — showing top {Math.min(heatmapData.files.length, 20)} most changed
              </p>
              <HeatmapGrid files={heatmapData.files.slice(0, 20)} />
              <div style={{ display: "flex", gap: 20, marginTop: 14, fontSize: "0.65rem", fontFamily: "var(--mono)", color: "rgba(233,213,255,0.5)", justifyContent: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#4ade80", display: "inline-block" }} /> Low frequency</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#facc15", display: "inline-block" }} /> Moderate</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#f87171", display: "inline-block" }} /> High frequency</span>
              </div>
            </div>
          )}

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

          {!showLOC && !showCommits && !showHeatmap && !showOwnership && !showIssues && !showChurn && !isDefault && (
            <div className="empty-state">No supported options selected.</div>
          )}

        </div>
        <ChatPanel width={chatWidth} onResize={setChatWidth} commitData={commitData} locData={locData} />
      </div>
    </div>
  );
}