"""Repository analysis routes."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from features.spl1.repo_analysis_service import RepoAnalysisService
from app.utils.repo_source import resolve_repository_source

router = APIRouter(prefix="/analysis", tags=["Repository Analysis"])


class GithubAnalysisRequest(BaseModel):
    sourceType: str = Field(
        "github",
        description="Repository source type: github or local",
        examples=["github", "local"],
    )
    githubUrl: str | None = Field(
        default=None,
        description="Public GitHub repository URL",
        examples=["https://github.com/mr-mahfuj/DevLens"],
    )
    localPath: str | None = Field(
        default=None,
        description="Local git repository path",
        examples=["/home/user/projects/my-repo", "~/projects/my-repo"],
    )


@router.post("/github", status_code=status.HTTP_200_OK)
async def analyze_github_repository(payload: GithubAnalysisRequest):
    """Analyze a repository from either GitHub URL or local path and save output JSON."""
    try:
        source_type, repo_source = resolve_repository_source(
            payload.sourceType,
            payload.githubUrl,
            payload.localPath,
        )
        service = RepoAnalysisService()
        output = service.run_from_source(repo_source)
        return {
            "message": "Analysis completed",
            "sourceType": source_type,
            "githubUrl": output["github_url"],
            "localPath": output.get("local_path"),
            "clonePath": output["clone_path"],
            "jsonOutputPath": output["json_output_path"],
            "summary": {
                "totalFiles": output["result"].get("total_files", 0),
                "totalLoc": output["result"].get("total_loc", 0),
                "totalComments": output["result"].get("total_comments", 0),
                "totalFunctions": output["result"].get("total_functions", 0),
                "totalVariables": output["result"].get("total_variables", 0),
                "languages": output["result"].get("languages", []),
            },
            "namingQuality": output["result"].get("naming_quality", {
                "score": 100,
                "percentage": 100,
                "evaluatedNames": 0,
                "worstNames": [],
            }),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Repository analysis failed: {str(exc)}",
        )
