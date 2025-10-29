import React from "react";
import "./metric-card.css"; // optional, create if you want styles

export default function MetricCard({ title, value, sub, onClick, children }) {
  return (
    <div
      className="metric-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick?.();
      }}
      style={{
        background: "#fff",
        padding: 12,
        borderRadius: 10,
        boxShadow: "0 1px 3px rgba(2,6,23,0.06)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: "black" }}>{title}</div>
        <div style={{ fontWeight: 800, color: "#4f46e5", fontSize: 18 }}>{value}</div>
      </div>
      {sub ? <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{sub}</div> : null}
      <div>{children}</div>
    </div>
  );
}