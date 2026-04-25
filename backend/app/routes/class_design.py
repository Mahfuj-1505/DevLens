import importlib.util
import os
from fastapi import APIRouter, HTTPException, Query, status

from app.utils.repo_source import resolve_repository_source

router = APIRouter(prefix="/repositories", tags=["SPL-2 Analysis"])


def _load_service(filename: str, classname: str):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    service_path = os.path.join(
        base_dir,
        "..",
        "..",
        "features",
        "spl2",
        "Class_Component_Design",
        filename,
    )
    spec = importlib.util.spec_from_file_location(filename.replace(".py", ""), service_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return getattr(module, classname)


@router.get("/class-design", status_code=status.HTTP_200_OK)
async def get_class_design_metrics(
    sourceType: str | None = Query(None, description="Source type: github or local"),
    githubUrl: str | None = Query(None, description="Public GitHub repository URL"),
    localPath: str | None = Query(None, description="Local git repository path"),
    language: str = Query("all", description="One of: all, python, java, cpp"),
):
    try:
        source_type, repo_source = resolve_repository_source(sourceType, githubUrl, localPath)
        service = _load_service("class_component_design.py", "ClassComponentDesign")()
        return service.get_metrics(repo_source, source_type, language)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))
