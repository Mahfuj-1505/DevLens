import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { compareReports, fetchReports } from "../api";
import { User } from 'lucide-react';

export default function ComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [leftId, setLeftId] = useState(searchParams.get("left") || "");
  const [rightId, setRightId] = useState(searchParams.get("right") || "");
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState("");

  const selectedLeft = useMemo(
    () => reports.find((report) => report.id === leftId),
    [reports, leftId]
  );
  const selectedRight = useMemo(
    () => reports.find((report) => report.id === rightId),
    [reports, rightId]
  );

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
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchReports()
      .then((data) => setReports(data))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (leftId && rightId && reports.length > 0) {
      runCompare();
    }
  }, [leftId, rightId, reports]);

  const renderReport = (report, title) => (
    <div style={{ flex: 1, minWidth: 300, border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
      <h3>{title}</h3>
      <p><strong>User:</strong> {report.userEmail}</p>
      <p><strong>Repository:</strong> {report.repository}</p>
      <p><strong>SPL:</strong> {report.spl || "N/A"}</p>
      <div>
        <h4>Metrics:</h4>
        {report.metrics ? (
          <ul>
            {Object.entries(report.metrics).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
              </li>
            ))}
          </ul>
        ) : (
          <p>No metrics available</p>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2>Teacher Report Comparison</h2>
        <button onClick={() => navigate("/profile")} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <User size={24} />
        </button>
      </div>
      <button onClick={() => navigate("/home")} style={{ marginBottom: 12 }}>Back to Home</button>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!reports.length && !error && (
        <p>No reports available yet. A teacher can compare reports after students have saved them.</p>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <select value={leftId} onChange={(e) => setLeftId(e.target.value)}>
          <option value="">Select left report</option>
          {reports.map((r) => (
            <option key={r.id} value={r.id}>
              {r.userEmail} | batch {r.batch ?? "N/A"} | {r.repository}
            </option>
          ))}
        </select>
        <select value={rightId} onChange={(e) => setRightId(e.target.value)}>
          <option value="">Select right report</option>
          {reports.map((r) => (
            <option key={r.id} value={r.id}>
              {r.userEmail} | batch {r.batch ?? "N/A"} | {r.repository}
            </option>
          ))}
        </select>
        <button onClick={runCompare}>Compare</button>
      </div>

      {comparison && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {renderReport(comparison.left, "Left")}
          {renderReport(comparison.right, "Right")}
        </div>
      )}

      {!comparison && selectedLeft && selectedRight && (
        <p>Ready to compare selected reports.</p>
      )}
    </div>
  );
}
