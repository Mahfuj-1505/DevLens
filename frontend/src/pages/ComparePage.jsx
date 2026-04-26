import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { compareReports, fetchReports } from "../api";
import { User } from 'lucide-react';
import "../ResultPage.css";
import "./ComparePage.css";

export default function ComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [leftId, setLeftId] = useState(searchParams.get("left") || "");
  const [rightId, setRightId] = useState(searchParams.get("right") || "");
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState("");

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

  const getSummaryEntries = (group) => {
    if (!group || typeof group !== "object") return [];
    const source = group.summary || group;
    return Object.entries(source)
      .filter(([, value]) => typeof value !== "object")
      .map(([key, value]) => ({ key, value }));
  };

  const renderMetricGroup = (groupName, groupValue) => {
    const summaryEntries = getSummaryEntries(groupValue);
    return (
      <div className="metric-card" key={groupName}>
        <h2>{groupName.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</h2>
        {summaryEntries.length > 0 ? (
          <div className="stat-grid">
            {summaryEntries.map(({ key, value }) => (
              <div className="stat-item" key={key}>
                <div className="stat-label">{key.replace(/([A-Z])/g, " $1")}</div>
                <div className={`stat-value ${typeof value === 'number' ? (value > 0 ? 'green' : 'red') : 'accent'}`}>
                  {String(value)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>No summary details available.</p>
        )}
      </div>
    );
  };

  const renderReport = (report, title) => (
    <div className="compare-report-container">
      <div className="metric-card report-summary-card">
        <h2>{title}</h2>
        <div className="stat-grid report-summary-grid">
          <div className="stat-item">
            <div className="stat-label">User</div>
            <div className="stat-value accent">{report.userEmail || report.user || "Unknown"}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Repository</div>
            <div className="stat-value accent">{report.repository || report.repo || "Unknown"}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">SPL</div>
            <div className="stat-value accent">{report.spl || "N/A"}</div>
          </div>
        </div>
      </div>
      <div className="metric-card metrics-card">
        <h2>Metrics</h2>
        {report.metrics ? (
          <div className="metric-groups">
            {Object.entries(report.metrics).map(([key, value]) => renderMetricGroup(key, value))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>No metrics available</p>
        )}
      </div>
    </div>
  );

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
            <div className="compare-select-group">
              <label htmlFor="left-report">Left report</label>
              <select
                id="left-report"
                value={leftId}
                onChange={(e) => setLeftId(e.target.value)}
              >
                <option value="">Choose left report</option>
                {reports.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.repository || report.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="compare-select-group">
              <label htmlFor="right-report">Right report</label>
              <select
                id="right-report"
                value={rightId}
                onChange={(e) => setRightId(e.target.value)}
              >
                <option value="">Choose right report</option>
                {reports.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.repository || report.id}
                  </option>
                ))}
              </select>
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
