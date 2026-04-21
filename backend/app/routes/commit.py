"""
Commit Routes - RESTful
"""

import importlib.util
import os
from fastapi import APIRouter, HTTPException, Query, status
from app.utils.repo_source import resolve_repository_source

router = APIRouter(prefix="/repositories", tags=["Commit Analysis"])


def _load_service(folder: str, filename: str, classname: str):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    service_path = os.path.join(
        base_dir, "..", "..", "features", "spl1", folder, filename
    )
    spec = importlib.util.spec_from_file_location(filename.replace(".py", ""), service_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return getattr(module, classname)


@router.get("/commits", status_code=status.HTTP_200_OK)
async def get_commits(
    sourceType: str = Query("github", description="Repository source type: github or local", examples=["github", "local"]),
    githubUrl: str | None = Query(default=None, description="Public GitHub repository URL", examples=["https://github.com/mr-mahfuj/DevLens"]),
    localPath: str | None = Query(default=None, description="Local git repository path", examples=["/home/user/projects/my-repo"]),
):
    try:
        _, repo_source = resolve_repository_source(sourceType, githubUrl, localPath)
        CodeChanges = _load_service("Commit Quality", "code_changes.py", "CodeChanges")
        service = CodeChanges()
        return service.get_changes(repo_source)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
@router.get("/heatmap", status_code=status.HTTP_200_OK)
async def get_file_heatmap(
    sourceType: str = Query("github", description="Repository source type: github or local", examples=["github", "local"]),
    githubUrl: str | None = Query(default=None, description="Public GitHub repository URL", examples=["https://github.com/mr-mahfuj/DevLens"]),
    localPath: str | None = Query(default=None, description="Local git repository path", examples=["/home/user/projects/my-repo"]),
):
    try:
        _, repo_source = resolve_repository_source(sourceType, githubUrl, localPath)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        service_path = os.path.join(base_dir, "..", "..", "features", "spl2", "Code_Churn","file_change_heatmap.py")
        spec = importlib.util.spec_from_file_location("file_change_heatmap", service_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        service = module.FileChangeHeatmap()
        return service.get_heatmap(repo_source)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
@router.get("/ownership", status_code=status.HTTP_200_OK)
async def get_code_ownership(
    sourceType: str = Query("github", description="Repository source type: github or local", examples=["github", "local"]),
    githubUrl: str | None = Query(default=None, description="Public GitHub repository URL", examples=["https://github.com/mr-mahfuj/DevLens"]),
    localPath: str | None = Query(default=None, description="Local git repository path", examples=["/home/user/projects/my-repo"]),
):
    try:
        _, repo_source = resolve_repository_source(sourceType, githubUrl, localPath)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        service_path = os.path.join(base_dir, "..", "..", "features", "spl2", "Code_Churn", "code_ownership.py")
        spec = importlib.util.spec_from_file_location("code_ownership", service_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        service = module.CodeOwnership()
        return service.get_ownership(repo_source)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/commit-message-quality", status_code=status.HTTP_200_OK)
async def get_commit_message_quality(
    sourceType: str = Query("github", description="Repository source type: github or local", examples=["github", "local"]),
    githubUrl: str | None = Query(default=None, description="Public GitHub repository URL", examples=["https://github.com/mr-mahfuj/DevLens"]),
    localPath: str | None = Query(default=None, description="Local git repository path", examples=["/home/user/projects/my-repo"]),
):
    try:
        _, repo_source = resolve_repository_source(sourceType, githubUrl, localPath)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        service_path = os.path.join(
            base_dir,
            "..",
            "..",
            "features",
            "spl2",
            "Commit_Message_Quality",
            "commit_message_quality.py",
        )
        spec = importlib.util.spec_from_file_location("commit_message_quality", service_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        service = module.CommitMessageQuality()
        return service.get_quality(repo_source)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))