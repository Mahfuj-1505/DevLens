"""Report persistence and comparison routes."""

from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.models.user import User
from app.routes.auth import get_authenticated_user
from app.utils.mongo import get_reports_collection
from app.utils.user_roles import extract_batch_and_roll, normalize_email

router = APIRouter(prefix="/reports", tags=["Reports"])


class ReportUpsertRequest(BaseModel):
    repository: str = Field(..., min_length=1)
    sourceType: str = Field(default="github")
    spl: str | None = None
    selectedOptions: list[str] = Field(default_factory=list)
    metrics: dict = Field(default_factory=dict)


def _serialize_report(report: dict) -> dict:
    batch, roll = extract_batch_and_roll(report.get("user_email", ""))
    return {
        "id": str(report["_id"]),
        "userEmail": report.get("user_email"),
        "repository": report.get("repository"),
        "sourceType": report.get("source_type"),
        "spl": report.get("spl"),
        "selectedOptions": report.get("selected_options", []),
        "metrics": report.get("metrics", {}),
        "createdAt": report.get("created_at"),
        "updatedAt": report.get("updated_at"),
        "batch": batch,
        "roll": roll,
    }


@router.post("", status_code=status.HTTP_200_OK)
async def upsert_report(
    payload: ReportUpsertRequest,
    user: User = Depends(get_authenticated_user),
):
    collection = get_reports_collection()
    now = datetime.utcnow()
    normalized_email = normalize_email(user.email)
    normalized_repo = payload.repository.strip()
    if not normalized_repo:
        raise HTTPException(status_code=400, detail="Repository is required")

    collection.update_one(
        {"user_email": normalized_email, "repository": normalized_repo},
        {
            "$set": {
                "source_type": payload.sourceType,
                "spl": payload.spl,
                "selected_options": payload.selectedOptions,
                "metrics": payload.metrics,
                "updated_at": now,
            },
            "$setOnInsert": {
                "user_email": normalized_email,
                "created_at": now,
            },
        },
        upsert=True,
    )

    report = collection.find_one(
        {"user_email": normalized_email, "repository": normalized_repo}
    )
    return {"message": "Report saved", "report": _serialize_report(report)}


@router.get("", status_code=status.HTTP_200_OK)
async def list_reports(user: User = Depends(get_authenticated_user)):
    collection = get_reports_collection()
    if user.role == "student":
        reports = list(
            collection.find({"user_email": normalize_email(user.email)}).sort("updated_at", -1)
        )
    else:
        reports = list(collection.find({}))
        reports.sort(
            key=lambda r: (
                extract_batch_and_roll(r.get("user_email", ""))[0] is None,
                extract_batch_and_roll(r.get("user_email", ""))[0] or 999,
                r.get("user_email", ""),
                -(r.get("updated_at").timestamp() if r.get("updated_at") else 0),
            )
        )
    return {"reports": [_serialize_report(report) for report in reports]}


@router.get("/compare", status_code=status.HTTP_200_OK)
async def compare_reports(
    leftId: str = Query(...),
    rightId: str = Query(...),
    user: User = Depends(get_authenticated_user),
):
    if user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can compare reports",
        )

    collection = get_reports_collection()
    try:
        left = collection.find_one({"_id": ObjectId(leftId)})
        right = collection.find_one({"_id": ObjectId(rightId)})
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid report id: {str(exc)}")

    if not left or not right:
        raise HTTPException(status_code=404, detail="One or both reports were not found")

    return {"left": _serialize_report(left), "right": _serialize_report(right)}
