"""
SPL-2 Routes - Code Ownership, Issue Tracking, Churn Rate
"""

import importlib.util
import os
from fastapi import APIRouter, HTTPException, Query, status
from app.utils.repo_source import resolve_github_url_for_issues

router = APIRouter(prefix="/repositories", tags=["SPL-2 Analysis"])

def _load_service(filename: str, classname: str):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    service_path = os.path.join(base_dir, "..", "..", "features", "spl2", filename)
    spec = importlib.util.spec_from_file_location(filename.replace(".py", ""), service_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return getattr(module, classname)

@router.get("/issues", status_code=status.HTTP_200_OK)
async def get_issues(
    sourceType: str = Query("github", description="Repository source type: github or local", examples=["github", "local"]),
    githubUrl: str | None = Query(default=None, description="Public GitHub repository URL", examples=["https://github.com/mr-mahfuj/DevLens"]),
    localPath: str | None = Query(default=None, description="Local git repository path", examples=["/home/user/projects/my-repo"]),
):
    """Returns open/closed issue ratio and label breakdown."""
    try:
        resolved_github_url = resolve_github_url_for_issues(sourceType, githubUrl, localPath)
        service = _load_service("issue_tracker.py", "IssueTracker")()
        return service.get_issues(resolved_github_url)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


