import React from "react";

export default function AIUsageGauge({ percent, topFiles = [] }) {
  const pct = Math.round(percent * 100);
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ width: 96, height: 96, position: "relative" }}>
        <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%" }}>
          <path d="M18 2a16 16 0 1 0 0 32 16 16 0 0 0 0-32" fill="#e6eef9" />
          <path
            d="M18 2a16 16 0 1 0 0 32 16 16 0 0 0 0-32"
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="6" fill="#0f172a">
            {pct}%
          </text>
        </svg>
      </div>
      <div>
        <div style={{ fontWeight: 700 }}>AI-generated code</div>
        <div style={{ fontSize: 15, color: "#475569" }}>{pct}% of repo estimated AI</div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>Top files</div>
          <ul style={{ margin: "6px 0 0 12px", padding: 0 }}>
            {topFiles.slice(0, 3).map((f) => (
              <li key={f.path} style={{ fontSize: 13 }}>{f.path} <span style={{color:'#64748b'}}>({Math.round(f.score*100)}%)</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}