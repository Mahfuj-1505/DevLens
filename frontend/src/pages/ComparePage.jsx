import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { compareReports, fetchReports } from "../api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import HeatmapGrid from "../components/HeatmapGrid";
import CommitActivity from "../components/CommitActivity";
import ComplexityTreemap from "../components/ComplexityTreemap";
import { User } from 'lucide-react';
import "../ResultPage.css";
import "./ComparePage.css";

const OWNERSHIP_COLORS = ["#a855f7", "#f87171", "#4ade80", "#facc15", "#60a5fa", "#fb923c", "#34d399", "#e879f9"];

export default function ComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [leftId, setLeftId] = useState(searchParams.get("left") || "");
  const [rightId, setRightId] = useState(searchParams.get("right") || "");
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const leftDropdownRef = useRef(null);
  const rightDropdownRef = useRef(null);

  const runCompare = async () => {
    setError("");
    if (!leftId || !rightId) {
      setError("Select two reports first.");
      return;
    }
    if (leftId === rightId) {
      setError("Please select two different reports.");
      return;
    }
    try {
      const data = await compareReports(leftId, rightId);
      setComparison(data);
    } catch (err) {
      setError(err.message || "Failed to compare reports.");
      setComparison(null);
    }
  };

  useEffect(() => {
    fetchReports()
      .then((data) => setReports(data))
      .catch((err) => setError(err.message || "Failed to load reports."));
  }, []);

  useEffect(() => {
    if (leftId && rightId && reports.length > 0) {
      runCompare();
    }
  }, [leftId, rightId, reports]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        activeDropdown === "left" &&
        leftDropdownRef.current &&
        !leftDropdownRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
      if (
        activeDropdown === "right" &&
        rightDropdownRef.current &&
        !rightDropdownRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeDropdown]);

  const reportLabel = (id) => {
    if (!id) return "";
    const report = reports.find((item) => item.id === id);
    return report ? report.repository || report.id : id;
  };

  const renderReportOptions = (dropdownType) => {
    const currentValue = dropdownType === "left" ? leftId : rightId;
    const setValue = dropdownType === "left" ? setLeftId : setRightId;

    return (
      <ul className="compare-dropdown-menu">
        <li
          className={`compare-dropdown-item ${!currentValue ? "active" : ""}`}
          onClick={() => {
            setValue("");
            setActiveDropdown(null);
          }}
        >
          Choose {dropdownType} report
        </li>
        {reports.map((report) => (
          <li
            key={report.id}
            className={`compare-dropdown-item ${currentValue === report.id ? "active" : ""}`}
            onClick={() => {
              setValue(report.id);
              setActiveDropdown(null);
            }}
          >
            {report.repository || report.id}
          </li>
        ))}
      </ul>
    );
  };

  const renderReport = (report, title) => {
    const repoName = report.repository?.replace("https://github.com/", "") || "Repository";
    const selectedOptions = report.selectedOptions || [];
    const metrics = report.metrics || {};

    // Extract metrics
    const commitData = metrics.commitData;
    const locData = metrics.locData;
    const heatmapData = metrics.heatmapData;
    const ownershipData = metrics.ownershipData;
    const issuesData = metrics.issuesData;
    const churnData = metrics.churnData;
    const commitMessageQualityData = metrics.commitMessageQualityData;
    const cyclomaticData = metrics.cyclomaticData;
    const commitActivityData = metrics.commitActivityData;

    // Check what to show based on selectedOptions
    const show = (name) => selectedOptions.some(o => o.toLowerCase().includes(name.toLowerCase()));

    const th = { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "rgba(233,213,255,0.5)", fontSize: "0.65rem", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.08em" };
    const td = { padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.72rem", fontFamily: "var(--mono)", color: "#e9d5ff" };

    return (
      <div className="compare-report-container">
        <h2 style={{ color: "#e9d5ff", marginBottom: 16 }}>{title} — {repoName}</h2>
        <div className="metrics-panel" style={{ maxHeight: "80vh", overflowY: "auto" }}>

          {/* Lines of Code */}
          {show("loc") && locData && (
            <div className="metric-card">
              <h2>Lines of Code</h2>
              <div className="stat-grid">
                <div className="stat-item"><div className="stat-label">Total LOC</div><div className="stat-value accent">{locData.summary?.totalLoc?.toLocaleString() || "N/A"}</div></div>
                <div className="stat-item"><div className="stat-label">Files</div><div className="stat-value">{locData.summary?.totalFiles || "N/A"}</div></div>
                <div className="stat-item"><div className="stat-label">Functions</div><div className="stat-value">{locData.summary?.totalFunctions || "N/A"}</div></div>
                <div className="stat-item"><div className="stat-label">Comments</div><div className="stat-value">{locData.summary?.totalComments || "N/A"}</div></div>
              </div>
              {locData.summary?.languages?.length > 0 && (
                <p style={{ marginTop: 12, fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--mono)" }}>
                  Languages: {locData.summary.languages.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Commit Summary */}
          {show("commit") && commitData && (
            <div className="metric-card">
              <h2>Commit Summary</h2>
              <div className="stat-grid">
                <div className="stat-item"><div className="stat-label">Total Commits</div><div className="stat-value accent">{commitData.totalCommits}</div></div>
                <div className="stat-item"><div className="stat-label">Total Additions</div><div className="stat-value green">+{commitData.summary?.totalAdditions?.toLocaleString()}</div></div>
                <div className="stat-item"><div className="stat-label">Total Deletions</div><div className="stat-value red">-{commitData.summary?.totalDeletions?.toLocaleString()}</div></div>
                <div className="stat-item"><div className="stat-label">Avg +/Commit</div><div className="stat-value green">+{commitData.summary?.averageAdditionsPerCommit}</div></div>
                <div className="stat-item"><div className="stat-label">Avg -/Commit</div><div className="stat-value red">-{commitData.summary?.averageDeletionsPerCommit}</div></div>
                <div className="stat-item"><div className="stat-label">Avg Files/Commit</div><div className="stat-value">{commitData.summary?.averageFilesChangedPerCommit}</div></div>
              </div>
            </div>
          )}

          {/* Additions vs Deletions */}
          {show("commit") && commitData && (
            <div className="metric-card">
              <h2>Additions vs Deletions</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ width: 150, height: 150, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{ name: "Additions", value: commitData.summary?.totalAdditions || 0 }, { name: "Deletions", value: commitData.summary?.totalDeletions || 0 }]} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                        <Cell fill="#4ade80" /><Cell fill="#f87171" />
                      </Pie>
                      <Tooltip formatter={(value) => value.toLocaleString()} contentStyle={{ background: "rgba(20,10,40,0.95)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#e9d5ff", fontFamily: "monospace", fontSize: 10 }} />
                      <Legend formatter={(value) => <span style={{ color: "#e9d5ff", fontSize: 10 }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "rgba(233,213,255,0.7)", textTransform: "uppercase", marginBottom: 2 }}>Total Additions</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#4ade80", fontFamily: "var(--mono)" }}>+{commitData.summary?.totalAdditions?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "rgba(233,213,255,0.7)", textTransform: "uppercase", marginBottom: 2 }}>Total Deletions</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f87171", fontFamily: "var(--mono)" }}>-{commitData.summary?.totalDeletions?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "rgba(233,213,255,0.7)", textTransform: "uppercase", marginBottom: 2 }}>Net Change</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e9d5ff", fontFamily: "var(--mono)" }}>{((commitData.summary?.totalAdditions || 0) - (commitData.summary?.totalDeletions || 0)).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Code Ownership */}
          {show("ownership") && ownershipData && (
            <div className="metric-card">
              <h2>Code Ownership</h2>
              <p style={{ fontSize: "0.72rem", color: "rgba(233,213,255,0.6)", fontFamily: "var(--mono)", marginBottom: 16 }}>
                {ownershipData.totalContributors} contributors — {ownershipData.totalCommits} total commits
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", textAlign: "center", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>By Commits</p>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={ownershipData.contributors?.slice(0, 6).map(c => ({ name: c.author, value: c.commits })) || []} cx="50%" cy="50%" outerRadius={60} dataKey="value" paddingAngle={2}>
                        {(ownershipData.contributors || []).slice(0, 6).map((_, i) => <Cell key={i} fill={OWNERSHIP_COLORS[i % OWNERSHIP_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} commits`, n]} contentStyle={{ background: "rgba(20,10,40,0.95)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#e9d5ff", fontFamily: "monospace", fontSize: 9 }} />
                      <Legend formatter={(v) => <span style={{ color: "#e9d5ff", fontSize: 9 }}>{v.length > 10 ? v.slice(0, 8) + "…" : v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", textAlign: "center", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>By Lines Added</p>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={ownershipData.contributors?.slice(0, 6).map(c => ({ name: c.author, value: c.linesAdded })) || []} cx="50%" cy="50%" outerRadius={60} dataKey="value" paddingAngle={2}>
                        {(ownershipData.contributors || []).slice(0, 6).map((_, i) => <Cell key={i} fill={OWNERSHIP_COLORS[i % OWNERSHIP_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v.toLocaleString()} lines`, n]} contentStyle={{ background: "rgba(20,10,40,0.95)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#e9d5ff", fontFamily: "monospace", fontSize: 9 }} />
                      <Legend formatter={(v) => <span style={{ color: "#e9d5ff", fontSize: 9 }}>{v.length > 10 ? v.slice(0, 8) + "…" : v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Issue Tracking */}
          {show("issue") && issuesData && (
            <div className="metric-card">
              <h2>Issue Tracking</h2>
              <p style={{ fontSize: "0.72rem", color: "rgba(233,213,255,0.6)", fontFamily: "var(--mono)", marginBottom: 16 }}>
                {issuesData.totalIssues} total issues — {issuesData.openIssues} open, {issuesData.closedIssues} closed
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: "0 0 150px" }}>
                  <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", textAlign: "center", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Open vs Closed</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={[{ name: "Open", value: issuesData.openIssues }, { name: "Closed", value: issuesData.closedIssues }]} cx="50%" cy="50%" outerRadius={50} dataKey="value" paddingAngle={3}>
                        <Cell fill="#f87171" /><Cell fill="#4ade80" />
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v}`, n]} contentStyle={{ background: "rgba(20,10,40,0.95)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#e9d5ff", fontFamily: "monospace", fontSize: 9 }} />
                      <Legend formatter={(v) => <span style={{ color: "#e9d5ff", fontSize: 10 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {issuesData.labels?.length > 0 && (
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Labels</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {issuesData.labels.slice(0, 6).map((l, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", color: "#e9d5ff", width: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.label}</div>
                          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                            <div style={{ width: `${(l.count / (issuesData.labels[0]?.count || 1)) * 100}%`, height: "100%", background: OWNERSHIP_COLORS[i % OWNERSHIP_COLORS.length], borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: OWNERSHIP_COLORS[i % OWNERSHIP_COLORS.length], fontWeight: 700, width: 20, textAlign: "right" }}>{l.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Churn Rate */}
          {show("churn") && churnData && (
            <div className="metric-card">
              <h2>Churn Rate</h2>
              <div className="stat-grid" style={{ marginBottom: 12 }}>
                <div className="stat-item"><div className="stat-label">Overall Churn</div><div className="stat-value accent">{churnData.summary?.churnRate}%</div></div>
                <div className="stat-item"><div className="stat-label">Additions</div><div className="stat-value green">+{churnData.summary?.totalAdditions?.toLocaleString()}</div></div>
                <div className="stat-item"><div className="stat-label">Deletions</div><div className="stat-value red">-{churnData.summary?.totalDeletions?.toLocaleString()}</div></div>
                <div className="stat-item"><div className="stat-label">Net Lines</div><div className="stat-value">{churnData.summary?.netLines?.toLocaleString()}</div></div>
              </div>
              <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Top Files</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.7rem" }}>
                  <thead>
                    <tr>
                      <th style={th}>File</th>
                      <th style={{ ...th, textAlign: "right" }}>Add</th>
                      <th style={{ ...th, textAlign: "right" }}>Del</th>
                      <th style={{ ...th, textAlign: "right" }}>Churn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {churnData.files?.slice(0, 5).map((f, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td style={{ ...td, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.file}>{f.file?.split("/").pop()}</td>
                        <td style={{ ...td, textAlign: "right", color: "#4ade80" }}>+{f.additions?.toLocaleString()}</td>
                        <td style={{ ...td, textAlign: "right", color: "#f87171" }}>-{f.deletions?.toLocaleString()}</td>
                        <td style={{ ...td, textAlign: "right", color: f.churnRate > 80 ? "#f87171" : f.churnRate > 40 ? "#facc15" : "#4ade80", fontWeight: 700 }}>{f.churnRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Commit Message Quality */}
          {show("message") && commitMessageQualityData && (
            <div className="metric-card">
              <h2>Commit Message Quality</h2>
              <div className="stat-grid" style={{ marginBottom: 12 }}>
                <div className="stat-item"><div className="stat-label">Avg Quality</div><div className="stat-value accent">{commitMessageQualityData.averageQuality}%</div></div>
                <div className="stat-item"><div className="stat-label">Total Commits</div><div className="stat-value">{commitMessageQualityData.totalCommits}</div></div>
                <div className="stat-item"><div className="stat-label">Worst</div><div className="stat-value red">{commitMessageQualityData.worstMessages?.length || 0}</div></div>
              </div>
            </div>
          )}

          {/* Cyclomatic Complexity */}
          {show("cyclomatic") && cyclomaticData && (
            <div className="metric-card">
              <h2>Cyclomatic Complexity</h2>
              <div className="stat-grid">
                <div className="stat-item"><div className="stat-label">Avg Complexity</div><div className="stat-value accent">{cyclomaticData.averageCyclomaticComplexity}</div></div>
                <div className="stat-item"><div className="stat-label">Functions</div><div className="stat-value">{cyclomaticData.totalFunctions}</div></div>
                <div className="stat-item"><div className="stat-label">Files</div><div className="stat-value">{cyclomaticData.totalFilesAnalyzed}</div></div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  return (
    <div className="result-shell">
      <header className="result-header">
        <h1>Compare Reports</h1>
        <button onClick={() => navigate("/profile")} className="header-back">
          <User size={20} />
        </button>
      </header>

      <div className="result-body">
        <div className="compare-body">
          <div className="compare-controls">
            <div className="compare-select-group compare-select-dropdown" ref={leftDropdownRef}>
              <label>Left report</label>
              <button
                type="button"
                className="compare-select-toggle"
                onClick={() => setActiveDropdown((prev) => (prev === "left" ? null : "left"))}
              >
                {leftId ? reportLabel(leftId) : "Choose left report"}
                <span className={`compare-select-arrow ${activeDropdown === "left" ? "open" : ""}`} />
              </button>
              {activeDropdown === "left" && renderReportOptions("left")}
            </div>
            <div className="compare-select-group compare-select-dropdown" ref={rightDropdownRef}>
              <label>Right report</label>
              <button
                type="button"
                className="compare-select-toggle"
                onClick={() => setActiveDropdown((prev) => (prev === "right" ? null : "right"))}
              >
                {rightId ? reportLabel(rightId) : "Choose right report"}
                <span className={`compare-select-arrow ${activeDropdown === "right" ? "open" : ""}`} />
              </button>
              {activeDropdown === "right" && renderReportOptions("right")}
            </div>
            <button className="compare-button" onClick={runCompare}>
              Compare
            </button>
            {error && <div className="compare-error">{error}</div>}
          </div>

          {comparison ? (
            <div className="compare-panels">
              <div className="compare-panel">{renderReport(comparison.left, "Left")}</div>
              <div className="compare-panel">{renderReport(comparison.right, "Right")}</div>
            </div>
          ) : (
            <div className="compare-empty">
              <p>Select two reports to compare. The selected reports will render as cards side by side.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
