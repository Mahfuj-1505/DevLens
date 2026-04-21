"""Helpers for validating and resolving repository sources."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path
from typing import Literal, Optional


SourceType = Literal["github", "local"]


def _normalize_source_type(source_type: Optional[str], github_url: Optional[str], local_path: Optional[str]) -> SourceType:
    if source_type in {"github", "local"}:
        return source_type
    if local_path and local_path.strip():
        return "local"
    if github_url and github_url.strip():
        return "github"
    raise ValueError("Provide either githubUrl or localPath")


def _resolve_local_repo_root(local_path: str) -> str:
    path = Path(local_path).expanduser().resolve()
    if not path.exists() or not path.is_dir():
        raise ValueError(f"Local path does not exist or is not a directory: {local_path}")

    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=str(path),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        nested_roots = []
        for git_dir in path.rglob(".git"):
            repo_root = git_dir.parent
            if repo_root.is_dir():
                nested_roots.append(repo_root)

        unique_roots = []
        seen = set()
        for repo_root in nested_roots:
            root_text = str(repo_root)
            if root_text not in seen:
                seen.add(root_text)
                unique_roots.append(repo_root)

        if len(unique_roots) == 1:
            return str(unique_roots[0])

        if len(unique_roots) > 1:
            candidates = ", ".join(str(repo_root) for repo_root in unique_roots[:5])
            raise ValueError(
                f"Local path contains multiple git repositories; specify one repo root instead: {candidates}"
            )

        raise ValueError("Local path must point to a git repository or contain exactly one nested git repository")

    return result.stdout.strip()


def resolve_repository_source(
    source_type: Optional[str],
    github_url: Optional[str],
    local_path: Optional[str],
) -> tuple[SourceType, str]:
    normalized_type = _normalize_source_type(source_type, github_url, local_path)

    if normalized_type == "github":
        if not github_url or not github_url.strip():
            raise ValueError("githubUrl is required when sourceType is 'github'")
        return "github", github_url.strip()

    if not local_path or not local_path.strip():
        raise ValueError("localPath is required when sourceType is 'local'")
    return "local", _resolve_local_repo_root(local_path.strip())


def normalize_github_remote_url(remote_url: str) -> Optional[str]:
    value = remote_url.strip()
    if not value:
        return None

    ssh_match = re.match(r"^git@github\.com:(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?$", value)
    if ssh_match:
        return f"https://github.com/{ssh_match.group('owner')}/{ssh_match.group('repo')}"

    https_match = re.match(r"^https?://github\.com/(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?/?$", value)
    if https_match:
        return f"https://github.com/{https_match.group('owner')}/{https_match.group('repo')}"

    return None


def resolve_github_url_for_issues(
    source_type: Optional[str],
    github_url: Optional[str],
    local_path: Optional[str],
) -> str:
    normalized_type, repo_source = resolve_repository_source(source_type, github_url, local_path)

    if normalized_type == "github":
        return repo_source

    result = subprocess.run(
        ["git", "config", "--get", "remote.origin.url"],
        cwd=repo_source,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise ValueError("Local repository has no remote.origin.url configured")

    normalized = normalize_github_remote_url(result.stdout)
    if not normalized:
        raise ValueError("Local repository origin must point to a GitHub repository for issue tracking")

    return normalized
