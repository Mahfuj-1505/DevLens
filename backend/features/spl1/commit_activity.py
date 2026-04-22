"""Commit activity analysis for GitHub-insights-like charts."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path


class CommitActivityAnalyzer:
    """Build daily and weekly commit activity summaries."""

    def analyze(self, repo_source: str, weeks: int = 26) -> dict:
        repo_path, cleanup_dir = self._prepare_repository(repo_source)

        try:
            result = subprocess.run(
                ["git", "log", "--pretty=format:%ad", "--date=short"],
                cwd=str(repo_path),
                capture_output=True,
                text=True,
                timeout=120,
            )
            if result.returncode != 0:
                raise ValueError("Failed to retrieve commit activity")

            today = datetime.utcnow().date()
            start_date = today - timedelta(days=(weeks * 7) - 1)

            counts_by_day = defaultdict(int)
            total_commits = 0

            for line in result.stdout.splitlines():
                date_text = line.strip()
                if not date_text:
                    continue
                try:
                    commit_date = datetime.strptime(date_text, "%Y-%m-%d").date()
                except ValueError:
                    continue

                total_commits += 1
                if commit_date >= start_date:
                    counts_by_day[commit_date.isoformat()] += 1

            daily_activity = []
            current = start_date
            while current <= today:
                daily_activity.append(
                    {
                        "date": current.isoformat(),
                        "count": counts_by_day[current.isoformat()],
                        "weekday": current.weekday(),
                    }
                )
                current += timedelta(days=1)

            weekly_totals = []
            week_cursor = start_date - timedelta(days=start_date.weekday())
            while week_cursor <= today:
                week_total = 0
                for i in range(7):
                    day = (week_cursor + timedelta(days=i)).isoformat()
                    week_total += counts_by_day[day]
                weekly_totals.append(
                    {
                        "weekStart": week_cursor.isoformat(),
                        "commits": week_total,
                    }
                )
                week_cursor += timedelta(days=7)

            max_daily = max((item["count"] for item in daily_activity), default=0)
            most_active = max(daily_activity, key=lambda item: item["count"], default=None)

            return {
                "source": repo_source,
                "weeks": weeks,
                "totalCommits": total_commits,
                "dateRange": {
                    "from": start_date.isoformat(),
                    "to": today.isoformat(),
                },
                "dailyActivity": daily_activity,
                "weeklyActivity": weekly_totals,
                "insights": {
                    "maxDailyCommits": max_daily,
                    "averageWeeklyCommits": round(
                        sum(item["commits"] for item in weekly_totals) / len(weekly_totals), 2
                    )
                    if weekly_totals
                    else 0,
                    "mostActiveDay": most_active,
                },
            }
        finally:
            if cleanup_dir:
                shutil.rmtree(cleanup_dir, ignore_errors=True)

    def _prepare_repository(self, repo_source: str) -> tuple[Path, str | None]:
        local_path = Path(repo_source)
        if local_path.exists() and local_path.is_dir():
            return local_path, None

        clone_dir = tempfile.mkdtemp(prefix="devlens_commit_activity_")
        result = subprocess.run(
            ["git", "clone", "--quiet", repo_source, clone_dir],
            capture_output=True,
            text=True,
            timeout=180,
        )
        if result.returncode != 0:
            raise ValueError(f"Failed to clone repository: {result.stderr.strip()}")

        return Path(clone_dir), clone_dir
