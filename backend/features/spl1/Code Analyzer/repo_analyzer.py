"""
repo_analyzer.py - Analyze repository for user-written files, LOC, and names
"""

import json
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional

import lizard

from code_parser import CodeParser
from file_filters import FileFilters
from git_utils import GitUtils


class RepoAnalyzer:
    """Analyze a cloned git repository."""

    _EXEMPT_SHORT_IDENTIFIERS = {
        "i", "j", "k", "x", "y", "z", "n", "m", "t", "r", "c", "d",
        "id", "ok", "db", "ui", "ip", "os", "io", "fn", "cb", "tx", "rx",
    }

    _VAGUE_NAME_PATTERNS = (
        r"^(tmp|temp|test|foo|bar|baz|var|obj|misc|thing|stuff|data|value|val|param|arg|res|ret)$",
        r"^(tmp|temp|test|foo|bar|baz|var|obj|misc|thing|stuff|data|value|val|param|arg|res|ret)[0-9]+$",
    )

    _CAMEL_CASE_PATTERN = re.compile(r"^[a-z]+(?:[A-Z][a-z0-9]*)*$")
    _SNAKE_CASE_PATTERN = re.compile(r"^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$")
    _UPPER_SNAKE_PATTERN = re.compile(r"^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$")

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

    def _name_follows_convention(self, name: str, language: str, name_type: str) -> bool:
        if language == "python":
            if name_type == "function":
                return bool(self._SNAKE_CASE_PATTERN.match(name))
            return bool(self._SNAKE_CASE_PATTERN.match(name) or self._UPPER_SNAKE_PATTERN.match(name))

        if language in {"java", "javascript"}:
            if name_type == "function":
                return bool(self._CAMEL_CASE_PATTERN.match(name))
            return bool(self._CAMEL_CASE_PATTERN.match(name) or self._UPPER_SNAKE_PATTERN.match(name))

        if language in {"c", "cpp"}:
            return bool(
                self._SNAKE_CASE_PATTERN.match(name)
                or self._CAMEL_CASE_PATTERN.match(name)
                or self._UPPER_SNAKE_PATTERN.match(name)
            )

        return True

    def _name_issue_breakdown(self, name: str, language: str, name_type: str) -> tuple[int, List[str]]:
        score = 100
        issues: List[str] = []
        lowered = name.lower()

        if len(name) <= 2 and lowered in self._EXEMPT_SHORT_IDENTIFIERS:
            return score, issues

        if len(name) <= 2:
            score -= 40
            issues.append("too short for readability")
        elif len(name) < 4:
            score -= 20
            issues.append("name is very short")

        if len(name) > 30:
            score -= 10
            issues.append("name is too long")

        if not self._name_follows_convention(name, language, name_type):
            if language == "python":
                issues.append("should follow snake_case")
            elif language in {"java", "javascript"}:
                issues.append("should follow lowerCamelCase")
            else:
                issues.append("inconsistent naming style")
            score -= 35

        if re.search(r"[0-9]{2,}", name):
            score -= 10
            issues.append("contains dense numeric suffix")

        for pattern in self._VAGUE_NAME_PATTERNS:
            if re.match(pattern, lowered):
                score -= 30
                issues.append("vague or placeholder name")
                break

        return max(score, 0), issues

    def _build_naming_quality(self, files: List[Dict]) -> Dict:
        reviewed = []
        weighted_score_total = 0
        weighted_count_total = 0

        for file_item in files:
            path = file_item["path"]
            language = file_item.get("language", "")

            for function_name, occurrences in file_item.get("function_name_counts", {}).items():
                score, issues = self._name_issue_breakdown(function_name, language, "function")
                if not issues and len(function_name) <= 2 and function_name.lower() in self._EXEMPT_SHORT_IDENTIFIERS:
                    continue

                weighted_score_total += score * occurrences
                weighted_count_total += occurrences
                reviewed.append(
                    {
                        "name": function_name,
                        "type": "function",
                        "language": language,
                        "path": path,
                        "occurrences": occurrences,
                        "score": score,
                        "issues": issues,
                    }
                )

            for variable_name, occurrences in file_item.get("variable_name_counts", {}).items():
                score, issues = self._name_issue_breakdown(variable_name, language, "variable")
                if not issues and len(variable_name) <= 2 and variable_name.lower() in self._EXEMPT_SHORT_IDENTIFIERS:
                    continue

                weighted_score_total += score * occurrences
                weighted_count_total += occurrences
                reviewed.append(
                    {
                        "name": variable_name,
                        "type": "variable",
                        "language": language,
                        "path": path,
                        "occurrences": occurrences,
                        "score": score,
                        "issues": issues,
                    }
                )

        reviewed.sort(key=lambda item: (item["score"], -item["occurrences"], item["name"]))
        worst_20 = reviewed[:20]

        overall_score = round((weighted_score_total / weighted_count_total), 2) if weighted_count_total else 100.0

        return {
            "score": overall_score,
            "percentage": round(overall_score, 1),
            "evaluatedNames": weighted_count_total,
            "worstNames": worst_20,
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
        naming_quality = self._build_naming_quality(files)

        return {
            "repository": str(self.repo_path),
            "owners": self.repo_owners,
            "total_files": len(files),
            "total_loc": total_loc,
            "total_comments": total_comments,
            "total_functions": total_functions,
            "total_variables": total_variables,
            "languages": sorted(list({f["language"] for f in files})),
            "naming_quality": naming_quality,
            "files": sorted(files, key=lambda x: x["path"]),
        }

    def save_to_json(self, output_file: str = "analysis_result.json") -> str:
        """Run analyze and save output to JSON file."""
        result = self.analyze()
        output_path = Path(output_file).resolve()
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        return str(output_path)