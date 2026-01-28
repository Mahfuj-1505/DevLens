from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User
from pydantic import BaseModel
from typing import List

app = FastAPI(title="DevLens API")


# --- Pydantic schemas ---
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


# --- Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- 1️⃣ Create a user ---
@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# --- 2️⃣ Get a single user by user_id ---
@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


# --- 3️⃣ Get all users ---
@app.get("/users/", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users
