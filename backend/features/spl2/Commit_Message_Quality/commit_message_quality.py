import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path


class CommitMessageQuality:
    def __init__(self):
        spl2_root = Path(__file__).resolve().parents[1]
        features_root = spl2_root.parent
        self.clone_root = features_root / "spl1" / "runtime" / "cloned_repos"

    def get_quality(self, github_url: str, worst_n: int = 10) -> dict:
        repo_name = self._safe_repo_name(github_url)
        repo_path, created_temp = self._resolve_repo_path(github_url, repo_name)

        try:
            commits = self._collect_commits(repo_path)
            if not commits:
                return {
                    "githubUrl": github_url,
                    "totalCommits": 0,
                    "averageQuality": 0,
                    "worstMessages": [],
                }

            scored_commits = []
            total_score = 0

            for commit in commits:
                violations = self._lint_message(commit["fullMessage"])
                score = self._score_message(commit["subject"], violations)
                total_score += score

                scored_commits.append({
                    "sha": commit["sha"],
                    "date": commit["date"],
                    "message": commit["subject"],
                    "qualityScore": score,
                    "violationCount": len(violations),
                    "violations": violations,
                })

            scored_commits.sort(key=lambda c: (c["qualityScore"], -c["violationCount"]))
            average_quality = round(total_score / len(scored_commits), 1)

            return {
                "githubUrl": github_url,
                "totalCommits": len(scored_commits),
                "averageQuality": average_quality,
                "worstMessages": scored_commits[:worst_n],
            }
        finally:
            if created_temp:
                shutil.rmtree(repo_path, ignore_errors=True)

    def _resolve_repo_path(self, github_url: str, repo_name: str) -> tuple[str, bool]:
        if self.clone_root.exists():
            candidates = sorted(
                [p for p in self.clone_root.glob(f"{repo_name}_*") if p.is_dir()],
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )

            for candidate in candidates:
                if self._is_same_remote(candidate, github_url):
                    return str(candidate), False

        clone_dir = tempfile.mkdtemp(prefix="devlens_commit_quality_")
        result = subprocess.run(
            ["git", "clone", "--quiet", github_url, clone_dir],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            raise ValueError(f"Failed to clone repository: {result.stderr.strip()}")
        return clone_dir, True

    def _collect_commits(self, repo_path: str) -> list[dict]:
        log_result = subprocess.run(
            ["git", "log", "--pretty=format:%H%x1f%ad%x1f%B%x1e", "--date=short"],
            capture_output=True,
            text=True,
            cwd=repo_path,
        )
        if log_result.returncode != 0:
            raise ValueError("Failed to retrieve commit history")

        entries = [e for e in log_result.stdout.split("\x1e") if e.strip()]
        commits = []
        for entry in entries:
            parts = entry.strip().split("\x1f", 2)
            if len(parts) != 3:
                continue
            sha, date, full_message = parts
            lines = [line for line in full_message.strip().splitlines() if line.strip()]
            subject = lines[0] if lines else ""
            commits.append(
                {
                    "sha": sha[:7],
                    "date": date,
                    "subject": subject,
                    "fullMessage": full_message.strip(),
                }
            )
        return commits

    def _lint_message(self, message: str) -> list[dict]:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as tmp:
            tmp.write(message + "\n")
            tmp_path = tmp.name

        try:
            result = subprocess.run(
                ["gitlint", "--msg-filename", tmp_path],
                capture_output=True,
                text=True,
            )
        except FileNotFoundError as exc:
            raise ValueError(
                "gitlint is not installed. Install backend dependencies to enable commit message quality analysis."
            ) from exc
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass

        violations = []
        for raw in result.stdout.splitlines():
            line = raw.strip()
            if not line:
                continue
            match = re.match(r"^(\d+):\s+([A-Z]\d+)\s+(.*)$", line)
            if match:
                violations.append(
                    {
                        "line": int(match.group(1)),
                        "rule": match.group(2),
                        "message": match.group(3),
                    }
                )
            else:
                violations.append({"line": 1, "rule": "GEN", "message": line})
        return violations

    def _score_message(self, subject: str, violations: list[dict]) -> int:
        penalty = 0
        for violation in violations:
            rule = violation.get("rule", "")
            if rule.startswith("T"):
                penalty += 12
            elif rule.startswith("B"):
                penalty += 8
            else:
                penalty += 10

        normalized = subject.strip().lower()
        if len(normalized) < 12:
            penalty += 12

        vague_subjects = {
            "update",
            "fix",
            "changes",
            "misc",
            "test",
            "wip",
            "temp",
            "final",
            "new",
        }
        if normalized in vague_subjects:
            penalty += 18

        return max(0, 100 - penalty)

    def _safe_repo_name(self, github_url: str) -> str:
        raw = github_url.rstrip("/").split("/")[-1]
        if raw.endswith(".git"):
            raw = raw[:-4]
        return re.sub(r"[^a-zA-Z0-9._-]", "_", raw) or "repository"

    def _normalize_repo_url(self, url: str) -> str:
        value = url.strip().rstrip("/")
        value = value.replace("git@github.com:", "https://github.com/")
        if value.endswith(".git"):
            value = value[:-4]
        return value.lower()

    def _is_same_remote(self, repo_dir: Path, github_url: str) -> bool:
        result = subprocess.run(
            ["git", "config", "--get", "remote.origin.url"],
            capture_output=True,
            text=True,
            cwd=str(repo_dir),
        )
        if result.returncode != 0:
            return False
        current = self._normalize_repo_url(result.stdout)
        target = self._normalize_repo_url(github_url)
        return current == target
