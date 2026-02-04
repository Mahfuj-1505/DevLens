from fastapi import FastAPI, HTTPException, Depends, status
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User
from pydantic import BaseModel
from typing import List
from datetime import timedelta
from auth_utils import (
    hash_password,
    authenticate_user,
    create_access_token,
    get_current_user,
    check_user_access,
    get_db,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

app = FastAPI(title="DevLens API")


# ==================== Pydantic Schemas ====================

class UserCreate(BaseModel):
    firstname: str
    lastname: str
    email: str
    password: str
    role: str


class UserResponse(BaseModel):
    user_id: int
    firstname: str
    lastname: str
    email: str
    role: str

    class Config:
        orm_mode = True


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# ==================== Endpoints ====================

# --- 1️⃣ Login endpoint (public) ---
@app.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT token.
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns JWT access token for authenticated requests.
    """
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token with user_id as subject
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.user_id}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


# --- 2️⃣ Create a user (public - password hashed) ---
@app.post("/users/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user with hashed password.
    
    - **firstname**: User's first name
    - **lastname**: User's last name
    - **email**: Unique email address
    - **password**: Password (will be hashed before storage)
    - **role**: User role (e.g., "user" or "admin")
    """
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password before storing
    user_data = user.dict()
    user_data["password"] = hash_password(user.password)
    
    db_user = User(**user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# --- 3️⃣ Get a single user by user_id (protected) ---
@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user by ID. Requires authentication.
    
    - Users can only access their own data
    - Admin users can access any user's data
    
    **Authorization**: Requires valid JWT token in Authorization header (Bearer token)
    """
    # Check if user has permission to access this data
    check_user_access(current_user, user_id)
    
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


# --- 4️⃣ Get all users (protected - admin only) ---
@app.get("/users/", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all users. Requires authentication.
    
    - Only admin users can access all user data
    - Regular users will see only their own data
    
    **Authorization**: Requires valid JWT token in Authorization header (Bearer token)
    """
    # If user is admin, return all users
    if current_user.role == "admin":
        users = db.query(User).all()
        return users
    
    # Otherwise, return only the current user's data
    return [current_user]
