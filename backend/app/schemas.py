from pydantic import BaseModel
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class RequestCreate(BaseModel):
    type: str
    subtype: str
    # priority: int
    latitude: float
    longitude: float
    notes: str

class RequestResponse(BaseModel):
    id: int
    type: str
    subtype: str
    priority: int
    latitude: float
    longitude: float
    notes: str
    timestamp: datetime
    status: str

    class Config:
        orm_mode = True