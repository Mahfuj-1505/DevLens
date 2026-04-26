import React, { useState } from "react";
import html2canvas from "html2canvas";

export default function ReportDownload({
  repoName,
  churnData,
  commitData,
  locData,
  ownershipData,
  issuesData,
  heatmapData,
  commitMessageQualityData,
  cyclomaticData,
  commitActivityData,
  classDesignData,
  visibleMetrics = {},
}) {
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const now = () => new Date().toLocaleString();
  const safeRepoName = repoName?.replace("/", "-") || "repo";

  const C = {
    bg: "#ffffff",
    surface: "#f4f0fb",
    border: "#d4c6f0",
    text: "#1a0a2e",
    muted: "#6b5a8a",
    accent: "#7c3aed",
    green: "#16a34a",
    red: "#dc2626",
    yellow: "#b45309",
    rowAlt: "#faf7ff",
  };

  // ─── CSV ─────────────────────────────────────────────────────────────────────
  function buildCSV() {
    const rows = [];
    rows.push(["DevLens Report", repoName]);
    rows.push(["Generated", now()]);
    rows.push([]);
    const esc = (v) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    if (visibleMetrics.loc && locData) {
      rows.push(["=== Lines of Code ==="]);
      rows.push(["Total LOC", locData.summary.totalLoc]);
      rows.push(["Total Files", locData.summary.totalFiles]);
      rows.push(["Functions", locData.summary.totalFunctions]);
      rows.push(["Comments", locData.summary.totalComments]);
      rows.push(["Languages", locData.summary.languages?.join(", ")]);
      rows.push([]);
    }
    if (visibleMetrics.commits && commitData) {
      rows.push(["=== Commit Summary ==="]);
      rows.push(["Total Commits", commitData.totalCommits]);
      rows.push(["Total Additions", commitData.summary.totalAdditions]);
      rows.push(["Total Deletions", commitData.summary.totalDeletions]);
      rows.push(["Avg Additions/Commit", commitData.summary.averageAdditionsPerCommit]);
      rows.push(["Avg Deletions/Commit", commitData.summary.averageDeletionsPerCommit]);
      rows.push(["Avg Files/Commit", commitData.summary.averageFilesChangedPerCommit]);
      rows.push([]);
    }
    if (visibleMetrics.ownership && ownershipData) {
      rows.push(["=== Code Ownership ==="]);
      rows.push(["Total Contributors", ownershipData.totalContributors]);
      rows.push(["Total Commits", ownershipData.totalCommits]);
      rows.push([]);
      rows.push(["Author", "Commits", "Lines Added"]);
      ownershipData.contributors.forEach((c) => rows.push([c.author, c.commits, c.linesAdded]));
      rows.push([]);
    }
    if (visibleMetrics.issues && issuesData) {
      rows.push(["=== Issue Tracking ==="]);
      rows.push(["Total Issues", issuesData.totalIssues]);
      rows.push(["Open Issues", issuesData.openIssues]);
      rows.push(["Closed Issues", issuesData.closedIssues]);
      rows.push([]);
    }
    if (visibleMetrics.commitMessageQuality && commitMessageQualityData) {
      rows.push(["=== Commit Message Quality ==="]);
      rows.push(["Average Quality (%)", commitMessageQualityData.averageQuality]);
      rows.push(["Total Commits", commitMessageQualityData.totalCommits]);
      rows.push([]);
      rows.push(["SHA", "Message", "Quality (%)", "Violations"]);
      (commitMessageQualityData.worstMessages || []).forEach((m) =>
        rows.push([m.sha, m.message || "(empty subject)", m.qualityScore, m.violationCount])
      );
      rows.push([]);
    }
    if (visibleMetrics.cyclomatic && cyclomaticData) {
      rows.push(["=== Cyclomatic Complexity ==="]);
      rows.push(["Average Complexity", cyclomaticData.averageCyclomaticComplexity]);
      rows.push(["Files Scanned", cyclomaticData.totalFilesAnalyzed]);
      rows.push(["Functions Analyzed", cyclomaticData.totalFunctions]);
      rows.push([]);
    }
    if (visibleMetrics.churn && churnData) {
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
    if (visibleMetrics.classDesign && classDesignData) {
      rows.push(["=== Class & Component Design ==="]);
      rows.push(["Total Classes", classDesignData.summary.totalClasses]);
      rows.push([]);
    }
    return rows.map((r) => r.map(esc).join(",")).join("\n");
  }

  function downloadCSV() {
    setBusy(true);
    try {
      const blob = new Blob([buildCSV()], { type: "text/csv;charset=utf-8;" });
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

  // ─── Core capture helper ─────────────────────────────────────────────────────
  // waitMs: extra delay after scrollIntoView — increase for complex/canvas charts
  async function elementToDataURL(selector, waitMs = 120) {
    const el = typeof selector === "string"
      ? document.querySelector(selector)
      : selector;
    if (!el) return null;

    // Make sure the element is rendered and visible
    el.scrollIntoView({ behavior: "instant", block: "center" });
    await new Promise((r) => setTimeout(r, waitMs));

    // If the element has no painted area, bail early
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return null;

    const canvas = await html2canvas(el, {
      backgroundColor: null, // transparent — preserve the element's own colours
      scale: 2,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      logging: false,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      width: el.offsetWidth,
      height: el.offsetHeight,
      windowWidth: el.offsetWidth,
      windowHeight: el.offsetHeight,
    });

    // If the result is blank (all transparent), return null so callers can fallback
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasPixels = data.some((v, i) => i % 4 === 3 && v > 10); // any non-transparent pixel?
    if (!hasPixels) return null;

    return {
      dataURL: canvas.toDataURL("image/png"),
      w: el.offsetWidth,
      h: el.offsetHeight,
      ratio: el.offsetHeight / el.offsetWidth,
    };
  }

  // ─── jsPDF painter ───────────────────────────────────────────────────────────
  function makePainter(pdf) {
    const PW = pdf.internal.pageSize.getWidth();
    const PH = pdf.internal.pageSize.getHeight();
    const M = 14;
    const CW = PW - M * 2;
    let y = M;

    const newPageIfNeeded = (needed = 8) => {
      if (y + needed > PH - M) { pdf.addPage(); y = M; }
    };
    const setFont = (size, style = "normal", color = C.text) => {
      pdf.setFontSize(size);
      pdf.setFont("helvetica", style);
      pdf.setTextColor(color);
    };
    const fillRect = (x, ry, w, h, fill) => {
      pdf.setFillColor(fill);
      pdf.rect(x, ry, w, h, "F");
    };
    const strokeRect = (x, ry, w, h, stroke) => {
      pdf.setDrawColor(stroke);
      pdf.setLineWidth(0.3);
      pdf.rect(x, ry, w, h, "S");
    };
    const txt = (str, x, ty, opts = {}) => pdf.text(String(str ?? ""), x, ty, opts);

    return {
      pdf, M, CW, PW, PH,
      get y() { return y; },
      set y(v) { y = v; },
      newPageIfNeeded, setFont, fillRect, strokeRect, txt,
    };
  }

  function drawSectionHeader(p, title) {
    p.newPageIfNeeded(14);
    p.fillRect(p.M, p.y, p.CW, 9, C.surface);
    p.strokeRect(p.M, p.y, p.CW, 9, C.border);
    p.fillRect(p.M, p.y, 3, 9, C.accent);
    p.setFont(8, "bold", C.accent);
    p.txt(title.toUpperCase(), p.M + 7, p.y + 6.2);
    p.y += 13;
  }

  function drawStatGrid(p, items) {
    const cols = Math.min(items.length, 4);
    const cellW = p.CW / cols;
    const cellH = 17;
    const rows = Math.ceil(items.length / cols);
    p.newPageIfNeeded(rows * (cellH + 2) + 4);
    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = p.M + col * cellW;
      const ty = p.y + row * (cellH + 2);
      p.fillRect(x, ty, cellW - 1, cellH, C.surface);
      p.strokeRect(x, ty, cellW - 1, cellH, C.border);
      p.setFont(6, "normal", C.muted);
      p.txt(item.label, x + 3, ty + 5.5);
      p.setFont(11, "bold", item.color || C.accent);
      p.txt(String(item.value ?? "—"), x + 3, ty + 13.5);
    });
    p.y += rows * (cellH + 2) + 4;
  }

  function drawTable(p, headers, rows, colWidths) {
    const totalW = colWidths.reduce((a, b) => a + b, 0);
    const hdrH = 7;
    const rowH = 6.5;
    p.newPageIfNeeded(hdrH + rowH * 2 + 2);

    p.fillRect(p.M, p.y, totalW, hdrH, C.surface);
    p.strokeRect(p.M, p.y, totalW, hdrH, C.border);
    let cx = p.M;
    headers.forEach((h, i) => {
      p.setFont(6, "bold", C.muted);
      p.txt(h, cx + 2, p.y + 5, { maxWidth: colWidths[i] - 3 });
      cx += colWidths[i];
    });
    p.y += hdrH;

    rows.forEach((row, ri) => {
      p.newPageIfNeeded(rowH + 1);
      p.fillRect(p.M, p.y, totalW, rowH, ri % 2 === 0 ? C.rowAlt : C.bg);
      let cx2 = p.M;
      row.forEach((cell, ci) => {
        const isObj = typeof cell === "object" && cell !== null;
        const color = isObj ? (cell.color || C.text) : C.text;
        const val = isObj ? cell.value : cell;
        p.setFont(6, "normal", color);
        p.txt(String(val ?? ""), cx2 + 2, p.y + 4.5, { maxWidth: colWidths[ci] - 3 });
        cx2 += colWidths[ci];
      });
      p.y += rowH;
    });
    p.y += 5;
  }

  // Draw a chart by trying selectors in order — first non-null/non-blank wins.
  // fallbackSelectors lets you widen the capture to a parent card if the inner
  // element returns blank (e.g. CommitActivity renders outside normal flow).
  async function drawChart(p, selectors, maxH = 60, waitMs = 120) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    let result = null;
    for (const sel of list) {
      result = await elementToDataURL(sel, waitMs);
      if (result) break;
    }
    if (!result) {
      console.warn("All chart selectors returned blank:", list);
      return;
    }
    const imgW = p.CW;
    const imgH = Math.min(imgW * result.ratio, maxH);
    p.newPageIfNeeded(imgH + 6);
    p.strokeRect(p.M, p.y, p.CW, imgH, C.border);
    p.pdf.addImage(result.dataURL, "PNG", p.M, p.y, imgW, imgH);
    p.y += imgH + 6;
  }

  async function drawChartPair(p, selectorLeft, selectorRight, maxH = 65) {
    if (!selectorLeft && !selectorRight) return;
    try {
      const halfW = (p.CW - 4) / 2;
      const [left, right] = await Promise.all([
        selectorLeft ? elementToDataURL(selectorLeft) : null,
        selectorRight ? elementToDataURL(selectorRight) : null,
      ]);
      const ratio = left?.ratio || right?.ratio || 1;
      const imgH = Math.min(halfW * ratio, maxH);
      p.newPageIfNeeded(imgH + 6);
      if (left) {
        p.strokeRect(p.M, p.y, halfW, imgH, C.border);
        p.pdf.addImage(left.dataURL, "PNG", p.M, p.y, halfW, imgH);
      }
      if (right) {
        p.strokeRect(p.M + halfW + 4, p.y, halfW, imgH, C.border);
        p.pdf.addImage(right.dataURL, "PNG", p.M + halfW + 4, p.y, halfW, imgH);
      }
      p.y += imgH + 6;
    } catch (err) {
      console.warn("Chart pair skipped:", err);
    }
  }

  // ─── PDF builder ─────────────────────────────────────────────────────────────
  async function downloadPDF() {
    setBusy(true);
    setStatusMsg("Loading jsPDF…");
    try {
      const { jsPDF } = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm");
      const pdf = new jsPDF("p", "mm", "a4");
      const p = makePainter(pdf);

      // White background on every page
      p.fillRect(0, 0, p.PW, p.PH, C.bg);
      const origAddPage = pdf.addPage.bind(pdf);
      pdf.addPage = (...args) => {
        origAddPage(...args);
        p.fillRect(0, 0, p.PW, p.PH, C.bg);
        return pdf;
      };

      // ── Cover ──────────────────────────────────────────────────────────
      p.fillRect(p.M, p.y, p.CW, 24, C.surface);
      p.strokeRect(p.M, p.y, p.CW, 24, C.border);
      p.fillRect(p.M, p.y, 4, 24, C.accent);
      p.setFont(11, "bold", C.accent);
      p.txt("DevLens Report", p.M + 8, p.y + 10);
      p.setFont(12, "bold", C.text);
      p.txt(repoName || "", p.M + 8, p.y + 18);
      p.setFont(7, "normal", C.muted);
      p.txt(`Generated: ${now()}`, p.PW - p.M, p.y + 18, { align: "right" });
      p.y += 28;

      // ── Lines of Code ──────────────────────────────────────────────────
      if (visibleMetrics.loc && locData) {
        setStatusMsg("Lines of Code…");
        drawSectionHeader(p, "Lines of Code");
        drawStatGrid(p, [
          { label: "Total LOC", value: locData.summary.totalLoc?.toLocaleString(), color: C.accent },
          { label: "Files", value: locData.summary.totalFiles, color: C.text },
          { label: "Functions", value: locData.summary.totalFunctions, color: C.text },
          { label: "Comments", value: locData.summary.totalComments, color: C.text },
        ]);
        if (locData.summary.languages?.length) {
          p.newPageIfNeeded(7);
          p.setFont(7, "normal", C.muted);
          p.txt(`Languages: ${locData.summary.languages.join(", ")}`, p.M, p.y);
          p.y += 8;
        }
      }

      // ── Commit Summary ─────────────────────────────────────────────────
      if (visibleMetrics.commits && commitData) {
        setStatusMsg("Commit Summary…");
        drawSectionHeader(p, "Commit Summary");
        drawStatGrid(p, [
          { label: "Total Commits", value: commitData.totalCommits, color: C.accent },
          { label: "Total Additions", value: `+${commitData.summary.totalAdditions?.toLocaleString()}`, color: C.green },
          { label: "Total Deletions", value: `-${commitData.summary.totalDeletions?.toLocaleString()}`, color: C.red },
          { label: "Avg +/Commit", value: `+${commitData.summary.averageAdditionsPerCommit}`, color: C.green },
          { label: "Avg -/Commit", value: `-${commitData.summary.averageDeletionsPerCommit}`, color: C.red },
          { label: "Avg Files/Commit", value: commitData.summary.averageFilesChangedPerCommit, color: C.text },
        ]);
        setStatusMsg("Commit chart…");
        await drawChart(p, "#chart-commits", 65);
      }

      // ── Code Ownership ─────────────────────────────────────────────────
      if (visibleMetrics.ownership && ownershipData) {
        setStatusMsg("Code Ownership…");
        drawSectionHeader(p, "Code Ownership");
        drawStatGrid(p, [
          { label: "Contributors", value: ownershipData.totalContributors, color: C.accent },
          { label: "Total Commits", value: ownershipData.totalCommits, color: C.text },
        ]);
        setStatusMsg("Ownership charts…");
        await drawChartPair(p, "#chart-ownership-commits", "#chart-ownership-lines", 65);
        drawTable(
          p,
          ["Author", "Commits", "Lines Added"],
          ownershipData.contributors.slice(0, 15).map((c) => [
            c.author, c.commits, c.linesAdded?.toLocaleString(),
          ]),
          [p.CW * 0.55, p.CW * 0.2, p.CW * 0.25]
        );
      }

      // ── Issue Tracking ─────────────────────────────────────────────────
      if (visibleMetrics.issues && issuesData) {
        setStatusMsg("Issue Tracking…");
        drawSectionHeader(p, "Issue Tracking");
        drawStatGrid(p, [
          { label: "Total Issues", value: issuesData.totalIssues, color: C.accent },
          { label: "Open Issues", value: issuesData.openIssues, color: C.red },
          { label: "Closed Issues", value: issuesData.closedIssues, color: C.green },
        ]);
        if (issuesData.totalIssues > 0) {
          await drawChart(p, "#chart-issues", 60);
        }
      }

      // ── Churn Rate ─────────────────────────────────────────────────────
      if (visibleMetrics.churn && churnData) {
        setStatusMsg("Churn Rate…");
        drawSectionHeader(p, "Churn Rate");
        drawStatGrid(p, [
          { label: "Overall Churn", value: `${churnData.summary.churnRate}%`, color: C.accent },
          { label: "Additions", value: `+${churnData.summary.totalAdditions?.toLocaleString()}`, color: C.green },
          { label: "Deletions", value: `-${churnData.summary.totalDeletions?.toLocaleString()}`, color: C.red },
          { label: "Net Lines", value: churnData.summary.netLines?.toLocaleString(), color: C.text },
        ]);
        drawTable(
          p,
          ["File", "Additions", "Deletions", "Commits", "Churn %"],
          churnData.files.map((f) => [
            f.file.split("/").pop(),
            { value: `+${f.additions.toLocaleString()}`, color: C.green },
            { value: `-${f.deletions.toLocaleString()}`, color: C.red },
            f.commits,
            { value: `${f.churnRate}%`, color: f.churnRate > 80 ? C.red : f.churnRate > 40 ? C.yellow : C.green },
          ]),
          [p.CW * 0.38, p.CW * 0.17, p.CW * 0.17, p.CW * 0.13, p.CW * 0.15]
        );
      }

      // ── Commit Message Quality ─────────────────────────────────────────
      if (visibleMetrics.commitMessageQuality && commitMessageQualityData) {
        setStatusMsg("Commit Message Quality…");
        drawSectionHeader(p, "Commit Message Quality");
        drawStatGrid(p, [
          { label: "Avg Quality", value: `${commitMessageQualityData.averageQuality}%`, color: C.accent },
          { label: "Total Commits", value: commitMessageQualityData.totalCommits, color: C.text },
          { label: "Worst Messages", value: commitMessageQualityData.worstMessages?.length || 0, color: C.red },
        ]);
        drawTable(
          p,
          ["SHA", "Message", "Quality", "Violations"],
          (commitMessageQualityData.worstMessages || []).map((m) => [
            m.sha.slice(0, 7),
            (m.message || "(empty subject)").slice(0, 55),
            { value: `${m.qualityScore}%`, color: m.qualityScore < 50 ? C.red : m.qualityScore < 75 ? C.yellow : C.green },
            m.violationCount,
          ]),
          [p.CW * 0.13, p.CW * 0.57, p.CW * 0.15, p.CW * 0.15]
        );
      }

      // ── Cyclomatic Complexity ──────────────────────────────────────────
      if (visibleMetrics.cyclomatic && cyclomaticData) {
        setStatusMsg("Cyclomatic Complexity…");
        drawSectionHeader(p, "Cyclomatic Complexity");
        drawStatGrid(p, [
          { label: "Avg Complexity", value: cyclomaticData.averageCyclomaticComplexity, color: C.accent },
          { label: "Functions Analyzed", value: cyclomaticData.totalFunctions, color: C.text },
          { label: "Files Scanned", value: cyclomaticData.totalFilesAnalyzed, color: C.text },
          { label: "High Threshold", value: `>= ${cyclomaticData.highComplexityThreshold}`, color: C.yellow },
        ]);
        setStatusMsg("Complexity chart…");
        await drawChart(p, "#chart-cyclomatic", 65);
        drawTable(
          p,
          ["File", "Function", "Complexity", "NLOC"],
          (cyclomaticData.highComplexityFunctions || []).map((fn) => [
            fn.file.split("/").pop(),
            fn.name,
            { value: fn.complexity, color: fn.complexity >= 20 ? C.red : fn.complexity >= 10 ? C.yellow : C.green },
            fn.nloc,
          ]),
          [p.CW * 0.30, p.CW * 0.38, p.CW * 0.17, p.CW * 0.15]
        );
      }

      // ── Commit Activity ────────────────────────────────────────────────
      // CommitActivity may render a custom grid/canvas that needs more time to paint.
      // We try the inner div first, then fall back to the whole metric-card.
      if (visibleMetrics.activityGraph && commitActivityData) {
        setStatusMsg("Activity Graph…");
        drawSectionHeader(p, "Commit Activity Graph");
        drawStatGrid(p, [
          { label: "Total Commits", value: commitActivityData.totalCommits, color: C.accent },
          { label: "Weeks", value: commitActivityData.weeks, color: C.text },
          { label: "Avg Weekly", value: commitActivityData.insights?.averageWeeklyCommits, color: C.text },
          { label: "Max Daily", value: commitActivityData.insights?.maxDailyCommits, color: C.text },
        ]);
        if (commitActivityData.dateRange?.from) {
          p.newPageIfNeeded(7);
          p.setFont(7, "normal", C.muted);
          p.txt(`${commitActivityData.dateRange.from} → ${commitActivityData.dateRange.to}`, p.M, p.y);
          p.y += 7;
        }
        // 400 ms wait — CommitActivity uses a custom renderer that paints after layout
        // Fallback chain: inner div → any svg inside the card → the whole card
        await drawChart(
          p,
          ["#chart-activity", "#chart-activity svg", "#chart-activity canvas"],
          60,
          400
        );
      }

      // ── Naming Conventions ─────────────────────────────────────────────
      if (visibleMetrics.namingConventions && locData?.namingQuality) {
        setStatusMsg("Naming Conventions…");
        drawSectionHeader(p, "Naming Conventions");
        drawStatGrid(p, [
          { label: "Overall Quality", value: `${Math.round(locData.namingQuality.percentage)}%`, color: C.accent },
          { label: "Names Evaluated", value: locData.namingQuality.evaluatedNames?.toLocaleString(), color: C.text },
          { label: "Worst Listed", value: Math.min((locData.namingQuality.worstNames || []).length, 20), color: C.red },
        ]);
        drawTable(
          p,
          ["Name", "Type", "Language", "Issue", "Score"],
          (locData.namingQuality.worstNames || []).slice(0, 20).map((item) => [
            item.name, item.type, item.language,
            (item.issues || []).join(", ").slice(0, 40) || "—",
            { value: `${item.score}%`, color: item.score < 50 ? C.red : item.score < 75 ? C.yellow : C.green },
          ]),
          [p.CW * 0.22, p.CW * 0.14, p.CW * 0.14, p.CW * 0.38, p.CW * 0.12]
        );
      }

      // ── File Change Heatmap ────────────────────────────────────────────
      if (visibleMetrics.heatmap && heatmapData) {
        setStatusMsg("File Change Heatmap…");
        drawSectionHeader(p, "File Change Heatmap");
        drawStatGrid(p, [
          { label: "Total Unique Files", value: heatmapData.totalUniqueFiles, color: C.accent },
          { label: "Most Changed", value: Math.min((heatmapData.files || []).length, 20), color: C.text },
        ]);
        await drawChart(p, ["#chart-heatmap", "#chart-heatmap svg"], 75);
        if (heatmapData.files?.length > 0) {
          drawTable(
            p,
            ["File", "Changes", "Heat"],
            (heatmapData.files || []).slice(0, 20).map((f) => [
              f.file.split("/").pop(), f.changes,
              { value: f.heat, color: f.heat > 0.7 ? C.red : f.heat > 0.4 ? C.yellow : C.green },
            ]),
            [p.CW * 0.65, p.CW * 0.2, p.CW * 0.15]
          );
        }
      }

      // ── Class & Component Design ───────────────────────────────────────
      if (visibleMetrics.classDesign && classDesignData) {
        setStatusMsg("Class & Component Design…");
        drawSectionHeader(p, "Class & Component Design");
        drawStatGrid(p, [
          { label: "Total Classes", value: classDesignData.summary.totalClasses, color: C.accent },
          { label: "Avg WMC", value: classDesignData.summary.averageWMC, color: C.text },
          { label: "Avg LCOM", value: classDesignData.summary.averageLCOM, color: C.text },
          { label: "Max DIT", value: classDesignData.summary.maxDIT, color: C.text },
          { label: "Max NOC", value: classDesignData.summary.maxNOC, color: C.text },
        ]);
        await drawChart(p, ["#chart-classdesign", "#chart-classdesign svg"], 75);
        if (classDesignData.classes?.length > 0) {
          drawTable(
            p,
            ["Class", "Language", "WMC", "LCOM", "DIT", "NOC"],
            (classDesignData.classes || []).slice(0, 20).map((c) => [
              c.className, c.language, c.metrics.WMC, c.metrics.LCOM, c.metrics.DIT, c.metrics.NOC,
            ]),
            [p.CW * 0.40, p.CW * 0.15, p.CW * 0.11, p.CW * 0.11, p.CW * 0.11, p.CW * 0.12]
          );
        }
      }

      // ── Footer ─────────────────────────────────────────────────────────
      p.setFont(7, "normal", C.muted);
      p.txt(`DevLens · ${repoName} · ${now()}`, p.PW / 2, p.PH - 8, { align: "center" });

      setStatusMsg("Saving…");
      pdf.save(`${safeRepoName}-report.pdf`);
      setStatusMsg("");
    } catch (err) {
      console.error("PDF generation failed:", err);
      setStatusMsg(`Error: ${err.message}`);
      setTimeout(() => setStatusMsg(""), 6000);
    } finally {
      setBusy(false);
    }
  }

  // ─── Visibility guard ─────────────────────────────────────────────────────────
  const hasData =
    (visibleMetrics.churn && churnData) ||
    (visibleMetrics.commits && commitData) ||
    (visibleMetrics.loc && locData) ||
    (visibleMetrics.ownership && ownershipData) ||
    (visibleMetrics.issues && issuesData) ||
    (visibleMetrics.heatmap && heatmapData) ||
    (visibleMetrics.commitMessageQuality && commitMessageQualityData) ||
    (visibleMetrics.cyclomatic && cyclomaticData) ||
    (visibleMetrics.activityGraph && commitActivityData) ||
    (visibleMetrics.namingConventions && locData?.namingQuality) ||
    (visibleMetrics.classDesign && classDesignData);

  if (!hasData) return null;

  const btnBase = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "9px 18px", borderRadius: 8, fontSize: "0.78rem",
    fontFamily: "var(--mono, monospace)", fontWeight: 600,
    cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
    transition: "all 0.2s", border: "1px solid",
  };

  return (
    <div
      id="report-download-controls"
      style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "20px 0 4px" }}
    >
      <span style={{
        fontSize: "0.68rem", fontFamily: "var(--mono)",
        color: "rgba(233,213,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        Download Report
      </span>

      <button
        onClick={downloadPDF}
        disabled={busy}
        style={{ ...btnBase, background: "rgba(124,58,237,0.15)", borderColor: "rgba(124,58,237,0.5)", color: "#c4b5fd" }}
        onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = "rgba(124,58,237,0.3)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.15)"; }}
      >
        {busy ? `⏳ ${statusMsg || "Generating…"}` : "⬇ PDF Report"}
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

      {statusMsg && !busy && (
        <span style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", color: "#f87171" }}>
          {statusMsg}
        </span>
      )}
    </div>
  );
}