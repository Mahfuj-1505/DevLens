import React, { useEffect, useRef, useState } from "react";
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
