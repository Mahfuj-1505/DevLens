from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from urllib.parse import quote_plus
import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration with defaults
DB_DIALECT = os.getenv("DB_DIALECT", "mysql")
DB_DRIVER = os.getenv("DB_DRIVER", "pymysql")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "devlens_db")

# Encode credentials
encoded_user = quote_plus(DB_USER)
encoded_password = quote_plus(DB_PASSWORD) if DB_PASSWORD else ""

# Build database URL
DATABASE_URL = (
    f"{DB_DIALECT}+{DB_DRIVER}://"
    f"{encoded_user}:{encoded_password}@"
    f"{DB_HOST}:{DB_PORT}/"
    f"{DB_NAME}"
)

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL debugging
    pool_pre_ping=True  # Verify connections before using them
)

# Create session factory
sessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()