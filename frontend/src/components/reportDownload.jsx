import React, { useState } from "react";

export default function ReportDownload({
  repoName,
  churnData,
  commitData,
  locData,
  ownershipData,
  issuesData,
}) {
  const [busy, setBusy] = useState(false);

  const now = () => new Date().toLocaleString();
  const safeRepoName = repoName?.replace("/", "-") || "repo";

  function buildCSV() {
    const rows = [];
    rows.push(["DevLens Report", repoName]);
    rows.push(["Generated", now()]);
    rows.push([]);

    if (locData) {
      rows.push(["=== Lines of Code ==="]);
      rows.push(["Total LOC", locData.summary.totalLoc]);
      rows.push(["Total Files", locData.summary.totalFiles]);
      rows.push(["Functions", locData.summary.totalFunctions]);
      rows.push(["Comments", locData.summary.totalComments]);
      rows.push(["Languages", locData.summary.languages?.join(", ")]);
      rows.push([]);
    }

    if (commitData) {
      rows.push(["=== Commit Summary ==="]);
      rows.push(["Total Commits", commitData.totalCommits]);
      rows.push(["Total Additions", commitData.summary.totalAdditions]);
      rows.push(["Total Deletions", commitData.summary.totalDeletions]);
      rows.push(["Avg Additions/Commit", commitData.summary.averageAdditionsPerCommit]);
      rows.push(["Avg Deletions/Commit", commitData.summary.averageDeletionsPerCommit]);
      rows.push(["Avg Files/Commit", commitData.summary.averageFilesChangedPerCommit]);
      rows.push([]);
    }

    if (ownershipData) {
      rows.push(["=== Code Ownership ==="]);
      rows.push(["Total Contributors", ownershipData.totalContributors]);
      rows.push(["Total Commits", ownershipData.totalCommits]);
      rows.push([]);
      rows.push(["Author", "Commits", "Lines Added"]);
      ownershipData.contributors.forEach((c) =>
        rows.push([c.author, c.commits, c.linesAdded])
      );
      rows.push([]);
    }

    if (issuesData) {
      rows.push(["=== Issue Tracking ==="]);
      rows.push(["Total Issues", issuesData.totalIssues]);
      rows.push(["Open Issues", issuesData.openIssues]);
      rows.push(["Closed Issues", issuesData.closedIssues]);
      rows.push([]);
    }

    if (churnData) {
      rows.push(["=== Churn Rate Summary ==="]);
      rows.push(["Overall Churn Rate (%)", churnData.summary.churnRate]);
      rows.push(["Total Additions", churnData.summary.totalAdditions]);
      rows.push(["Total Deletions", churnData.summary.totalDeletions]);
      rows.push(["Net Lines", churnData.summary.netLines]);
      rows.push([]);
      rows.push(["File", "Additions", "Deletions", "Commits", "Churn Rate (%)"]);
      churnData.files.forEach((f) =>
        rows.push([f.file, f.additions, f.deletions, f.commits, f.churnRate])
      );
    }

    return rows
      .map((r) =>
        r.map((cell) =>
          cell === undefined || cell === null
            ? ""
            : String(cell).includes(",")
            ? `"${cell}"`
            : cell
        ).join(",")
      )
      .join("\n");
  }

  function downloadCSV() {
    setBusy(true);
    try {
      const csv = buildCSV();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeRepoName}-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  function downloadPDF() {
    setBusy(true);

    const style = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Courier New', monospace; background: #fff; color: #111; padding: 32px; font-size: 12px; }
        h1 { font-size: 20px; margin-bottom: 4px; color: #4c1d95; }
        .meta { color: #666; font-size: 11px; margin-bottom: 28px; }
        h2 { font-size: 14px; margin: 24px 0 10px; padding-bottom: 4px; border-bottom: 1px solid #d1c4e9; color: #5b21b6; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 8px; }
        .stat { background: #f5f3ff; border-radius: 6px; padding: 10px 14px; }
        .stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #7c3aed; margin-bottom: 4px; }
        .stat-value { font-size: 18px; font-weight: 700; color: #1e1b4b; }
        .green { color: #15803d; }
        .red { color: #b91c1c; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
        th { text-align: left; padding: 6px 10px; background: #ede9fe; color: #4c1d95; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
        td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; }
        tr:nth-child(even) td { background: #fafafa; }
        .churn-high { color: #b91c1c; font-weight: 700; }
        .churn-mid { color: #92400e; font-weight: 700; }
        .churn-low { color: #166534; font-weight: 700; }
        .footer { margin-top: 36px; font-size: 10px; color: #9ca3af; text-align: center; }
        @media print { body { padding: 18px; } }
      </style>
    `;

    const stat = (label, value, cls = "") =>
      `<div class="stat"><div class="stat-label">${label}</div><div class="stat-value ${cls}">${value ?? "—"}</div></div>`;

    const churnColor = (rate) =>
      rate > 80 ? "churn-high" : rate > 40 ? "churn-mid" : "churn-low";

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeRepoName} Report</title>${style}</head><body>`;
    html += `<h1>${repoName} — DevLens Report</h1>`;
    html += `<div class="meta">Generated: ${now()}</div>`;

    if (locData) {
      html += `<h2>Lines of Code</h2><div class="grid">
        ${stat("Total LOC", locData.summary.totalLoc?.toLocaleString())}
        ${stat("Files", locData.summary.totalFiles)}
        ${stat("Functions", locData.summary.totalFunctions)}
        ${stat("Comments", locData.summary.totalComments)}
      </div>`;
      if (locData.summary.languages?.length) {
        html += `<p style="font-size:11px;color:#555;margin-top:6px">Languages: ${locData.summary.languages.join(", ")}</p>`;
      }
    }

    if (commitData) {
      html += `<h2>Commit Summary</h2><div class="grid">
        ${stat("Total Commits", commitData.totalCommits)}
        ${stat("Total Additions", "+" + commitData.summary.totalAdditions?.toLocaleString(), "green")}
        ${stat("Total Deletions", "-" + commitData.summary.totalDeletions?.toLocaleString(), "red")}
        ${stat("Avg +/Commit", "+" + commitData.summary.averageAdditionsPerCommit, "green")}
        ${stat("Avg -/Commit", "-" + commitData.summary.averageDeletionsPerCommit, "red")}
        ${stat("Avg Files/Commit", commitData.summary.averageFilesChangedPerCommit)}
      </div>`;
    }

    if (ownershipData) {
      html += `<h2>Code Ownership</h2>
        <p style="font-size:11px;color:#555;margin-bottom:8px">${ownershipData.totalContributors} contributors · ${ownershipData.totalCommits} total commits</p>
        <table><thead><tr><th>Author</th><th>Commits</th><th>Lines Added</th></tr></thead><tbody>
        ${ownershipData.contributors
          .map((c) => `<tr><td>${c.author}</td><td>${c.commits}</td><td>${c.linesAdded?.toLocaleString()}</td></tr>`)
          .join("")}
        </tbody></table>`;
    }

    if (issuesData) {
      html += `<h2>Issue Tracking</h2><div class="grid">
        ${stat("Total Issues", issuesData.totalIssues)}
        ${stat("Open", issuesData.openIssues, "red")}
        ${stat("Closed", issuesData.closedIssues, "green")}
      </div>`;
    }

    if (churnData) {
      html += `<h2>Churn Rate</h2><div class="grid">
        ${stat("Overall Churn Rate", churnData.summary.churnRate + "%")}
        ${stat("Total Additions", "+" + churnData.summary.totalAdditions?.toLocaleString(), "green")}
        ${stat("Total Deletions", "-" + churnData.summary.totalDeletions?.toLocaleString(), "red")}
        ${stat("Net Lines", churnData.summary.netLines?.toLocaleString())}
      </div>
      <table><thead><tr>
        <th>File</th>
        <th style="text-align:right">Additions</th>
        <th style="text-align:right">Deletions</th>
        <th style="text-align:right">Commits</th>
        <th style="text-align:right">Churn Rate</th>
      </tr></thead><tbody>
      ${churnData.files
        .map((f) => `<tr>
          <td title="${f.file}">${f.file}</td>
          <td style="text-align:right;color:#15803d">+${f.additions.toLocaleString()}</td>
          <td style="text-align:right;color:#b91c1c">-${f.deletions.toLocaleString()}</td>
          <td style="text-align:right">${f.commits}</td>
          <td style="text-align:right" class="${churnColor(f.churnRate)}">${f.churnRate}%</td>
        </tr>`)
        .join("")}
      </tbody></table>`;
    }

    html += `<div class="footer">DevLens · ${repoName} · ${now()}</div></body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.print();
      setBusy(false);
    };
  }

  const hasData = churnData || commitData || locData || ownershipData || issuesData;
  if (!hasData) return null;

  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 18px",
    borderRadius: 8,
    fontSize: "0.78rem",
    fontFamily: "var(--mono, monospace)",
    fontWeight: 600,
    cursor: busy ? "not-allowed" : "pointer",
    opacity: busy ? 0.6 : 1,
    transition: "all 0.2s",
    border: "1px solid",
  };

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "20px 0 4px" }}>
      <span style={{ fontSize: "0.68rem", fontFamily: "var(--mono)", color: "rgba(233,213,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Download Report
      </span>
      <button
        onClick={downloadPDF}
        disabled={busy}
        style={{ ...btnBase, background: "rgba(124,58,237,0.15)", borderColor: "rgba(124,58,237,0.5)", color: "#c4b5fd" }}
        onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = "rgba(124,58,237,0.3)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.15)"; }}
      >
        ⬇ PDF Report
      </button>
      <button
        onClick={downloadCSV}
        disabled={busy}
        style={{ ...btnBase, background: "rgba(74,222,128,0.1)", borderColor: "rgba(74,222,128,0.4)", color: "#4ade80" }}
        onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = "rgba(74,222,128,0.22)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(74,222,128,0.1)"; }}
      >
        ⬇ CSV Export
      </button>
    </div>
  );
}