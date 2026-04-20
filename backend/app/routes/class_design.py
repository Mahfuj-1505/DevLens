import importlib.util
import os
from fastapi import APIRouter, HTTPException, Query, status

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
    githubUrl: str = Query(..., description="Public GitHub repository URL"),
    language: str = Query("all", description="One of: all, python, java, cpp"),
):
    try:
        service = _load_service("class_component_design.py", "ClassComponentDesign")()
        return service.get_metrics(githubUrl, language)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))
