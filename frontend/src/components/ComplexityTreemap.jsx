import React from "react";

/*
Simple placeholder treemap: in production, use d3 or @nivo/treemap to render nicely.
This component demonstrates structure and click handling for drilldowns.
*/
export default function ComplexityTreemap({ items, onDrill }) {
  // items: [{ path, complexity }, ...]
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map((it) => (
        <div
          key={it.path}
          style={{
            minWidth: 160,
            height: 80,
            background: `rgba(99,102,241,${Math.min(0.9, 0.25 + it.complexity / 200)})`,
            color: "white",
            padding: 8,
            borderRadius: 8,
            cursor: "pointer",
          }}
          onClick={() => onDrill?.(it)}
        >
          <div style={{ fontSize: 12, fontWeight: 600 }}>{it.path.split("/").pop()}</div>
          <div style={{ fontSize: 12 }}>{it.complexity} complexity</div>
        </div>
      ))}
    </div>
  );
}