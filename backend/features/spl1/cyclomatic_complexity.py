"""Cyclomatic complexity analysis using lizard."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

import lizard


IGNORED_DIRS = {
    ".git",
    ".hg",
    ".svn",
    "node_modules",
    "dist",
    "build",
    "venv",
    ".venv",
    "__pycache__",
    "target",
    "coverage",
    ".idea",
    ".vscode",
}

SUPPORTED_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".c",
    ".cc",
    ".cpp",
    ".cxx",
    ".h",
    ".hpp",
    ".cs",
    ".go",
    ".rb",
    ".php",
    ".swift",
    ".kt",
    ".rs",
}


class CyclomaticComplexityAnalyzer:
    """Analyze repository cyclomatic complexity and return summary metrics."""

    def analyze(self, repo_source: str, top_n: int = 10, threshold: int = 10) -> dict:
        repo_path, cleanup_dir = self._prepare_repository(repo_source)

        try:
            function_records: list[dict] = []
            files_analyzed = 0

            for file_path in self._iter_code_files(repo_path):
                files_analyzed += 1
                rel_path = str(file_path.relative_to(repo_path))

                try:
                    result = lizard.analyze_file(str(file_path))
                except Exception:
                    # Skip files lizard fails to parse to keep analysis resilient.
                    continue

                for fn in result.function_list:
                    function_records.append(
                        {
                            "file": rel_path,
                            "name": fn.name,
                            "lineStart": fn.start_line,
                            "lineEnd": fn.end_line,
                            "nloc": fn.nloc,
                            "complexity": int(fn.cyclomatic_complexity),
                        }
                    )

            if not function_records:
                return {
                    "source": repo_source,
                    "totalFilesAnalyzed": files_analyzed,
                    "totalFunctions": 0,
                    "averageCyclomaticComplexity": 0,
                    "highComplexityThreshold": threshold,
                    "highComplexityFiles": [],
                    "highComplexityFunctions": [],
                }

            avg_complexity = round(
                sum(item["complexity"] for item in function_records) / len(function_records), 2
            )

            file_aggregate: dict[str, dict] = {}
            for item in function_records:
                record = file_aggregate.setdefault(
                    item["file"],
                    {
                        "file": item["file"],
                        "totalComplexity": 0,
                        "functionCount": 0,
                        "maxFunctionComplexity": 0,
                    },
                )
                record["totalComplexity"] += item["complexity"]
                record["functionCount"] += 1
                record["maxFunctionComplexity"] = max(
                    record["maxFunctionComplexity"], item["complexity"]
                )

            high_complexity_files = []
            for file_item in file_aggregate.values():
                avg_file_complexity = file_item["totalComplexity"] / file_item["functionCount"]
                if file_item["maxFunctionComplexity"] >= threshold:
                    high_complexity_files.append(
                        {
                            "file": file_item["file"],
                            "averageComplexity": round(avg_file_complexity, 2),
                            "maxFunctionComplexity": file_item["maxFunctionComplexity"],
                            "functionCount": file_item["functionCount"],
                        }
                    )

            high_complexity_files.sort(
                key=lambda item: (item["maxFunctionComplexity"], item["averageComplexity"]),
                reverse=True,
            )

            high_complexity_functions = [
                item
                for item in sorted(
                    function_records,
                    key=lambda entry: entry["complexity"],
                    reverse=True,
                )
                if item["complexity"] >= threshold
            ][:top_n]

            return {
                "source": repo_source,
                "totalFilesAnalyzed": files_analyzed,
                "totalFunctions": len(function_records),
                "averageCyclomaticComplexity": avg_complexity,
                "highComplexityThreshold": threshold,
                "highComplexityFiles": high_complexity_files[:top_n],
                "highComplexityFunctions": high_complexity_functions,
            }
        finally:
            if cleanup_dir:
                shutil.rmtree(cleanup_dir, ignore_errors=True)

    def _prepare_repository(self, repo_source: str) -> tuple[Path, str | None]:
        local_path = Path(repo_source)
        if local_path.exists() and local_path.is_dir():
            return local_path, None

        clone_dir = tempfile.mkdtemp(prefix="devlens_cyclomatic_")
        result = subprocess.run(
            ["git", "clone", "--quiet", repo_source, clone_dir],
            capture_output=True,
            text=True,
            timeout=180,
        )
        if result.returncode != 0:
            raise ValueError(f"Failed to clone repository: {result.stderr.strip()}")

        return Path(clone_dir), clone_dir

    def _iter_code_files(self, repo_root: Path):
        for file_path in repo_root.rglob("*"):
            if not file_path.is_file():
                continue

            if any(part in IGNORED_DIRS for part in file_path.parts):
                continue

            if file_path.suffix.lower() in SUPPORTED_EXTENSIONS:
                yield file_path
