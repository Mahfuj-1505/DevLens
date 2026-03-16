import os
import shutil
import tempfile
import subprocess


class CodeOwnership:

    def get_ownership(self, github_url: str) -> dict:
        clone_dir = tempfile.mkdtemp(prefix="devlens_ownership_")
        try:
            result = subprocess.run(
                ["git", "clone", "--quiet", github_url, clone_dir],
                capture_output=True, text=True, timeout=120
            )
            if result.returncode != 0:
                raise ValueError(f"Failed to clone repository: {result.stderr.strip()}")

            commit_counts = self._get_commit_counts(clone_dir)
            line_counts = self._get_line_counts(clone_dir)

            all_authors = set(list(commit_counts.keys()) + list(line_counts.keys()))

            total_commits = sum(commit_counts.values())
            total_lines = sum(line_counts.values())

            contributors = []
            for author in all_authors:
                commits = commit_counts.get(author, 0)
                lines = line_counts.get(author, 0)
                contributors.append({
                    "author": author,
                    "commits": commits,
                    "linesAdded": lines,
                    "commitPercent": round((commits / total_commits * 100), 1) if total_commits else 0,
                    "linesPercent": round((lines / total_lines * 100), 1) if total_lines else 0,
                })

            contributors.sort(key=lambda x: x["commits"], reverse=True)

            return {
                "githubUrl": github_url,
                "totalContributors": len(contributors),
                "totalCommits": total_commits,
                "totalLinesAdded": total_lines,
                "contributors": contributors
            }

        finally:
            shutil.rmtree(clone_dir, ignore_errors=True)

    def _get_commit_counts(self, cwd: str) -> dict:
        result = subprocess.run(
            ["git", "shortlog", "-sn", "--all"],
            capture_output=True, text=True, cwd=cwd
        )
        counts = {}
        for line in result.stdout.strip().splitlines():
            parts = line.strip().split("\t", 1)
            if len(parts) == 2:
                count, author = parts
                counts[author.strip()] = int(count.strip())
        return counts

    def _get_line_counts(self, cwd: str) -> dict:
        result = subprocess.run(
            ["git", "log", "--numstat", "--format=%aN"],
            capture_output=True, text=True, cwd=cwd
        )
        counts = {}
        current_author = None
        for line in result.stdout.strip().splitlines():
            line = line.strip()
            if not line:
                continue
            parts = line.split("\t")
            if len(parts) == 3:
                try:
                    added = int(parts[0]) if parts[0] != "-" else 0
                    counts[current_author] = counts.get(current_author, 0) + added
                except ValueError:
                    continue
            else:
                current_author = line
        return {k: v for k, v in counts.items() if k}