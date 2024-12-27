from sqlalchemy.orm import Session
from app import models, schemas
from app.models import User
from passlib.context import CryptContext
from fastapi import HTTPException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_user(db: Session, user_data):
    hashed_password = pwd_context.hash(user_data["password"])
    db_user = User(
        username=user_data["username"],
        password=hashed_password,
        role=user_data["role"],  # Assign role here
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, user_data):
    db_user = db.query(User).filter(User.username == user_data.username).first()
    if not db_user or not pwd_context.verify(user_data.password, db_user.password):
        return None
    return db_user

def create_request(db: Session, request: schemas.RequestCreate):
    db_request = models.Request(**request.dict())
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def get_all_requests(db: Session):
    return db.query(models.Request).all()

def resolve_request(db: Session, request_id: int):
    db_request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
    db_request.status = "resolved"
    db.commit()
    return db_request
