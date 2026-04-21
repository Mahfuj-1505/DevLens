import importlib.util
import os
from fastapi import APIRouter, HTTPException, Query, status
from app.utils.repo_source import resolve_repository_source
 
router = APIRouter(prefix="/repositories", tags=["SPL-2 Analysis"])
 
 
def _load_service(filename: str, classname: str):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    service_path = os.path.join(base_dir, "..", "..", "features", "spl2", "Code_Churn", filename)
    spec = importlib.util.spec_from_file_location(filename.replace(".py", ""), service_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return getattr(module, classname)

@router.get("/churn", status_code=status.HTTP_200_OK)
async def get_churn_rate(
    sourceType: str = Query("github", description="Repository source type: github or local", examples=["github", "local"]),
    githubUrl: str | None = Query(default=None, description="Public GitHub repository URL", examples=["https://github.com/mr-mahfuj/DevLens"]),
    localPath: str | None = Query(default=None, description="Local git repository path", examples=["/home/user/projects/my-repo"]),
):
    try:
        _, repo_source = resolve_repository_source(sourceType, githubUrl, localPath)
        service = _load_service("churn_rate.py", "ChurnRate")()
        return service.get_churn(repo_source)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
 