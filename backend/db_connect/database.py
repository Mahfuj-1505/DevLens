from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from urllib.parse import quote_plus

# URL encode the password to handle special characters
password = quote_plus('DevLens@1234')
URL_DATABASE = f'mysql+pymysql://devlens_user:{password}@localhost:3306/devlens_db'

engine = create_engine(URL_DATABASE)

sessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()