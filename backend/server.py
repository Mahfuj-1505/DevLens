"""
DevLens Backend Server Entry Point
Run this file to start the server
"""

import os
import uvicorn
from app.main import app
from app.config.settings import get_settings

settings = get_settings()

if __name__ == "__main__":
    # Default to no reload so long-running analysis cannot be interrupted by
    # file watcher events from runtime clone/output directories.
    enable_reload = os.getenv("DEV_RELOAD", "0") == "1"

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=enable_reload,
        log_level="info",
    )
