import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function activityColor(count, maxCount) {
  if (count <= 0) return "#1f1436";
  if (maxCount <= 0) return "#4ade80";

  const ratio = count / maxCount;
  if (ratio < 0.25) return "#1e7f4f";
  if (ratio < 0.5) return "#22c55e";
  if (ratio < 0.75) return "#86efac";
  return "#dcfce7";
}

export default function CommitActivity({ activityData }) {
  const daily = activityData?.dailyActivity || [];
  const weekly = activityData?.weeklyActivity || [];
  const maxDaily = activityData?.insights?.maxDailyCommits || 0;

  const weekMap = {};
  daily.forEach((entry) => {
    const date = new Date(entry.date);
    const monday = new Date(date);
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    monday.setDate(date.getDate() + mondayOffset);
    const weekKey = monday.toISOString().slice(0, 10);

    if (!weekMap[weekKey]) {
      weekMap[weekKey] = new Array(7).fill(0);
    }
    weekMap[weekKey][entry.weekday] = entry.count;
  });

  const weeks = Object.keys(weekMap).sort();

  if (!daily.length) {
    return (
      <div style={{ fontSize: "0.78rem", color: "rgba(233,213,255,0.7)", fontFamily: "var(--mono)" }}>
        No commit activity found for the selected period.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ width: "100%", height: 170 }}>
        <ResponsiveContainer>
          <BarChart data={weekly}>
            <XAxis dataKey="weekStart" tick={{ fontSize: 10, fill: "#c4b5fd" }} tickFormatter={(value) => value.slice(5)} />
            <YAxis tick={{ fontSize: 10, fill: "#c4b5fd" }} />
            <Tooltip
              formatter={(value) => [`${value} commits`, "Week"]}
              labelFormatter={(label) => `Week of ${label}`}
              contentStyle={{
                background: "rgba(20,10,40,0.95)",
                border: "1px solid rgba(168,85,247,0.3)",
                borderRadius: 8,
                color: "#e9d5ff",
                fontFamily: "monospace",
                fontSize: 12,
              }}
            />
            <Bar dataKey="commits" fill="#22c55e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ display: "grid", gridTemplateRows: "repeat(7, 12px)", gap: 4, alignItems: "center", marginTop: 14 }}>
          {DAY_LABELS.map((label) => (
            <div key={label} style={{ fontSize: "0.6rem", color: "rgba(233,213,255,0.6)", fontFamily: "var(--mono)" }}>
              {label}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "12px", gridTemplateRows: "repeat(7, 12px)", gap: 4 }}>
          {weeks.map((weekKey) =>
            weekMap[weekKey].map((count, dayIndex) => (
              <div
                key={`${weekKey}-${dayIndex}`}
                title={`${weekKey} (${DAY_LABELS[dayIndex]}): ${count} commits`}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: activityColor(count, maxDaily),
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            ))
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, fontSize: "0.65rem", color: "rgba(233,213,255,0.7)", fontFamily: "var(--mono)" }}>
        <span>Total: {activityData.totalCommits} commits</span>
        <span>Avg/week: {activityData.insights?.averageWeeklyCommits}</span>
        <span>Peak/day: {activityData.insights?.maxDailyCommits}</span>
      </div>
    </div>
  );
}