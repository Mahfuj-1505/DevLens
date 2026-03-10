"""Repository analysis routes."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from features.spl1.repo_analysis_service import RepoAnalysisService

router = APIRouter(prefix="/analysis", tags=["Repository Analysis"])


class GithubAnalysisRequest(BaseModel):
    githubUrl: str = Field(..., description="Public GitHub repository URL")


@router.post("/github", status_code=status.HTTP_200_OK)
async def analyze_github_repository(payload: GithubAnalysisRequest):
    """Clone GitHub repo, run analyzer, and save output JSON."""
    try:
        service = RepoAnalysisService()
        output = service.run_from_github_url(payload.githubUrl)
        return {
            "message": "Analysis completed",
            "githubUrl": output["github_url"],
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
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Repository analysis failed: {str(exc)}",
        )
