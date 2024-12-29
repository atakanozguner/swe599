from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
from typing import Optional
from sqlalchemy.dialects.postgresql import JSONB


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)


class Request(Base):
    __tablename__ = "requests"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    subtype = Column(String)
    priority = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    tckn = Column(String, nullable=True)
    notes = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")
    relatedDistrict = Column(Integer, ForeignKey("districts.id"))


class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    inventory = Column(
        JSONB, nullable=False, default={}
    )  # Example: {"tents": 10, "water": 50}
