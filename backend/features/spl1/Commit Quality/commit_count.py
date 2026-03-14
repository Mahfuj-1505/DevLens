"""
Commit Count
Clones a GitHub repository and returns the total number of commits.
"""

import os
import shutil
import tempfile
import subprocess


class CommitCount:

    def get_commit_count(self, github_url: str) -> dict:
        clone_dir = tempfile.mkdtemp(prefix="devlens_commits_")
        try:
            result = subprocess.run(
                ["git", "clone", "--quiet", github_url, clone_dir],
                capture_output=True, text=True, timeout=120
            )
            if result.returncode != 0:
                raise ValueError(f"Failed to clone repository: {result.stderr.strip()}")

            log_result = subprocess.run(
                ["git", "rev-list", "--count", "HEAD"],
                capture_output=True, text=True, cwd=clone_dir
            )
            if log_result.returncode != 0:
                raise ValueError("Failed to count commits")

            count = int(log_result.stdout.strip())

            return {
                "githubUrl": github_url,
                "totalCommits": count
            }

        finally:
            shutil.rmtree(clone_dir, ignore_errors=True)