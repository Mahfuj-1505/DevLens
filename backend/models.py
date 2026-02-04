from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    firstname = Column(String(50), nullable=False)
    lastname = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)  # Increased length for hashed passwords
    role = Column(String(50), nullable=False)

    # One-to-many relationship with Repository
    repositories = relationship("Repository", back_populates="owner")

    # Many-to-many relationship with Repository through Compares
    compared_repos = relationship(
        "Repository",
        secondary="compares",
        back_populates="compared_by_users"
    )


class Repository(Base):
    __tablename__ = "repository"

    repo_id = Column(Integer, primary_key=True, index=True)
    repo_link = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.user_id"))

    # Relationship back to User
    owner = relationship("User", back_populates="repositories")

    # One-to-many relationship with Report
    report = relationship("Report", back_populates="repository")

    # Many-to-many relationship with User through Compares
    compared_by_users = relationship(
        "User",
        secondary="compares",
        back_populates="compared_repos"
    )


class Report(Base):
    __tablename__ = "report"  

    report_id = Column(Integer, primary_key=True, index=True)
    format = Column(String(10), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    graph = Column(String(100), nullable=False)
    chart = Column(String(100), nullable=False)
    repo_id = Column(Integer, ForeignKey("repository.repo_id"))

    # Relationship back to Repository
    repository = relationship("Repository", back_populates="report")


class Compares(Base):
    __tablename__ = "compares"

    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    repo_id = Column(Integer, ForeignKey("repository.repo_id"), primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
