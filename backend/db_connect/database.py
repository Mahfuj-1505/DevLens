from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from urllib.parse import quote_plus
import os
from dotenv import load_dotenv

load_dotenv()

DB_DIALECT = os.getenv("DB_DIALECT")
DB_DRIVER = os.getenv("DB_DRIVER")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

encoded_user = quote_plus(DB_USER)
encoded_password = quote_plus(DB_PASSWORD)

DATABASE_URL = (
    f"{DB_DIALECT}+{DB_DRIVER}://"
    f"{encoded_user}:{encoded_password}@"
    f"{DB_HOST}:{DB_PORT}/"
    f"{DB_NAME}"
)

engine = create_engine(DATABASE_URL)

sessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()