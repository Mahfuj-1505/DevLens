import React from "react";

export default function HeatmapGrid({ files }) {
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
        {sorted.filter((b) => hovered?.i !== b.i).map((b) => (
          <g key={b.i} transform={`translate(${b.x}, ${b.y})`} onMouseEnter={() => setHovered(b)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
            <circle r={b.r} fill={b.color} opacity={0.78} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
            {b.r >= 28 && (
              <text textAnchor="middle" dy="3" fontSize={7} fill="rgba(0,0,0,0.85)" fontFamily="monospace" fontWeight="700" style={{ pointerEvents: "none" }}>
                {(() => { const fname = b.file.split("/").pop(); return fname.length > 9 ? fname.slice(0, 7) + "…" : fname; })()}
              </text>
            )}
          </g>
        ))}
        {sorted.filter((b) => hovered?.i === b.i).map((b) => (
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