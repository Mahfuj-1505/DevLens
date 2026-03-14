"""
Commit Routes - RESTful
"""

import importlib.util
import os
from fastapi import APIRouter, HTTPException, Query, status

router = APIRouter(prefix="/repositories", tags=["Commit Analysis"])


def load_commit_count():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    service_path = os.path.join(
        base_dir, "..", "..", "features", "spl1", "Commit Quality", "commit_count.py"
    )
    spec = importlib.util.spec_from_file_location("commit_count", service_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.CommitCount


@router.get("/commits/count", status_code=status.HTTP_200_OK)
async def get_commit_count(
    githubUrl: str = Query(..., description="Public GitHub repository URL")
):
    try:
        CommitCountService = load_commit_count()
        service = CommitCountService()
        result = service.get_commit_count(githubUrl)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))