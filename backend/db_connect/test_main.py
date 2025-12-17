from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Annotated
import model
from database import engine, sessionLocal
from sqlalchemy.orm import Session

app = FastAPI()

model.Base.metadata.create_all(bind=engine)

class UserBase(BaseModel):
    firstname: str
    lastname: str
    email: str
    password: str

def get_db():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

@app.post("/user/", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserBase, db: db_dependency):
    db_user = model.User(**user.dict())
    db.add(db_user)  
    db.commit()
    db.refresh(db_user)
    return {"message": "User created successfully", "email": db_user.email}

@app.get("/user/{email}")
async def get_user(email: str, db: db_dependency):
    user = db.query(model.User).filter(model.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user