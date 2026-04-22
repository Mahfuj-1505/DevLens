const api = {
    baseURL: "http://127.0.0.1:8000",
    // baseURL: "https://fastapiproject-2-6a5u.onrender.com",
};

export {api};

function buildSourcePayload(source) {
  if (typeof source === "string") {
    return { sourceType: "github", githubUrl: source };
  }

  const sourceType = source?.sourceType === "local" ? "local" : "github";
  return {
    sourceType,
    githubUrl: sourceType === "github" ? source?.value || source?.githubUrl || "" : "",
    localPath: sourceType === "local" ? source?.value || source?.localPath || "" : "",
  };
}

function buildSourceQuery(source) {
  const payload = buildSourcePayload(source);
  const params = new URLSearchParams({ sourceType: payload.sourceType });

  if (payload.sourceType === "github") {
    params.set("githubUrl", payload.githubUrl);
  } else {
    params.set("localPath", payload.localPath);
  }

  return params.toString();
}

export async function analyzeGithubRepo(source) {
  const payload = buildSourcePayload(source);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300000); // 5 minutes
  
  try {
    const response = await fetch(`${api.baseURL}/analysis/github`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to analyze repository");
    }

    return response.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Analysis timed out after 5 minutes. The repository may be too large or the server is overloaded.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeHeatmap(source) {
  const query = buildSourceQuery(source);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 minutes
  
  try {
    const response = await fetch(
      `${api.baseURL}/repositories/heatmap?${query}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch heatmap");
    }

    return response.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Heatmap fetch timed out after 2 minutes.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeCommits(source) {
  const query = buildSourceQuery(source);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 minutes
  
  try {
    const response = await fetch(
      `${api.baseURL}/repositories/commits?${query}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to analyze commits");
    }

    return response.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Commit analysis timed out after 2 minutes.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
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

export async function analyzeOwnership(source) {
  const query = buildSourceQuery(source);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 minutes
  
  try {
    const response = await fetch(
      `${api.baseURL}/repositories/ownership?${query}`,
      { method: "GET", headers: { "Content-Type": "application/json" }, signal: controller.signal }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch ownership data");
    }
    return response.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Ownership fetch timed out after 2 minutes.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeIssues(source) {
  const query = buildSourceQuery(source);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 minutes
  
  try {
    const response = await fetch(
      `${api.baseURL}/repositories/issues?${query}`,
      { method: "GET", headers: { "Content-Type": "application/json" }, signal: controller.signal }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch issues data");
    }
    return response.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Issues fetch timed out after 2 minutes.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeChurn(source) {
  const query = buildSourceQuery(source);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 minutes
  
  try {
    const response = await fetch(
      `${api.baseURL}/repositories/churn?${query}`,
      { method: "GET", headers: { "Content-Type": "application/json" }, signal: controller.signal }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch churn data");
    }
    return response.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Churn fetch timed out after 2 minutes.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeCommitMessageQuality(source) {
  const query = buildSourceQuery(source);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 minutes
  
  try {
    const response = await fetch(
      `${api.baseURL}/repositories/commit-message-quality?${query}`,
      { method: "GET", headers: { "Content-Type": "application/json" }, signal: controller.signal }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch commit message quality data");
    }
    return response.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Commit message quality fetch timed out after 2 minutes.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeCyclomaticComplexity(source, { topN = 10, threshold = 10 } = {}) {
  const query = `${buildSourceQuery(source)}&topN=${topN}&threshold=${threshold}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000); // 3 minutes

  try {
    const response = await fetch(
      `${api.baseURL}/repositories/cyclomatic-complexity?${query}`,
      { method: "GET", headers: { "Content-Type": "application/json" }, signal: controller.signal }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch cyclomatic complexity data");
    }
    return response.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Cyclomatic complexity analysis timed out after 3 minutes.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeCommitActivity(source, { weeks = 26 } = {}) {
  const query = `${buildSourceQuery(source)}&weeks=${weeks}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 minutes

  try {
    const response = await fetch(
      `${api.baseURL}/repositories/commit-activity?${query}`,
      { method: "GET", headers: { "Content-Type": "application/json" }, signal: controller.signal }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch commit activity data");
    }
    return response.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Commit activity fetch timed out after 2 minutes.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}