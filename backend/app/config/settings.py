"""
Application Configuration Settings
Loads from environment variables
"""

from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Database
    DATABASE_URL: str = "sqlite:///./devlens.db"
    
    # JWT Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = False  # Allow lowercase in .env
        extra = "ignore"  # Ignore extra fields

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
