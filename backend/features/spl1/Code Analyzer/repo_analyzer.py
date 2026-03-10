"""
repo_analyzer.py - Analyze repository for user-written files, LOC, and names
"""

import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional

import lizard

from code_parser import CodeParser
from file_filters import FileFilters
from git_utils import GitUtils


class RepoAnalyzer:
    """Analyze a cloned git repository."""

    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path).resolve()
        self.git_utils = GitUtils(str(self.repo_path))
        self.file_filters = FileFilters(self.repo_path)
        self.code_parser = CodeParser()
        self.repo_owners: List[str] = []

        if not self.git_utils.is_git_repository():
            raise ValueError(f"Not a Git repository: {repo_path}")

    def count_loc_with_lizard(self, file_path: Path) -> Dict[str, int]:
        """Get LOC stats using lizard."""
        try:
            analysis = lizard.analyze_file(str(file_path))
            with open(file_path, "rb") as f:
                total_lines = sum(1 for _ in f)
            return {
                "loc": analysis.nloc,
                "total_lines": total_lines,
            }
        except Exception:
            try:
                with open(file_path, "rb") as f:
                    total = sum(1 for _ in f)
                return {"loc": total, "total_lines": total}
            except Exception:
                return {"loc": 0, "total_lines": 0}

    def is_user_written_file(self, file_path: Path) -> bool:
        """Decide if file is likely user-written (not only boilerplate)."""
        rel_path = str(file_path.relative_to(self.repo_path))
        authors = self.git_utils.get_file_authors(rel_path)
        if not authors:
            return False

        owner_commits = sum(1 for a in authors if a in self.repo_owners)
        if owner_commits == 0:
            return False

        owner_ratio = owner_commits / len(authors)
        return owner_ratio >= 0.30

    def process_file(self, file_path: Path) -> Optional[Dict]:
        """Process a single file."""
        if self.file_filters.should_exclude(file_path):
            return None

        parsed = self.code_parser.parse_file(file_path)
        if not parsed:
            return None

        if not self.is_user_written_file(file_path):
            return None

        loc_info = self.count_loc_with_lizard(file_path)

        return {
            "path": str(file_path.relative_to(self.repo_path)),
            "language": parsed["language"],
            "loc": loc_info["loc"],
            "total_lines": loc_info["total_lines"],
            "comments": parsed["comments"],
            "functions": parsed["functions"],
            "function_name_counts": parsed["function_name_counts"],
            "function_count": parsed["function_count"],
            "variables": parsed["variables"],
            "variable_name_counts": parsed["variable_name_counts"],
            "variable_count": parsed["variable_count"],
        }

    def analyze(self) -> Dict:
        """Analyze repository and return JSON-serializable result."""
        self.repo_owners = self.git_utils.identify_repo_owners(top_n=3)

        all_files = self.git_utils.list_tracked_files()
        supported_files = [f for f in all_files if self.code_parser.get_language(f)]

        files: List[Dict] = []
        max_workers = min(32, (os.cpu_count() or 4) * 4)

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(self.process_file, fp) for fp in supported_files]
            for future in as_completed(futures):
                result = future.result()
                if result:
                    files.append(result)

        total_loc = sum(f["loc"] for f in files)
        total_comments = sum(f["comments"] for f in files)
        total_functions = sum(f["function_count"] for f in files)
        total_variables = sum(f["variable_count"] for f in files)

        return {
            "repository": str(self.repo_path),
            "owners": self.repo_owners,
            "total_files": len(files),
            "total_loc": total_loc,
            "total_comments": total_comments,
            "total_functions": total_functions,
            "total_variables": total_variables,
            "languages": sorted(list({f["language"] for f in files})),
            "files": sorted(files, key=lambda x: x["path"]),
        }

    def save_to_json(self, output_file: str = "analysis_result.json") -> str:
        """Run analyze and save output to JSON file."""
        result = self.analyze()
        output_path = Path(output_file).resolve()
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        return str(output_path)