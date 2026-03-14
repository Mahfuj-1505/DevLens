"""
Code Changes Per Commit Service
Clones a GitHub repository and returns additions, deletions, and files changed per commit.
"""

import os
import shutil
import tempfile
import subprocess


class CodeChanges:

    def get_changes(self, github_url: str) -> dict:
        clone_dir = tempfile.mkdtemp(prefix="devlens_changes_")
        try:
            # Clone the repo
            result = subprocess.run(
                ["git", "clone", "--quiet", github_url, clone_dir],
                capture_output=True, text=True, timeout=120
            )
            if result.returncode != 0:
                raise ValueError(f"Failed to clone repository: {result.stderr.strip()}")

            # Get all commits: sha|date|message
            log_result = subprocess.run(
                ["git", "log", "--pretty=format:%H|%ad|%s", "--date=short"],
                capture_output=True, text=True, cwd=clone_dir
            )
            if log_result.returncode != 0 or not log_result.stdout.strip():
                raise ValueError("Failed to retrieve commit history")

            commits = []
            total_additions = 0
            total_deletions = 0
            total_files_changed = 0

            for line in log_result.stdout.strip().splitlines():
                parts = line.split("|", 2)
                if len(parts) < 3:
                    continue

                sha, date, message = parts
                additions, deletions, files_changed = self._get_diff_stats(sha, clone_dir)

                total_additions += additions
                total_deletions += deletions
                total_files_changed += files_changed

                commits.append({
                    "sha": sha[:7],
                    "date": date,
                    "message": message,
                    "additions": additions,
                    "deletions": deletions,
                    "filesChanged": files_changed
                })

            return {
                "githubUrl": github_url,
                "totalCommits": len(commits),
                "summary": {
                    "totalAdditions": total_additions,
                    "totalDeletions": total_deletions,
                    "averageAdditionsPerCommit": round(total_additions / len(commits), 1) if commits else 0,
                    "averageDeletionsPerCommit": round(total_deletions / len(commits), 1) if commits else 0,
                    "averageFilesChangedPerCommit": round(total_files_changed / len(commits), 1) if commits else 0,
                },
                "commits": commits
            }

        finally:
            shutil.rmtree(clone_dir, ignore_errors=True)

    def _get_diff_stats(self, sha: str, cwd: str) -> tuple[int, int, int]:
        """Get additions, deletions, files changed for a single commit using --numstat"""
        result = subprocess.run(
            ["git", "show", "--numstat", "--format=", sha],
            capture_output=True, text=True, cwd=cwd
        )

        additions = deletions = files_changed = 0

        if result.returncode != 0:
            return additions, deletions, files_changed

        for line in result.stdout.strip().splitlines():
            parts = line.split("\t")
            if len(parts) >= 2:
                try:
                    # Binary files show '-' instead of a number, skip them
                    if parts[0] == "-" or parts[1] == "-":
                        continue
                    additions += int(parts[0])
                    deletions += int(parts[1])
                    files_changed += 1
                except ValueError:
                    continue

        return additions, deletions, files_changed