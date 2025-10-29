import React from "react";

export default function NamingQuality({ score, items }) {
  return (
    <div style={{ padding: 8 }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>Naming quality</div>
      <div style={{ fontSize: 14, color: "#334155" }}>Overall score: {(score*100).toFixed(0)}%</div>
      <div style={{ marginTop: 8 }}>
        {items.map((it) => (
          <div key={it.path} style={{ borderTop: "1px solid #e6edf3", padding: "8px 0" }}>
            <div style={{ fontWeight: 600 }}>{it.path}</div>
            <div style={{ fontSize: 13, color: "#475569" }}>score: {(it.score*100).toFixed(0)}%</div>
            {it.issues?.length ? <ul style={{ margin: "6px 0 0 18px" }}>{it.issues.map((x,i)=><li key={i} style={{fontSize:13}}>{x}</li>)}</ul> : null}
          </div>
        ))}
      </div>
    </div>
  );
}