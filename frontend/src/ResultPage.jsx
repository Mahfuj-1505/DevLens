import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { analyzeCommits, analyzeGithubRepo, analyzeHeatmap, analyzeOwnership, analyzeIssues, analyzeChurn, analyzeCommitMessageQuality, analyzeCyclomaticComplexity, analyzeCommitActivity, analyzeClassDesign, saveReport } from "./api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ReportDownload from "./components/reportDownload";
import HeatmapGrid from "./components/HeatmapGrid";
import ComingSoon from "./components/ComingSoon";
import CommitActivity from "./components/CommitActivity";
import ComplexityTreemap from "./components/ComplexityTreemap";
import { User } from 'lucide-react';
import "./ResultPage.css";

const hasOption = (selectedOptions, name) =>
  selectedOptions?.some((o) => o.toLowerCase().includes(name.toLowerCase()));

const OWNERSHIP_COLORS = ["#a855f7", "#f87171", "#4ade80", "#facc15", "#60a5fa", "#fb923c", "#34d399", "#e879f9"];

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
    const context = `Repository has ${commitData?.totalCommits || 0} commits. Lines of code: ${locData?.summary?.totalLoc || 0}.`;
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: `You are a code quality assistant. Repository data: ${context}. Provide a brief, direct answer in 2-3 sentences maximum. Be concise and focus on the question.` },
            { role: "user", content: userMsg }
          ],
          temperature: 1,
          max_completion_tokens: 1000,
          top_p: 1,
          reasoning_effort: "medium",
          stream: false,
          stop: null
        }),
      });
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response.";
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

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { repoLink, repoSource, sourceType = "github", selectedOptions, isDefault, spl } = location.state || {};
  const selectedSource = repoSource || repoLink;
  const analysisSource = { sourceType, value: selectedSource };

  const [commitData, setCommitData] = useState(null);
  const [locData, setLocData] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [ownershipData, setOwnershipData] = useState(null);
  const [issuesData, setIssuesData] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [commitMessageQualityData, setCommitMessageQualityData] = useState(null);
  const [cyclomaticData, setCyclomaticData] = useState(null);
  const [commitActivityData, setCommitActivityData] = useState(null);
  const [classDesignData, setClassDesignData] = useState(null);
  const [featureErrors, setFeatureErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [chatWidth, setChatWidth] = useState(340);
  const [reportSaveError, setReportSaveError] = useState("");
  const reportSavedRef = useRef(false);

  const showCommits = (isDefault && (spl === "SPL-1" || spl === "SPL-2" || spl === "SPL-3")) || hasOption(selectedOptions, "Number of commits") || hasOption(selectedOptions, "Changes per commit");
  const showLOC = (isDefault && (spl === "SPL-1" || spl === "SPL-2" || spl === "SPL-3")) || hasOption(selectedOptions, "Lines of Code (LOC)") || hasOption(selectedOptions, "LOC");
  const showHeatmap = (isDefault && (spl === "SPL-2" || spl === "SPL-3")) || hasOption(selectedOptions, "File change heatmap");
  const showOwnership = (isDefault && (spl === "SPL-2" || spl === "SPL-3")) || hasOption(selectedOptions, "Code Ownership") || hasOption(selectedOptions, "Code ownership");
  const showIssues = (isDefault && (spl === "SPL-2" || spl === "SPL-3")) || hasOption(selectedOptions, "Issue Tracking") || hasOption(selectedOptions, "Issue tracking");
  const showChurn = (isDefault && (spl === "SPL-2" || spl === "SPL-3")) || hasOption(selectedOptions, "Churn rate") || hasOption(selectedOptions, "Churn Rate");
  const showCodeDuplication = (isDefault && (spl === "SPL-2" || spl === "SPL-3")) || hasOption(selectedOptions, "Code duplication");
  const showCommitMessageQuality = (isDefault && (spl === "SPL-1" || spl === "SPL-2" || spl === "SPL-3")) || hasOption(selectedOptions, "Commit message quality");
  const showCyclomatic = (isDefault && (spl === "SPL-1" || spl === "SPL-2" || spl === "SPL-3")) || hasOption(selectedOptions, "Cyclomatic Complexity");
  const showActivityGraph = (isDefault && (spl === "SPL-1" || spl === "SPL-2" || spl === "SPL-3")) || hasOption(selectedOptions, "Activity graph") || hasOption(selectedOptions, "Activity Graph");
  const showNamingConventions = (isDefault && (spl === "SPL-1" || spl === "SPL-2" || spl === "SPL-3")) || hasOption(selectedOptions, "Naming conventions") || hasOption(selectedOptions, "Clean code - Naming conventions");
  const showClassDesign = (isDefault && (spl === "SPL-2" || spl === "SPL-3")) || hasOption(selectedOptions, "Class and Component Design") || hasOption(selectedOptions, "WMC (Weighted Methods per Class)") || hasOption(selectedOptions, "LCOM (Lack of Cohesion of Methods)") || hasOption(selectedOptions, "DIT (Depth of Inheritance Tree)") || hasOption(selectedOptions, "NOC (Number of Children)");
  const showTesting = (isDefault && spl === "SPL-3") || hasOption(selectedOptions, "Test Coverage");
  const showCiCd = (isDefault && spl === "SPL-3") || hasOption(selectedOptions, "CI/CD Evidence");

  useEffect(() => {
    reportSavedRef.current = false;
  }, [selectedSource, sourceType, spl]);

  useEffect(() => {
    if (loading) return;
    if (reportSavedRef.current) return;
    const token = localStorage.getItem("access_token");
    if (!token || !selectedSource) return;

    const metrics = {
      commitData,
      locData,
      heatmapData,
      ownershipData,
      issuesData,
      churnData,
      commitMessageQualityData,
      cyclomaticData,
      commitActivityData,
      classDesignData,
    };

    const hasMetrics = Object.values(metrics).some((value) => value !== null);
    if (!hasMetrics) return;

    reportSavedRef.current = true;
    saveReport({
      repository: selectedSource,
      sourceType,
      spl,
      selectedOptions: selectedOptions || [],
      metrics,
    }).catch((err) => setReportSaveError(err.message));
  }, [loading, selectedSource, sourceType, spl, selectedOptions, commitData, locData, heatmapData, ownershipData, issuesData, churnData, commitMessageQualityData, cyclomaticData, commitActivityData, classDesignData]);

  const renderFeatureErrorCard = (title, errorMessage) => (
    <div className="metric-card">
      <h2>{title}</h2>
      <p style={{ fontSize: "0.75rem", color: "#fca5a5", fontFamily: "var(--mono)", marginBottom: 8 }}>
        This feature failed to load.
      </p>
      <p style={{ fontSize: "0.72rem", color: "rgba(233,213,255,0.7)", fontFamily: "var(--mono)" }}>
        {errorMessage}
      </p>
    </div>
  );

  useEffect(() => {
    if (!selectedSource) { navigate("/home"); return; }
    setFeatureErrors({});
    setCommitData(null);
    setLocData(null);
    setHeatmapData(null);
    setOwnershipData(null);
    setIssuesData(null);
    setChurnData(null);
    setCommitMessageQualityData(null);
    setCyclomaticData(null);
    setCommitActivityData(null);
    setClassDesignData(null);

    const tasks = [];

    if (showCommits) {
      tasks.push({
        key: "commits",
        run: () => analyzeCommits(analysisSource),
        onSuccess: setCommitData,
      });
    }
    if (showLOC) {
      tasks.push({
        key: "loc",
        run: () => analyzeGithubRepo(analysisSource, spl),
        onSuccess: setLocData,
      });
    }
    if (showHeatmap) {
      tasks.push({
        key: "heatmap",
        run: () => analyzeHeatmap(analysisSource),
        onSuccess: setHeatmapData,
      });
    }
    if (showOwnership) {
      tasks.push({
        key: "ownership",
        run: () => analyzeOwnership(analysisSource),
        onSuccess: setOwnershipData,
      });
    }
    if (showIssues) {
      tasks.push({
        key: "issues",
        run: () => analyzeIssues(analysisSource),
        onSuccess: setIssuesData,
      });
    }
    if (showChurn) {
      tasks.push({
        key: "churn",
        run: () => analyzeChurn(analysisSource),
        onSuccess: setChurnData,
      });
    }
    if (showCommitMessageQuality) {
      tasks.push({
        key: "commitMessageQuality",
        run: () => analyzeCommitMessageQuality(analysisSource),
        onSuccess: setCommitMessageQualityData,
      });
    }
    if (showCyclomatic) {
      tasks.push({
        key: "cyclomatic",
        run: () => analyzeCyclomaticComplexity(analysisSource, { topN: 10, threshold: 10 }),
        onSuccess: setCyclomaticData,
      });
    }
    if (showActivityGraph) {
      tasks.push({
        key: "activityGraph",
        run: () => analyzeCommitActivity(analysisSource, { weeks: 26 }),
        onSuccess: setCommitActivityData,
      });
    }
    if (showClassDesign) {
      tasks.push({
        key: "classDesign",
        run: () => analyzeClassDesign(analysisSource, { language: "all" }),
        onSuccess: setClassDesignData,
      });
    }

    if (!tasks.length) {
      setLoading(false);
      return;
    }

    Promise.allSettled(
      tasks.map(async (task) => {
        try {
          const result = await task.run();
          task.onSuccess(result);
        } catch (err) {
          const message = err?.message || "Unknown error while loading this feature";
          setFeatureErrors((prev) => ({ ...prev, [task.key]: message }));
        }
      })
    ).finally(() => {
      setProgress(100);
      setMsgIndex(loadingMessages.length - 1);
      setTimeout(() => setLoading(false), 300);
    });
  }, [selectedSource, sourceType, showCommits, showLOC, showCodeDuplication, showOwnership, showIssues, showChurn, showCommitMessageQuality, showCyclomatic, showActivityGraph, showNamingConventions, showHeatmap, showClassDesign, showTesting, showCiCd, spl]);

  const [progress, setProgress] = React.useState(0);
  const [msgIndex, setMsgIndex] = React.useState(0);
  const cancelledRef = React.useRef(false);

  const loadingMessages = React.useMemo(() => {
    const msgs = ["Cloning repository..."];
    if (showCommits) msgs.push("Analyzing commit history...", "Counting additions and deletions...");
    if (showLOC) msgs.push("Counting lines of code...", "Detecting programming languages...");
    if (showCodeDuplication) msgs.push("Analyzing code duplication...", "Detecting clone patterns...");
    if (showTesting) msgs.push("Detecting test frameworks...", "Analyzing test coverage...");
    if (showCiCd) msgs.push("Scanning CI/CD pipelines...", "Validating pipeline configurations...");
    if (showOwnership) msgs.push("Measuring contributor ownership...");
    if (showIssues) msgs.push("Fetching issues from GitHub...", "Analyzing open and closed issues...");
    if (showChurn) msgs.push("Calculating code churn rate...", "Finding most rewritten files...");
    if (showCommitMessageQuality) msgs.push("Linting commit messages with Gitlint...", "Scoring commit message clarity and structure...");
    if (showCyclomatic) msgs.push("Calculating cyclomatic complexity using Lizard...", "Ranking high-complexity files...");
    if (showActivityGraph) msgs.push("Building GitHub-style commit activity graph...");
    if (showNamingConventions) msgs.push("Checking naming conventions...", "Ranking worst variable and function names...");
    if (showHeatmap) msgs.push("Building file change heatmap...");
    if (showClassDesign) msgs.push("Analyzing class and component design...", "Computing WMC, LCOM, DIT, NOC metrics...");

    // SPL-specific messaging
    if (spl === "SPL-1") msgs.push("Processing complexity metrics...", "Finalizing SPL-1 analysis...");
    if (spl === "SPL-2") msgs.push("Processing team metrics...", "Calculating design metrics...", "Finalizing SPL-2 analysis...");
    if (spl === "SPL-3") msgs.push("Analyzing testing infrastructure...", "Evaluating CI/CD maturity...", "Finalizing SPL-3 analysis...");

    msgs.push("Processing results...", "Collecting all results...", "Almost Done!");
    return msgs;
  }, [showCommits, showLOC, showCodeDuplication, showOwnership, showIssues, showChurn, showCommitMessageQuality, showCyclomatic, showActivityGraph, showNamingConventions, showHeatmap, showClassDesign, showTesting, showCiCd, spl]);

  React.useEffect(() => {
    if (!loading) return;
    let i = 0;
    const totalTime = 3000;
    const interval = setInterval(() => {
      i++;
      setMsgIndex((prev) => Math.min(prev + 1, loadingMessages.length - 1));
      setProgress((p) => Math.min(p + (90 / loadingMessages.length), 92));
    }, totalTime);
    return () => clearInterval(interval);
  }, [loading, loadingMessages]);

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
      <div style={{ fontSize: "1rem", color: "#e9d5ff", fontWeight: 600, minHeight: 24, transition: "all 0.5s ease" }}>
        {loadingMessages[msgIndex]}
      </div>
      <div style={{ width: 320, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: "linear-gradient(90deg, #7c3aed, #a855f7, #7c3aed)",
          backgroundSize: "200% 100%",
          width: `${progress}%`,
          transition: "width 2.5s ease",
          animation: "shimmer 2s linear infinite",
        }} />
      </div>
      <div style={{ fontSize: "0.68rem", color: "rgba(233,213,255,0.4)" }}>
        {Math.round(progress)}% complete
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
        {loadingMessages.map((msg, i) => (
          <div key={i} style={{
            fontSize: "0.65rem", fontFamily: "var(--mono, monospace)",
            color: i < msgIndex ? "rgba(233,213,255,0.3)" : i === msgIndex ? "#a855f7" : "rgba(233,213,255,0.15)",
            display: "flex", alignItems: "center", gap: 8,
            transition: "color 0.5s ease",
          }}>
            <span>{i < msgIndex ? "✓" : i === msgIndex ? "›" : "·"}</span>
            {msg}
          </div>
        ))}
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

  const repoName = sourceType === "local"
    ? (selectedSource?.split("/").filter(Boolean).pop() || "Local Repository")
    : (selectedSource?.replace("https://github.com/", "") || "Repository");

  const th = { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "rgba(233,213,255,0.5)", fontSize: "0.65rem", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.08em" };
  const td = { padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.72rem", fontFamily: "var(--mono)", color: "#e9d5ff" };

  return (
    <div className="result-shell">
      <header className="result-header">
        <h1>Repo Metrics — <span>{repoName}</span></h1>
        <div style={{ display: "flex", gap: 8 }}>
          {localStorage.getItem("current_user") && (
            <button onClick={() => navigate("/profile")} style={{ background: "none", border: "none", cursor: "pointer", color: "#e9d5ff" }}>
              <User size={20} />
            </button>
          )}
          <button className="header-back" onClick={() => navigate("/home")}>← Back</button>
        </div>
      </header>
      {reportSaveError && (
        <p style={{ color: "#fca5a5", fontFamily: "var(--mono)", margin: "6px 16px" }}>
          Failed to save report: {reportSaveError}
        </p>
      )}

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
          {showLOC && !locData && featureErrors.loc && renderFeatureErrorCard("Lines of Code", featureErrors.loc)}

          {showTesting && locData?.summary?.testingPresence && (
            <div className="metric-card">
              <h2>Test Coverage</h2>
              <div className="stat-grid">
                <div className="stat-item"><div className="stat-label">Testing Confidence</div><div className="stat-value accent">{Math.round(locData.summary.testingPresence.testing_confidence * 100)}%</div></div>
                <div className="stat-item"><div className="stat-label">Test Directories</div><div className="stat-value">{locData.summary.testingPresence.test_dir_found ? "Yes" : "No"}</div></div>
                <div className="stat-item"><div className="stat-label">Test Files</div><div className="stat-value">{locData.summary.testingPresence.test_file_count}</div></div>
                <div className="stat-item"><div className="stat-label">Frameworks</div><div className="stat-value">{locData.summary.testingPresence.frameworks_detected?.length || 0}</div></div>
              </div>
              {locData.summary.testingPresence.frameworks_detected?.length > 0 && (
                <p style={{ marginTop: 12, fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--mono)" }}>
                  Frameworks: {locData.summary.testingPresence.frameworks_detected.join(", ")}
                </p>
              )}
            </div>
          )}

          {showCiCd && locData?.summary?.ciCdPresence && (
            <div className="metric-card">
              <h2>CI/CD Evidence</h2>
              <div className="stat-grid">
                <div className="stat-item"><div className="stat-label">CI/CD Confidence</div><div className="stat-value accent">{Math.round(locData.summary.ciCdPresence.ci_cd_confidence * 100)}%</div></div>
                <div className="stat-item"><div className="stat-label">Pipeline Files</div><div className="stat-value">{locData.summary.ciCdPresence.valid_pipeline_files?.length || 0}</div></div>
                <div className="stat-item"><div className="stat-label">Platforms</div><div className="stat-value">{locData.summary.ciCdPresence.platforms?.length || 0}</div></div>
                <div className="stat-item"><div className="stat-label">Test Execution</div><div className="stat-value">{locData.summary.ciCdPresence.test_execution_found?.length > 0 ? "Yes" : "No"}</div></div>
              </div>
              {locData.summary.ciCdPresence.platforms?.length > 0 && (
                <p style={{ marginTop: 12, fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--mono)" }}>
                  Platforms: {locData.summary.ciCdPresence.platforms.join(", ")}
                </p>
              )}
            </div>
          )}

          {showCodeDuplication && locData?.summary?.codeDuplication && (
            <div className="metric-card">
              <h2>Code Duplication</h2>
              <div className="stat-grid">
                <div className="stat-item"><div className="stat-label">Duplication %</div><div className="stat-value accent">{locData.summary.codeDuplication.duplication_percentage}%</div></div>
                <div className="stat-item"><div className="stat-label">Files Analyzed</div><div className="stat-value">{locData.summary.codeDuplication.total_files_analyzed}</div></div>
                <div className="stat-item"><div className="stat-label">Duplicate Groups</div><div className="stat-value">{locData.summary.codeDuplication.total_duplicate_groups}</div></div>
                <div className="stat-item"><div className="stat-label">High Risk</div><div className="stat-value red">{locData.summary.codeDuplication.high_duplication_groups}</div></div>
              </div>
              <p style={{ marginTop: 12, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Code duplication detected using token-based analysis with normalization for Type-2 clones.
              </p>
            </div>
          )}

          {showCommits && commitData && (
            <div className="metric-card" id="chart-commits">
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
          {showCommits && !commitData && featureErrors.commits && renderFeatureErrorCard("Commit Summary", featureErrors.commits)}

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
                <div style={{ flex: 1, minWidth: 200 }} id="chart-ownership-commits">
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
                <div style={{ flex: 1, minWidth: 200 }} id="chart-ownership-lines">
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
          {showOwnership && !ownershipData && featureErrors.ownership && renderFeatureErrorCard("Code Ownership", featureErrors.ownership)}

          {showIssues && issuesData && (
            <div className="metric-card">
              <h2>Issue Tracking</h2>
              <p style={{ fontSize: "0.72rem", color: "rgba(233,213,255,0.6)", fontFamily: "var(--mono)", marginBottom: 16 }}>
                {issuesData.totalIssues} total issues — {issuesData.openIssues} open, {issuesData.closedIssues} closed
              </p>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ flex: "0 0 220px" }} id="chart-issues">
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
          {showIssues && !issuesData && featureErrors.issues && renderFeatureErrorCard("Issue Tracking", featureErrors.issues)}

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
          {showChurn && !churnData && featureErrors.churn && renderFeatureErrorCard("Churn Rate", featureErrors.churn)}

          {showCommitMessageQuality && commitMessageQualityData && (
            <div className="metric-card">
              <h2>Commit Message Quality</h2>
              <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-item"><div className="stat-label">Average Quality</div><div className="stat-value accent">{commitMessageQualityData.averageQuality}%</div></div>
                <div className="stat-item"><div className="stat-label">Total Commits</div><div className="stat-value">{commitMessageQualityData.totalCommits}</div></div>
                <div className="stat-item"><div className="stat-label">Worst Messages</div><div className="stat-value red">{commitMessageQualityData.worstMessages?.length || 0}</div></div>
              </div>

              <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Worst 10 Commit Messages
              </p>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>SHA</th>
                      <th style={th}>Message</th>
                      <th style={{ ...th, textAlign: "right" }}>Quality</th>
                      <th style={{ ...th, textAlign: "right" }}>Violations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(commitMessageQualityData.worstMessages || []).map((m, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td style={{ ...td, color: "#c4b5fd" }}>{m.sha}</td>
                        <td style={{ ...td, maxWidth: 440, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.message}>{m.message || "(empty subject)"}</td>
                        <td style={{ ...td, textAlign: "right", color: m.qualityScore < 50 ? "#f87171" : m.qualityScore < 75 ? "#facc15" : "#4ade80", fontWeight: 700 }}>{m.qualityScore}%</td>
                        <td style={{ ...td, textAlign: "right" }}>{m.violationCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {showCommitMessageQuality && !commitMessageQualityData && featureErrors.commitMessageQuality && renderFeatureErrorCard("Commit Message Quality", featureErrors.commitMessageQuality)}

          {showCyclomatic && cyclomaticData && (
            <div className="metric-card">
              <h2>Cyclomatic Complexity</h2>
              <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-item"><div className="stat-label">Average Complexity</div><div className="stat-value accent">{cyclomaticData.averageCyclomaticComplexity}</div></div>
                <div className="stat-item"><div className="stat-label">Functions Analyzed</div><div className="stat-value">{cyclomaticData.totalFunctions}</div></div>
                <div className="stat-item"><div className="stat-label">Files Scanned</div><div className="stat-value">{cyclomaticData.totalFilesAnalyzed}</div></div>
                <div className="stat-item"><div className="stat-label">High Threshold</div><div className="stat-value">≥ {cyclomaticData.highComplexityThreshold}</div></div>
              </div>

              <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Files With High Complexity
              </p>
              <div id="chart-cyclomatic">
                <ComplexityTreemap
                  items={(cyclomaticData.highComplexityFiles || []).map((file) => ({ path: file.file, complexity: file.maxFunctionComplexity }))}
                />
              </div>

              <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", marginTop: 20, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Highest Complexity Functions
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>File</th>
                      <th style={th}>Function</th>
                      <th style={{ ...th, textAlign: "right" }}>Complexity</th>
                      <th style={{ ...th, textAlign: "right" }}>NLOC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(cyclomaticData.highComplexityFunctions || []).map((fn, i) => (
                      <tr key={`${fn.file}-${fn.name}-${i}`} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td style={{ ...td, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={fn.file}>{fn.file.split("/").pop()}</td>
                        <td style={{ ...td, color: "#c4b5fd" }}>{fn.name}</td>
                        <td style={{ ...td, textAlign: "right", color: fn.complexity >= 20 ? "#f87171" : fn.complexity >= 10 ? "#facc15" : "#4ade80", fontWeight: 700 }}>{fn.complexity}</td>
                        <td style={{ ...td, textAlign: "right" }}>{fn.nloc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {showCyclomatic && !cyclomaticData && featureErrors.cyclomatic && renderFeatureErrorCard("Cyclomatic Complexity", featureErrors.cyclomatic)}

          {showActivityGraph && commitActivityData && (
            <div className="metric-card">
              <h2>Commit Activity Graph</h2>
              <p style={{ fontSize: "0.72rem", color: "rgba(233,213,255,0.6)", fontFamily: "var(--mono)", marginBottom: 14 }}>
                Last {commitActivityData.weeks} weeks ({commitActivityData.dateRange?.from} to {commitActivityData.dateRange?.to})
              </p>
              <div id="chart-activity">
                <CommitActivity activityData={commitActivityData} />
              </div>
            </div>
          )}
          {showActivityGraph && !commitActivityData && featureErrors.activityGraph && renderFeatureErrorCard("Commit Activity Graph", featureErrors.activityGraph)}

          {showNamingConventions && locData?.namingQuality && (
            <div className="metric-card">
              <h2>Naming Conventions</h2>
              <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-item"><div className="stat-label">Overall Naming Quality</div><div className="stat-value accent">{Math.round(locData.namingQuality.percentage)}%</div></div>
                <div className="stat-item"><div className="stat-label">Names Evaluated</div><div className="stat-value">{locData.namingQuality.evaluatedNames?.toLocaleString()}</div></div>
                <div className="stat-item"><div className="stat-label">Worst Names Listed</div><div className="stat-value red">{Math.min((locData.namingQuality.worstNames || []).length, 20)}</div></div>
              </div>

              <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Worst 20 Names
              </p>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>Name</th>
                      <th style={th}>Type</th>
                      <th style={th}>Language</th>
                      <th style={th}>Issue</th>
                      <th style={{ ...th, textAlign: "right" }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(locData.namingQuality.worstNames || []).slice(0, 20).map((item, i) => (
                      <tr key={`${item.path}-${item.name}-${i}`} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td style={{ ...td, color: "#c4b5fd" }}>{item.name}</td>
                        <td style={td}>{item.type}</td>
                        <td style={td}>{item.language}</td>
                        <td style={{ ...td, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={(item.issues || []).join(", ") || "No issues"}>{(item.issues || []).join(", ") || "No issues"}</td>
                        <td style={{ ...td, textAlign: "right", color: item.score < 50 ? "#f87171" : item.score < 75 ? "#facc15" : "#4ade80", fontWeight: 700 }}>{item.score}%</td>
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
              <div id="chart-heatmap">
                <HeatmapGrid files={heatmapData.files.slice(0, 20)} />
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 14, fontSize: "0.65rem", fontFamily: "var(--mono)", color: "rgba(233,213,255,0.5)", justifyContent: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#4ade80", display: "inline-block" }} /> Low frequency</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#facc15", display: "inline-block" }} /> Moderate</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#f87171", display: "inline-block" }} /> High frequency</span>
              </div>
            </div>
          )}
          {showHeatmap && !heatmapData && featureErrors.heatmap && renderFeatureErrorCard("File Change Heatmap", featureErrors.heatmap)}

          {showClassDesign && (
            <div className="metric-card" id="chart-classdesign">
              <h2>Class & Component Design</h2>
              {classDesignData ? (
                <>
                  <div className="stat-grid">
                    <div className="stat-item"><div className="stat-label">Total Classes</div><div className="stat-value accent">{classDesignData.summary.totalClasses}</div></div>
                    <div className="stat-item"><div className="stat-label">Avg WMC</div><div className="stat-value">{classDesignData.summary.averageWMC}</div></div>
                    <div className="stat-item"><div className="stat-label">Avg LCOM</div><div className="stat-value">{classDesignData.summary.averageLCOM}</div></div>
                    <div className="stat-item"><div className="stat-label">Max DIT</div><div className="stat-value">{classDesignData.summary.maxDIT}</div></div>
                    <div className="stat-item"><div className="stat-label">Max NOC</div><div className="stat-value">{classDesignData.summary.maxNOC}</div></div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <h3 style={{ fontSize: "0.9rem", marginBottom: 8, color: "#F6F4E8" }}>Class Details</h3>
                    <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--border)" , color: "#F6F4E8", borderRadius: 4, padding: 8 }}>
                      <table style={{ width: "100%", fontSize: "0.75rem", fontFamily: "var(--mono)" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)" }}>
                            <th style={{ textAlign: "left", padding: "4px 8px" }}>Class</th>
                            <th style={{ textAlign: "center", padding: "4px 8px" }}>Language</th>
                            <th style={{ textAlign: "center", padding: "4px 8px" }}>WMC</th>
                            <th style={{ textAlign: "center", padding: "4px 8px" }}>LCOM</th>
                            <th style={{ textAlign: "center", padding: "4px 8px" }}>DIT</th>
                            <th style={{ textAlign: "center", padding: "4px 8px" }}>NOC</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classDesignData.classes.slice(0, 20).map((cls, index) => (
                            <tr key={index} style={{ borderBottom: "1px solid var(--border-light)" }}>
                              <td style={{ padding: "4px 8px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }} title={cls.className}>
                                {cls.className}
                              </td>
                              <td style={{ textAlign: "center", padding: "4px 8px" }}>{cls.language}</td>
                              <td style={{ textAlign: "center", padding: "4px 8px" }}>{cls.metrics.WMC}</td>
                              <td style={{ textAlign: "center", padding: "4px 8px" }}>{cls.metrics.LCOM}</td>
                              <td style={{ textAlign: "center", padding: "4px 8px" }}>{cls.metrics.DIT}</td>
                              <td style={{ textAlign: "center", padding: "4px 8px" }}>{cls.metrics.NOC}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {classDesignData.classes.length > 20 && (
                        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>
                          Showing top 20 classes — {classDesignData.classes.length - 20} more...
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ color: "rgba(233,213,255,0.6)", fontFamily: "var(--mono)", textAlign: "center", padding: 20 }}>
                  Class and Component Design analysis is not yet implemented.
                </p>
              )}
            </div>
          )}

          {isDefault && (
            <>

            </>
          )}

          {/* SPL-2 Specific Features */}
          {spl === "SPL-2" && (
            <>
              {/* {showClassDesign && !classDesignData && featureErrors.classDesign && renderFeatureErrorCard("Class & Component Design", featureErrors.classDesign)} */}
              {/* {!showClassDesign && <ComingSoon title="Class & Component Design" />} */}
              {/* {!showChurn && <ComingSoon title="Feature Branching & Merging" />} */}
            </>
          )}

          {!showLOC && !showCommits && !showHeatmap && !showOwnership && !showIssues && !showChurn && !showCommitMessageQuality && !showCyclomatic && !showActivityGraph && !showNamingConventions && !showClassDesign && !isDefault && (
            <div className="empty-state">No supported options selected.</div>
          )}

          {/* ✅ Download buttons — bottom of metrics panel */}
          <ReportDownload
            repoName={repoName}
            churnData={churnData}
            commitData={commitData}
            locData={locData}
            ownershipData={ownershipData}
            issuesData={issuesData}
            heatmapData={heatmapData}
            commitMessageQualityData={commitMessageQualityData}
            cyclomaticData={cyclomaticData}
            commitActivityData={commitActivityData}
            classDesignData={classDesignData}
            testingData={locData?.summary?.testingPresence}
            ciCdData={locData?.summary?.ciCdPresence}
            visibleMetrics={{
              loc: showLOC,
              commits: showCommits,
              ownership: showOwnership,
              issues: showIssues,
              churn: showChurn,
              heatmap: showHeatmap,
              commitMessageQuality: showCommitMessageQuality,
              cyclomatic: showCyclomatic,
              activityGraph: showActivityGraph,
              namingConventions: showNamingConventions,
              classDesign: showClassDesign,
              testing: showTesting,
              ciCd: showCiCd,
            }}
          />

        </div>
        <ChatPanel width={chatWidth} onResize={setChatWidth} commitData={commitData} locData={locData} />
      </div>
    </div>
  );
}