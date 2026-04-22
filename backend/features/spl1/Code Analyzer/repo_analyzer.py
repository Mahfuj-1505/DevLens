"""
repo_analyzer.py - Analyze repository for user-written files, LOC, and names
"""

import json
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional

try:
    import yaml
except ImportError:
    yaml = None

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

    def __init__(self, repo_path: str, spl: str = None):
        self.repo_path = Path(repo_path).resolve()
        self.spl = spl
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

        result = {
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

        if self.spl in ["SPL-2", "SPL-3"]:
            try:
                result["code_duplication"] = self._detect_code_duplication()
            except Exception as e:
                result["code_duplication"] = {"error": str(e)}

        if self.spl == "SPL-3":
            try:
                result["testing_presence"] = self._detect_testing_presence()
            except Exception as e:
                result["testing_presence"] = {"error": str(e)}
            try:
                result["ci_cd_presence"] = self._detect_ci_cd_presence()
            except Exception as e:
                result["ci_cd_presence"] = {"error": str(e)}

        return result

    def _detect_testing_presence(self) -> Dict:
        """Detect presence of testing in the repository."""
        import yaml
        import configparser
        try:
            import tomllib
        except ImportError:
            import tomli as tomllib
        from pathlib import Path

        # Step 1: Normalize and prepare repo scan
        repo_path = self.repo_path
        exclude_dirs = {'.git', 'venv', 'node_modules', 'dist', 'build', '__pycache__'}

        def should_exclude(path: Path) -> bool:
            return any(part in exclude_dirs for part in path.parts)

        all_files = []
        for root, dirs, files in os.walk(repo_path):
            root_path = Path(root)
            if should_exclude(root_path):
                dirs[:] = []  # Don't recurse into excluded dirs
                continue
            for file in files:
                file_path = root_path / file
                rel_path = file_path.relative_to(repo_path)
                all_files.append(rel_path)

        # Step 2: Detect test directories
        test_dirs = []
        for path in all_files:
            if path.is_dir() and path.name in {'tests', 'test', 'spec'}:
                test_dirs.append(str(path))

        test_dir_found = len(test_dirs) > 0

        # Step 3: Detect test files
        test_files = []
        test_patterns = [
            re.compile(r'test_.*\.py$'),
            re.compile(r'.*_test\.py$'),
            re.compile(r'test_.*\.js$'),
            re.compile(r'.*_test\.js$'),
            re.compile(r'.*\.test\.js$'),
            re.compile(r'.*\.spec\.js$'),
        ]

        for path in all_files:
            if path.is_file():
                for pattern in test_patterns:
                    if pattern.match(path.name):
                        test_files.append(str(path))
                        break

        test_file_count = len(test_files)

        # Step 4: Detect test frameworks
        frameworks_detected = []
        config_files = {
            'requirements.txt': 'pip',
            'pyproject.toml': 'toml',
            'setup.cfg': 'ini',
            'Pipfile': 'toml',
            'package.json': 'json',
        }

        test_frameworks = {
            'pytest', 'unittest', 'nose', 'tox', 'jest', 'mocha', 'jasmine',
            'karma', 'cypress', 'selenium', 'testng', 'junit', 'mockito'
        }

        for config_file, format_type in config_files.items():
            config_path = repo_path / config_file
            if config_path.exists():
                try:
                    if format_type == 'pip':
                        with open(config_path, 'r', encoding='utf-8') as f:
                            content = f.read().lower()
                            for framework in test_frameworks:
                                if framework in content:
                                    frameworks_detected.append(framework)
                    elif format_type == 'toml':
                        with open(config_path, 'rb') as f:
                            data = tomllib.load(f)
                            # Check dependencies sections
                            for section in ['dependencies', 'dev-dependencies', 'tool.poetry.dependencies']:
                                deps = data.get(section, {})
                                for dep in deps:
                                    dep_name = dep.lower().split('[')[0]  # Remove extras
                                    if dep_name in test_frameworks:
                                        frameworks_detected.append(dep_name)
                    elif format_type == 'ini':
                        config = configparser.ConfigParser()
                        config.read(config_path)
                        for section in config.sections():
                            if 'dependencies' in section.lower() or 'install_requires' in section.lower():
                                for key in config[section]:
                                    dep = key.lower()
                                    if dep in test_frameworks:
                                        frameworks_detected.append(dep)
                    elif format_type == 'json':
                        with open(config_path, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            deps = data.get('dependencies', {})
                            deps.update(data.get('devDependencies', {}))
                            for dep in deps:
                                dep_name = dep.lower().split('[')[0]
                                if dep_name in test_frameworks:
                                    frameworks_detected.append(dep_name)
                except Exception:
                    pass

        frameworks_detected = list(set(frameworks_detected))

        # Step 5: Inspect test file content
        real_test_files = []
        for test_file in test_files[:10]:  # Sample up to 10 files
            try:
                with open(repo_path / test_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if any(pattern in content for pattern in [
                        'def test_', 'class Test', 'import pytest', 'import unittest',
                        'describe(', 'it(', 'test(', '@Test', '@Before', '@After'
                    ]):
                        real_test_files.append(test_file)
            except Exception:
                pass

        # Step 6: Detect coverage tools
        coverage_tools = []
        coverage_files = ['.coverage', 'coverage.xml', 'htmlcov/', 'lcov.info', '.nyc_output/']
        for cov_file in coverage_files:
            if (repo_path / cov_file).exists():
                coverage_tools.append(cov_file)

        # Check for coverage in dependencies
        coverage_deps = ['coverage', 'pytest-cov', 'nyc', 'istanbul', 'jacoco']
        for dep in coverage_deps:
            if dep in frameworks_detected:
                coverage_tools.append(dep)

        # Step 7: Detect test commands in scripts
        test_commands = []
        script_files = ['Makefile', 'package.json', 'tox.ini', 'pyproject.toml']

        for script_file in script_files:
            script_path = repo_path / script_file
            if script_path.exists():
                try:
                    with open(script_path, 'r', encoding='utf-8') as f:
                        content = f.read().lower()
                        if any(cmd in content for cmd in ['pytest', 'unittest', 'npm test', 'yarn test', 'tox', 'make test']):
                            test_commands.append(script_file)
                except Exception:
                    pass

        # Step 8: Assign confidence score
        confidence = 0.0
        if test_dir_found:
            confidence += 0.2
        if test_file_count > 0:
            confidence += min(test_file_count * 0.1, 0.3)  # Max 0.3 for files
        if frameworks_detected:
            confidence += 0.3
        if real_test_files:
            confidence += min(len(real_test_files) * 0.1, 0.4)  # Max 0.4 for real tests
        if coverage_tools:
            confidence += 0.2
        if test_commands:
            confidence += 0.3

        confidence = min(confidence, 1.0)

        return {
            "testing_confidence": confidence,
            "test_directories_found": test_dirs,
            "test_files_count": test_file_count,
            "test_files": test_files[:20],  # Limit for output
            "frameworks_detected": frameworks_detected,
            "real_test_files_sample": real_test_files,
            "coverage_tools": coverage_tools,
            "test_commands_in_scripts": test_commands,
        }

    def _detect_ci_cd_presence(self) -> Dict:
        """Detect presence of CI/CD pipeline in the repository."""
        import yaml

        repo_path = self.repo_path

        # Step 1: Detect CI/CD config files
        ci_cd_configs = {
            'github_actions': '.github/workflows/*.yml',
            'gitlab_ci': '.gitlab-ci.yml',
            'circle_ci': '.circleci/config.yml',
            'travis_ci': '.travis.yml',
            'azure_pipelines': 'azure-pipelines.yml',
            'jenkins': 'Jenkinsfile',
            'drone': '.drone.yml',
            'buildkite': '.buildkite/pipeline.yml',
        }

        valid_pipeline_files = []

        for platform, pattern in ci_cd_configs.items():
            if '*' in pattern:
                # Handle glob patterns
                base_dir = repo_path / pattern.split('/*')[0]
                if base_dir.exists():
                    for file_path in base_dir.glob(pattern.split('/')[-1]):
                        if file_path.exists():
                            valid_pipeline_files.append({
                                'platform': platform,
                                'file': str(file_path.relative_to(repo_path))
                            })
            else:
                config_path = repo_path / pattern
                if config_path.exists():
                    valid_pipeline_files.append({
                        'platform': platform,
                        'file': str(config_path.relative_to(repo_path))
                    })

        # Step 2: Validate YAML files
        validated_files = []
        for pipeline in valid_pipeline_files:
            file_path = repo_path / pipeline['file']
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    yaml.safe_load(f)
                validated_files.append(pipeline)
            except Exception:
                pass

        # Step 3: Identify CI/CD platform
        platforms = list(set(p['platform'] for p in validated_files))

        # Step 4: Inspect pipeline structure
        structured_pipelines = []
        for pipeline in validated_files:
            file_path = repo_path / pipeline['file']
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()
                    data = yaml.safe_load(content)

                    has_jobs = 'jobs' in data
                    has_steps = False
                    has_runs_on = False
                    has_workflows = 'workflows' in data if pipeline['platform'] == 'circle_ci' else False

                    if has_jobs and isinstance(data['jobs'], dict):
                        for job_name, job_config in data['jobs'].items():
                            if isinstance(job_config, dict):
                                if 'steps' in job_config:
                                    has_steps = True
                                if 'runs-on' in job_config:
                                    has_runs_on = True
                                break

                    structured_pipelines.append({
                        **pipeline,
                        'has_structure': has_jobs or has_workflows,
                        'has_steps': has_steps,
                        'has_runs_on': has_runs_on,
                    })
            except Exception:
                structured_pipelines.append({**pipeline, 'has_structure': False})

        # Step 5: Detect test execution in pipeline
        test_execution_found = []
        test_commands = ['pytest', 'unittest', 'npm test', 'yarn test', 'tox', 'make test', 'gradle test', 'mvn test']

        for pipeline in validated_files:
            file_path = repo_path / pipeline['file']
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()
                    if any(cmd in content for cmd in test_commands):
                        test_execution_found.append(pipeline['file'])
            except Exception:
                pass

        # Step 6: Detect build/deploy steps
        build_deploy_found = []
        build_commands = ['build', 'compile', 'package', 'docker', 'deploy', 'publish', 'npm run build', 'pip install']

        for pipeline in validated_files:
            file_path = repo_path / pipeline['file']
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()
                    if any(cmd in content for cmd in build_commands):
                        build_deploy_found.append(pipeline['file'])
            except Exception:
                pass

        # Step 7: Detect triggers
        triggers_found = []
        trigger_patterns = ['on:', 'trigger:', 'schedule:', 'cron:']

        for pipeline in validated_files:
            file_path = repo_path / pipeline['file']
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()
                    if any(pattern in content for pattern in trigger_patterns):
                        triggers_found.append(pipeline['file'])
            except Exception:
                pass

        # Step 8: Detect multi-job pipelines
        multi_job_pipelines = []
        for pipeline in structured_pipelines:
            if pipeline.get('has_structure', False):
                file_path = repo_path / pipeline['file']
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = yaml.safe_load(f)
                        job_count = 0
                        if 'jobs' in data and isinstance(data['jobs'], dict):
                            job_count = len(data['jobs'])
                        elif 'workflows' in data and isinstance(data['workflows'], dict):
                            # CircleCI style
                            for workflow_name, workflow_config in data['workflows'].items():
                                if isinstance(workflow_config, dict) and 'jobs' in workflow_config:
                                    job_count = len(workflow_config['jobs'])
                                    break
                        if job_count > 1:
                            multi_job_pipelines.append({
                                'file': pipeline['file'],
                                'job_count': job_count
                            })
                except Exception:
                    pass

        # Step 9: Assign CI/CD confidence score
        confidence = 0.0
        if validated_files:
            confidence += 0.3  # Base score for having pipeline files
        confidence += min(len(validated_files) * 0.1, 0.3)  # Bonus for multiple files

        structured_count = sum(1 for p in structured_pipelines if p.get('has_structure', False))
        confidence += min(structured_count * 0.2, 0.4)  # Structure bonus

        if test_execution_found:
            confidence += 0.5  # Major bonus for running tests

        if build_deploy_found:
            confidence += 0.2

        if triggers_found:
            confidence += 0.1

        if multi_job_pipelines:
            confidence += min(len(multi_job_pipelines) * 0.1, 0.2)

        confidence = min(confidence, 1.0)

        return {
            "ci_cd_confidence": confidence,
            "pipeline_files": validated_files,
            "platforms": platforms,
            "structured_pipelines": structured_pipelines,
            "test_execution_in_pipelines": test_execution_found,
            "build_deploy_steps": build_deploy_found,
            "triggers_configured": triggers_found,
            "multi_job_pipelines": multi_job_pipelines,
        }

    def _detect_code_duplication(self) -> Dict:
        """Detect code duplication using token-based analysis."""
        import hashlib
        import tokenize
        import io

        # Step 1: Collect all Python files
        python_files = []
        for root, dirs, files in os.walk(self.repo_path):
            root_path = Path(root)
            if any(part in {'.git', 'venv', 'node_modules', 'dist', 'build', '__pycache__'} for part in root_path.parts):
                continue
            for file in files:
                if file.endswith('.py'):
                    python_files.append(root_path / file)

        # Step 2: Tokenize and normalize each file
        file_tokens = {}
        for file_path in python_files[:50]:  # Limit to 50 files for performance
            try:
                with open(file_path, 'rb') as f:
                    tokens = list(tokenize.tokenize(f.readline))
                
                # Normalize tokens (Type-2 clone detection)
                normalized = []
                id_counter = 0
                id_map = {}
                
                for tok in tokens:
                    if tok.type in {tokenize.NAME, tokenize.NUMBER, tokenize.STRING}:
                        if tok.type == tokenize.NAME:
                            if tok.string not in {'import', 'from', 'def', 'class', 'if', 'for', 'while', 'return', 'True', 'False', 'None'}:
                                if tok.string not in id_map:
                                    id_map[tok.string] = f'ID_{id_counter}'
                                    id_counter += 1
                                normalized.append(('ID', id_map[tok.string]))
                            else:
                                normalized.append((tokenize.tok_name[tok.type], tok.string))
                        elif tok.type == tokenize.NUMBER:
                            normalized.append(('NUM', 'NUM'))
                        elif tok.type == tokenize.STRING:
                            normalized.append(('STR', 'STR'))
                    elif tok.type in {tokenize.OP, tokenize.tok_name.keys()}:
                        normalized.append((tokenize.tok_name.get(tok.type, 'UNKNOWN'), tok.string))
                
                file_tokens[str(file_path.relative_to(self.repo_path))] = normalized
            except Exception:
                continue

        # Step 3: Generate fingerprints using sliding window
        window_size = 10
        fingerprints = {}
        
        for file_path, tokens in file_tokens.items():
            for i in range(len(tokens) - window_size + 1):
                window = tokens[i:i + window_size]
                # Create hash of the window
                window_str = ' '.join(f'{t[0]}:{t[1]}' for t in window)
                hash_val = hashlib.md5(window_str.encode()).hexdigest()
                
                if hash_val not in fingerprints:
                    fingerprints[hash_val] = []
                fingerprints[hash_val].append({
                    'file': str(file_path.relative_to(self.repo_path)),
                    'start': i,
                    'end': i + window_size,
                    'tokens': window
                })

        # Step 4: Find duplicates
        duplicates = []
        for hash_val, locations in fingerprints.items():
            if len(locations) > 1:
                # Group by file to avoid self-duplicates
                file_groups = {}
                for loc in locations:
                    if loc['file'] not in file_groups:
                        file_groups[loc['file']] = []
                    file_groups[loc['file']].append(loc)
                
                # Only consider cross-file duplicates
                if len(file_groups) > 1:
                    duplicates.append({
                        'hash': hash_val,
                        'locations': locations,
                        'file_count': len(file_groups),
                        'total_occurrences': len(locations)
                    })

        # Step 5: Calculate duplication metrics
        total_lines = sum(len(tokens) for tokens in file_tokens.values())
        duplicated_lines = sum(len(dup['locations']) * window_size for dup in duplicates)
        duplication_percentage = (duplicated_lines / total_lines * 100) if total_lines > 0 else 0

        # Group duplicates by severity
        high_duplication = [d for d in duplicates if d['total_occurrences'] >= 5]
        medium_duplication = [d for d in duplicates if 2 <= d['total_occurrences'] < 5]
        low_duplication = [d for d in duplicates if d['total_occurrences'] == 2]

        return {
            "total_files_analyzed": len(file_tokens),
            "total_lines_analyzed": total_lines,
            "duplicated_lines": duplicated_lines,
            "duplication_percentage": round(duplication_percentage, 2),
            "total_duplicate_groups": len(duplicates),
            "high_duplication_groups": len(high_duplication),
            "medium_duplication_groups": len(medium_duplication),
            "low_duplication_groups": len(low_duplication),
            "duplicate_groups": duplicates[:20]  # Limit output
        }

    def save_to_json(self, output_file: str = "analysis_result.json") -> str:
        """Run analyze and save output to JSON file."""
        result = self.analyze()
        output_path = Path(output_file).resolve()
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        return str(output_path)