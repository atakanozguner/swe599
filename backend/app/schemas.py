from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict


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
    quantity: int
    tckn: Optional[str]
    notes: Optional[str]


class RequestResponse(BaseModel):
    id: int
    type: str
    subtype: str
    priority: int
    latitude: float
    longitude: float
    quantity: int
    tckn: Optional[str]
    notes: Optional[str]
    timestamp: datetime
    status: str
    relatedDistrict: Optional[int] = None

    class Config:
        orm_mode = True


class DistrictCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    inventory: Optional[Dict[str, int]] = {}


class DistrictResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    inventory: Dict[str, int]
    request_count: int

    class Config:
        orm_mode = True
