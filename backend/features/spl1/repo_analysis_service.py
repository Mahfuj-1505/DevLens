"""Service to clone a GitHub repo, run code analysis, and persist JSON output."""

from __future__ import annotations

import importlib.util
import json
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Dict


class RepoAnalysisService:
    """Handles end-to-end repository analysis workflow."""

    def __init__(self) -> None:
        self.features_root = Path(__file__).resolve().parent
        self.runtime_root = self.features_root / "runtime"
        self.clone_root = self.runtime_root / "cloned_repos"
        self.output_root = self.runtime_root / "analysis_outputs"

        self.clone_root.mkdir(parents=True, exist_ok=True)
        self.output_root.mkdir(parents=True, exist_ok=True)

    def _safe_repo_name(self, repo_source: str) -> str:
        raw = repo_source.rstrip("/").split("/")[-1]
        if raw.endswith(".git"):
            raw = raw[:-4]
        return re.sub(r"[^a-zA-Z0-9._-]", "_", raw) or "repository"

    def _clone_repo(self, repo_source: str) -> Path:
        repo_name = self._safe_repo_name(repo_source)
        clone_path = Path(
            tempfile.mkdtemp(prefix=f"{repo_name}_", dir=str(self.clone_root))
        )

        result = subprocess.run(
            ["git", "clone", "--depth", "1", repo_source, str(clone_path)],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or "Failed to clone repository")

        return clone_path

    def _load_code_analyzer_class(self):
        analyzer_dir = self.features_root / "Code Analyzer"
        main_file = analyzer_dir / "main.py"

        if not main_file.exists():
            raise FileNotFoundError(f"Analyzer entry not found: {main_file}")

        if str(analyzer_dir) not in sys.path:
            sys.path.insert(0, str(analyzer_dir))

        spec = importlib.util.spec_from_file_location("devlens_code_analyzer_main", str(main_file))
        if spec is None or spec.loader is None:
            raise RuntimeError("Unable to load CodeAnalyzer module")

        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        if not hasattr(module, "CodeAnalyzer"):
            raise RuntimeError("CodeAnalyzer class not found in analyzer module")

        return module.CodeAnalyzer

    def run_from_source(self, repo_source: str, spl: str = None) -> Dict:
        clone_path: Path | None = None
        try:
            clone_path = self._clone_repo(repo_source)

            repo_name = self._safe_repo_name(repo_source)
            ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            output_path = self.output_root / f"{repo_name}_analysis_{ts}.json"

            CodeAnalyzer = self._load_code_analyzer_class()
            analyzer = CodeAnalyzer(str(clone_path), spl)
            saved_path = analyzer.save_json(str(output_path))

            with open(saved_path, "r", encoding="utf-8") as f:
                result = json.load(f)

            return {
                "github_url": repo_source if repo_source.startswith("http") or repo_source.startswith("git@") else None,
                "local_path": repo_source if not (repo_source.startswith("http") or repo_source.startswith("git@")) else None,
                "clone_path": str(clone_path),
                "json_output_path": str(saved_path),
                "result": result,
            }
        finally:
            if clone_path is not None:
                self.cleanup_clone(str(clone_path))

    def cleanup_clone(self, clone_path: str) -> None:
        path = Path(clone_path)
        if path.exists() and str(path).startswith(str(self.clone_root)):
            shutil.rmtree(path, ignore_errors=True)
