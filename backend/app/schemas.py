from pydantic import BaseModel
from datetime import datetime
from typing import Optional


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
    tckn: Optional[str]
    notes: Optional[str]


class RequestResponse(BaseModel):
    id: int
    type: str
    subtype: str
    priority: int
    latitude: float
    longitude: float
    tckn: Optional[str]
    notes: Optional[str]
    timestamp: datetime
    status: str

    class Config:
        orm_mode = True
