from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os
from urllib.parse import quote_plus

# Load .env variables
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")

# URL-encode password to handle special characters like @, #, etc.
DB_PASSWORD_ENCODED = quote_plus(DB_PASSWORD)

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD_ENCODED}@{DB_HOST}/{DB_NAME}"

# SQLAlchemy setup
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
