"""
Authentication and Authorization Module
Handles user login, registration, and JWT token management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import jwt
import os
from dotenv import load_dotenv

from db_connect.database import sessionLocal
from db_connect.model import User

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "devlens-super-secret-key-change-this-in-production-min-32-chars")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ==================== Pydantic Models ====================

class UserRegistration(BaseModel):
    firstName: str = Field(..., min_length=1, max_length=50)
    lastName: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirmPassword: str = Field(..., min_length=6)

    class Config:
        json_schema_extra = {
            "example": {
                "firstName": "John",
                "lastName": "Doe",
                "email": "john.doe@example.com",
                "password": "SecurePass123",
                "confirmPassword": "SecurePass123"
            }
        }


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "john.doe@example.com",
                "password": "SecurePass123"
            }
        }


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserResponse(BaseModel):
    email: str
    firstName: str
    lastName: str

    class Config:
        from_attributes = True


# ==================== Database Dependency ====================

def get_db():
    """Get database session"""
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================== Utility Functions ====================

def hash_password(password: str) -> str:
    """Hash password using MD5 (matching your database schema)"""
    return hashlib.md5(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(plain_password) == hashed_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password meets security requirements"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    
    if not has_upper:
        return False, "Password must contain at least one uppercase letter"
    if not has_lower:
        return False, "Password must contain at least one lowercase letter"
    if not has_digit:
        return False, "Password must contain at least one number"
    
    return True, "Password is valid"


# ==================== Authentication Routes ====================

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegistration, db: Session = Depends(get_db)):
    """
    Register a new user
    
    - **firstName**: User's first name
    - **lastName**: User's last name
    - **email**: Valid email address (will be used as username)
    - **password**: Strong password (min 6 chars, must include uppercase, lowercase, and number)
    - **confirmPassword**: Must match password
    """
    
    # Validate passwords match
    if user_data.password != user_data.confirmPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Validate password strength
    is_valid, message = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        firstname=user_data.firstName,
        lastname=user_data.lastName,
        email=user_data.email,
        password=hashed_password
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "message": "Registration successful! Please check your email to verify your account.",
            "user": {
                "email": new_user.email,
                "firstName": new_user.firstname,
                "lastName": new_user.lastname
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login user and return JWT token
    
    - **email**: User's registered email
    - **password**: User's password
    
    Returns access token and user information
    """
    
    # Find user by email
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "firstName": user.firstname,
            "lastName": user.lastname
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Get current authenticated user information
    
    Requires valid JWT token in Authorization header
    """
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return UserResponse(
        email=user.email,
        firstName=user.firstname,
        lastName=user.lastname
    )


@router.post("/logout")
async def logout_user():
    """
    Logout user (client should delete the token)
    """
    return {"message": "Successfully logged out"}
