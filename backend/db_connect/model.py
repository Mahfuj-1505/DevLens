from sqlalchemy import Boolean, Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = 'user'

    firstname = Column(String(50))
    lastname = Column(String(50))
    email = Column(String(255), primary_key=True)
    password = Column(String(255))  # Increased to support hashed passwords