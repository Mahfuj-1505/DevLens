"""
DevLens Backend Server Entry Point
Run this file to start the server
"""

import uvicorn
from app.main import app
from app.config.settings import get_settings

settings = get_settings()

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info"
    )
