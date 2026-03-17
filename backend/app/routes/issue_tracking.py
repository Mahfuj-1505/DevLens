"""
SPL-2 Routes - Code Ownership, Issue Tracking, Churn Rate
"""

import importlib.util
import os
from fastapi import APIRouter, HTTPException, Query, status

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
    githubUrl: str = Query(..., description="Public GitHub repository URL")
):
    """Returns open/closed issue ratio and label breakdown."""
    try:
        service = _load_service("issue_tracker.py", "IssueTracker")()
        return service.get_issues(githubUrl)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


