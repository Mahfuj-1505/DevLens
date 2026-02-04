"""
DevLens FastAPI Application
Main application instance with middleware and routes
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import get_settings
from app.routes import auth
from app.utils.database import init_db

settings = get_settings()

app = FastAPI(
    title="DevLens API",
    description="Backend API for DevLens - Repository Analysis Tool",
    version="1.0.0"
)

# CORS middleware - MUST be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
@app.on_event("startup")
async def startup_event():
    init_db()

# Include routers
app.include_router(auth.router)

@app.get("/")
async def root():
    return {
        "message": "DevLens API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
