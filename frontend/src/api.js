const api = {
    baseURL: "http://127.0.0.1:8000",
    // baseURL: "https://fastapiproject-2-6a5u.onrender.com",
};

export {api};



// A minimal API wrapper — currently returns mock data.
// Replace fetchMetrics() with a real call to your backend that returns
// the aggregated JSON described in the README.
export async function fetchMetrics({ owner, repo, branch, from, to }) {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 400));

  // Mock data (trimmed)
  const mock = {
    repo: `${owner}/${repo}`,
    timeRange: { from: from || "2025-09-01", to: to || "2025-10-26" },
    metrics: {
      loc: {
        total: 12345,
        byLang: [
          { lang: "JavaScript", loc: 8000 },
          { lang: "TypeScript", loc: 2500 },
          { lang: "CSS", loc: 1000 },
          { lang: "Other", loc: 845 }
        ],
        timeseries: Array.from({ length: 30 }).map((_, i) => ({
          date: `2025-09-${String(i + 1).padStart(2, "0")}`,
          loc: 12000 + Math.round(50 * Math.sin(i / 3)) + i
        }))
      },
      complexity: {
        totalScore: 712,
        byFile: [
          { path: "src/App.jsx", functions: 6, complexity: 40 },
          { path: "src/components/BigComponent.jsx", functions: 12, complexity: 120 }
        ],
        timeseries: Array.from({ length: 30 }).map((_, i) => ({
          date: `2025-09-${String(i + 1).padStart(2, "0")}`,
          score: 700 + Math.round(10 * Math.cos(i / 4))
        }))
      },
      commits: {
        count: 312,
        meaningfulnessScore: 0.72,
        perCommit: [
          { sha: "a1", author: "alice", date: "2025-10-25", changes: 24, message: "feat: add X" },
          { sha: "b2", author: "bob", date: "2025-10-24", changes: 4, message: "fix: Y" }
        ],
        activity: Array.from({ length: 30 }).map((_, i) => ({
          date: `2025-09-${String(i + 1).padStart(2, "0")}`,
          commits: Math.max(0, Math.round(3 + 2 * Math.sin(i / 4)))
        }))
      },
      aiPercentage: 0.18,
      namingQuality: {
        score: 0.83,
        byFile: [
          { path: "src/utils/helpers.js", score: 0.6, issues: ["vague name: helper"] },
          { path: "src/components/Button.jsx", score: 0.95, issues: [] }
        ]
      },
      duplicates: { totalDuplications: 14, byFile: [] }
    }
  };

  return mock;
}