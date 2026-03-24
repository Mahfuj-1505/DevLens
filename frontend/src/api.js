const api = {
    baseURL: "http://127.0.0.1:8000",
    // baseURL: "https://fastapiproject-2-6a5u.onrender.com",
};

export {api};

export async function analyzeGithubRepo(githubUrl) {
  const response = await fetch(`${api.baseURL}/analysis/github`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ githubUrl }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to analyze repository");
  }

  return response.json();
}

export async function analyzeHeatmap(githubUrl) {
  const response = await fetch(
    `${api.baseURL}/repositories/heatmap?githubUrl=${encodeURIComponent(githubUrl)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch heatmap");
  }

  return response.json();
}

export async function analyzeCommits(githubUrl) {
  const response = await fetch(
    `${api.baseURL}/repositories/commits?githubUrl=${encodeURIComponent(githubUrl)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to analyze commits");
  }

  return response.json();
}

export async function fetchMetrics({ owner, repo, branch, from, to }) {
  await new Promise((r) => setTimeout(r, 400));

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

export async function analyzeOwnership(githubUrl) {
  const response = await fetch(
    `${api.baseURL}/repositories/ownership?githubUrl=${encodeURIComponent(githubUrl)}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch ownership data");
  }
  return response.json();
}

export async function analyzeIssues(githubUrl) {
  const response = await fetch(
    `${api.baseURL}/repositories/issues?githubUrl=${encodeURIComponent(githubUrl)}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch issues data");
  }
  return response.json();
}

export async function analyzeChurn(githubUrl) {
  const response = await fetch(
    `${api.baseURL}/repositories/churn?githubUrl=${encodeURIComponent(githubUrl)}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch churn data");
  }
  return response.json();
}