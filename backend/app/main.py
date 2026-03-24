"""
DevLens FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import get_settings
from app.routes import auth, analysis, commit, issue_tracking
from app.utils.database import init_db
from app.routes import auth, analysis, commit, issue_tracking, churn

settings = get_settings()

app = FastAPI(
    title="DevLens API",
    description="Backend API for DevLens - Repository Analysis Tool",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()

app.include_router(auth.router)
app.include_router(analysis.router)
app.include_router(commit.router)
app.include_router(issue_tracking.router)
app.include_router(churn.router)

@app.get("/")
async def root():
    return {"message": "DevLens API is running", "version": "1.0.0", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}