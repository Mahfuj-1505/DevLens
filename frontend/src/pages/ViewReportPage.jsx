import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import HeatmapGrid from "../components/HeatmapGrid";
import CommitActivity from "../components/CommitActivity";
import ComplexityTreemap from "../components/ComplexityTreemap";
import { User } from 'lucide-react';
import "../ResultPage.css";

const OWNERSHIP_COLORS = ["#a855f7", "#f87171", "#4ade80", "#facc15", "#60a5fa", "#fb923c", "#34d399", "#e879f9"];

export default function ViewReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { report } = location.state || {};

  if (!report) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#e9d5ff" }}>
        <p>No report data available.</p>
        <button onClick={() => navigate("/profile")} style={{ marginTop: 10, padding: "8px 16px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
          Back to Profile
        </button>
      </div>
    );
  }

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
    <div className="result-shell">
      <header className="result-header">
        <h1>Repo Metrics — <span>{repoName}</span></h1>
        <div style={{ display: "flex", gap: 8 }}>
          {localStorage.getItem("current_user") && (
            <button onClick={() => navigate("/profile")} style={{ background: "none", border: "none", cursor: "pointer", color: "#e9d5ff" }}>
              <User size={20} />
            </button>
          )}
          <button className="header-back" onClick={() => navigate("/profile")}>← Back</button>
        </div>
      </header>

      <div className="result-body">
        <div className="metrics-panel">

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

          {/* Code Duplication */}
          {show("duplication") && locData?.summary?.codeDuplication && (
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
                <div style={{ width: 220, height: 220, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{ name: "Additions", value: commitData.summary?.totalAdditions || 0 }, { name: "Deletions", value: commitData.summary?.totalDeletions || 0 }]} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
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
                    <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#4ade80", fontFamily: "var(--mono)" }}>+{commitData.summary?.totalAdditions?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "rgba(233,213,255,0.7)", textTransform: "uppercase", marginBottom: 4 }}>Total Deletions</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#f87171", fontFamily: "var(--mono)" }}>-{commitData.summary?.totalDeletions?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "rgba(233,213,255,0.7)", textTransform: "uppercase", marginBottom: 4 }}>Net Change</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#e9d5ff", fontFamily: "var(--mono)" }}>{((commitData.summary?.totalAdditions || 0) - (commitData.summary?.totalDeletions || 0)).toLocaleString()}</div>
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
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", textAlign: "center", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>By Commits</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={ownershipData.contributors?.slice(0, 6).map(c => ({ name: c.author, value: c.commits })) || []} cx="50%" cy="50%" outerRadius={85} dataKey="value" paddingAngle={2}>
                        {(ownershipData.contributors || []).slice(0, 6).map((_, i) => <Cell key={i} fill={OWNERSHIP_COLORS[i % OWNERSHIP_COLORS.length]} />)}
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
                      <Pie data={ownershipData.contributors?.slice(0, 6).map(c => ({ name: c.author, value: c.linesAdded })) || []} cx="50%" cy="50%" outerRadius={85} dataKey="value" paddingAngle={2}>
                        {(ownershipData.contributors || []).slice(0, 6).map((_, i) => <Cell key={i} fill={OWNERSHIP_COLORS[i % OWNERSHIP_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v.toLocaleString()} lines`, n]} contentStyle={{ background: "rgba(20,10,40,0.95)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#e9d5ff", fontFamily: "monospace", fontSize: 11 }} />
                      <Legend formatter={(v) => <span style={{ color: "#e9d5ff", fontSize: 11 }}>{v.length > 14 ? v.slice(0, 12) + "…" : v}</span>} />
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
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ flex: "0 0 220px" }}>
                  <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", textAlign: "center", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Open vs Closed</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={[{ name: "Open", value: issuesData.openIssues }, { name: "Closed", value: issuesData.closedIssues }]} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={3}>
                        <Cell fill="#f87171" /><Cell fill="#4ade80" />
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v}`, n]} contentStyle={{ background: "rgba(20,10,40,0.95)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#e9d5ff", fontFamily: "monospace", fontSize: 11 }} />
                      <Legend formatter={(v) => <span style={{ color: "#e9d5ff", fontSize: 12 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {issuesData.labels?.length > 0 && (
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Labels</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {issuesData.labels.slice(0, 8).map((l, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", color: "#e9d5ff", width: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.label}</div>
                          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                            <div style={{ width: `${(l.count / (issuesData.labels[0]?.count || 1)) * 100}%`, height: "100%", background: OWNERSHIP_COLORS[i % OWNERSHIP_COLORS.length], borderRadius: 3 }} />
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

          {/* Churn Rate */}
          {show("churn") && churnData && (
            <div className="metric-card">
              <h2>Churn Rate</h2>
              <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-item"><div className="stat-label">Overall Churn Rate</div><div className="stat-value accent">{churnData.summary?.churnRate}%</div></div>
                <div className="stat-item"><div className="stat-label">Total Additions</div><div className="stat-value green">+{churnData.summary?.totalAdditions?.toLocaleString()}</div></div>
                <div className="stat-item"><div className="stat-label">Total Deletions</div><div className="stat-value red">-{churnData.summary?.totalDeletions?.toLocaleString()}</div></div>
                <div className="stat-item"><div className="stat-label">Net Lines</div><div className="stat-value">{churnData.summary?.netLines?.toLocaleString()}</div></div>
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
                    {churnData.files?.map((f, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td style={{ ...td, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.file}>{f.file?.split("/").pop()}</td>
                        <td style={{ ...td, textAlign: "right", color: "#4ade80" }}>+{f.additions?.toLocaleString()}</td>
                        <td style={{ ...td, textAlign: "right", color: "#f87171" }}>-{f.deletions?.toLocaleString()}</td>
                        <td style={{ ...td, textAlign: "right" }}>{f.commits}</td>
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
              <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-item"><div className="stat-label">Average Quality</div><div className="stat-value accent">{commitMessageQualityData.averageQuality}%</div></div>
                <div className="stat-item"><div className="stat-label">Total Commits</div><div className="stat-value">{commitMessageQualityData.totalCommits}</div></div>
                <div className="stat-item"><div className="stat-label">Worst Messages</div><div className="stat-value red">{commitMessageQualityData.worstMessages?.length || 0}</div></div>
              </div>
              <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Worst 10 Commit Messages</p>
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
                    {commitMessageQualityData.worstMessages?.slice(0, 10).map((m, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td style={{ ...td, fontFamily: "monospace", fontSize: "0.68rem" }}>{m.sha?.slice(0, 8)}</td>
                        <td style={{ ...td, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }} title={m.message}>{m.message}</td>
                        <td style={{ ...td, textAlign: "right" }}>{m.quality}%</td>
                        <td style={{ ...td, textAlign: "right" }}>{m.violations || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cyclomatic Complexity */}
          {show("cyclomatic") && cyclomaticData && (
            <div className="metric-card">
              <h2>Cyclomatic Complexity</h2>
              <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-item"><div className="stat-label">Average Complexity</div><div className="stat-value accent">{cyclomaticData.summary?.averageComplexity?.toFixed(2)}</div></div>
                <div className="stat-item"><div className="stat-label">Functions Analyzed</div><div className="stat-value">{cyclomaticData.summary?.functionsAnalyzed}</div></div>
                <div className="stat-item"><div className="stat-label">Files Scanned</div><div className="stat-value">{cyclomaticData.summary?.filesScanned}</div></div>
                <div className="stat-item"><div className="stat-label">High Threshold</div><div className="stat-value">≥ {cyclomaticData.summary?.highThreshold || 10}</div></div>
              </div>
              <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Highest Complexity Functions</p>
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
                    {cyclomaticData.highestComplexityFunctions?.slice(0, 10).map((fn, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td style={{ ...td, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={fn.file}>{fn.file?.split("/").pop()}</td>
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

          {/* Commit Activity Graph */}
          {show("activity") && commitActivityData && (
            <div className="metric-card">
              <h2>Commit Activity Graph</h2>
              <p style={{ fontSize: "0.72rem", color: "rgba(233,213,255,0.6)", fontFamily: "var(--mono)", marginBottom: 14 }}>
                Last {commitActivityData.weeks} weeks ({commitActivityData.dateRange?.from} to {commitActivityData.dateRange?.to})
              </p>
              <CommitActivity activityData={commitActivityData} />
            </div>
          )}

          {/* Naming Conventions */}
          {show("naming") && locData?.namingQuality && (
            <div className="metric-card">
              <h2>Naming Conventions</h2>
              <div className="stat-grid" style={{ marginBottom: 20 }}>
                <div className="stat-item"><div className="stat-label">Overall Naming Quality</div><div className="stat-value accent">{Math.round(locData.namingQuality.percentage)}%</div></div>
                <div className="stat-item"><div className="stat-label">Names Evaluated</div><div className="stat-value">{locData.namingQuality.evaluatedNames?.toLocaleString()}</div></div>
                <div className="stat-item"><div className="stat-label">Worst Names Listed</div><div className="stat-value red">{Math.min((locData.namingQuality.worstNames || []).length, 20)}</div></div>
              </div>
              <p style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "#c4b5fd", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Worst 20 Names</p>
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

          {/* File Change Heatmap */}
          {show("heatmap") && heatmapData && (
            <div className="metric-card" style={{ paddingBottom: 48 }}>
              <h2>File Change Heatmap</h2>
              <p style={{ fontSize: "0.72rem", color: "rgba(233,213,255,0.6)", fontFamily: "var(--mono)", marginBottom: 16 }}>
                {heatmapData.totalUniqueFiles} unique files — showing top {Math.min(heatmapData.files?.length || 0, 20)} most changed
              </p>
              <HeatmapGrid files={heatmapData.files?.slice(0, 20) || []} />
              <div style={{ display: "flex", gap: 20, marginTop: 14, fontSize: "0.65rem", fontFamily: "var(--mono)", color: "rgba(233,213,255,0.5)", justifyContent: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#4ade80", display: "inline-block" }} /> Low frequency</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#facc15", display: "inline-block" }} /> Moderate</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#f87171", display: "inline-block" }} /> High frequency</span>
              </div>
            </div>
          )}

          {/* No metrics message */}
          {!Object.values(metrics).some(v => v) && (
            <div className="metric-card">
              <h2>No Metrics Available</h2>
              <p>This report does not contain any metric data.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}