"""
Database models
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.utils.database import Base
from datetime import datetime


class User(Base):
    """User model"""
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    firstname = Column(String(50), nullable=False)
    lastname = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="user")

    # Relationships
    repositories = relationship("Repository", back_populates="owner")
    compared_repos = relationship(
        "Repository",
        secondary="compares",
        back_populates="compared_by_users"
    )


class Repository(Base):
    """Repository model"""
    __tablename__ = "repository"

    repo_id = Column(Integer, primary_key=True, index=True)
    repo_link = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.user_id"))

    # Relationships
    owner = relationship("User", back_populates="repositories")
    report = relationship("Report", back_populates="repository")
    compared_by_users = relationship(
        "User",
        secondary="compares",
        back_populates="compared_repos"
    )


class Report(Base):
    """Report model"""
    __tablename__ = "report"

    report_id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(Integer, ForeignKey("repository.repo_id"))
    metrics = Column(String(1000))
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    repository = relationship("Repository", back_populates="report")


class Compare(Base):
    """Compare model - Many-to-many relationship table"""
    __tablename__ = "compares"

    compare_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    repo_id = Column(Integer, ForeignKey("repository.repo_id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
