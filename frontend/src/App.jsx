import React, { useEffect, useState } from "react";
import { fetchMetrics } from "./api";
import MetricCard from "./components/MetricCard";
import LOCChart from "./components/LOCChar";
import ComplexityTreemap from "./components/ComplexityTreemap";
import CommitActivity from "./components/CommitActivity";
import AIUsageGauge from "./components/AIUsageGauge";
import NamingQuality from "./components/NamingQuality";
import ChatBox from "./components/ChatBox"
import "./index.css";


export default function App() {
  const [data, setData] = useState(null);
  const [owner] = useState("example");
  const [repo] = useState("demo-repo");
  useEffect(() => {
    let mounted = true;
    fetchMetrics({ owner, repo }).then((d) => mounted && setData(d));
    return () => (mounted = false);
  }, [owner, repo]);

  if (!data) return <div className="app-shell">Loading metrics…</div>;

  const { metrics } = data;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Repo Metrics — {data.repo}</h1>
        <div className="controls">
        </div>
      </header>

      <main className="grid">
        {/* Left: metrics and overview (about 60-70% width) */}
        <div className="left">
          <div className="col-3">
          <MetricCard title="Lines of Code" value={metrics.loc.total.toLocaleString()} sub={`${metrics.loc.byLang[0].lang} dominant`}>
            <LOCChart series={metrics.loc.timeseries} />
          </MetricCard>

          <MetricCard title="Code Complexity" value={metrics.complexity.totalScore} sub={`${metrics.complexity.byFile.length} files`}>
            {/* small sparkline using complexity timeseries */}
            <LOCChart series={metrics.complexity.timeseries.map(t => ({ date: t.date, loc: t.score }))} />
          </MetricCard>

          <MetricCard title="Commits" value={metrics.commits.count} sub={`Meaningfulness ${Math.round(metrics.commits.meaningfulnessScore*100)}%`}>
            <CommitActivity series={metrics.commits.activity} />
          </MetricCard>
          </div>

          <div className="col-9">
          <section className="card">
            <h2>LOC over time</h2>
            <LOCChart series={metrics.loc.timeseries} />
          </section>

          <section className="card">
            <h2>Complexity by file</h2>
            <ComplexityTreemap items={metrics.complexity.byFile} onDrill={(f)=>alert(`Drill into ${f.path}`)} />
          </section>

          <div style={{ display: "flex", gap: 16 }}>
            <section className="card" style={{ flex: 1 }}>
              <AIUsageGauge percent={metrics.aiPercentage} topFiles={[{path: "src/foo.js", score: 0.9}, {path:"src/bar.js", score:0.7}]} />
            </section>

            <section className="card" style={{ flex: 1 }}>
              <NamingQuality score={metrics.namingQuality.score} items={metrics.namingQuality.byFile} />
            </section>
          </div>
          </div>
        </div>

        {/* Right: chat box (about 30-35% width) */}
        <div className="right">
          <ChatBox />
        </div>
      </main>
    </div>
  );
}