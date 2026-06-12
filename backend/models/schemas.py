from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import date


class User(SQLModel, table=True):
    
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str 
    birthdate: date
    is_active: bool = Field(default=True)
    
    
    pins: List["Pin"] = Relationship(back_populates="creator")

class UserCreate(SQLModel):
    
    username: str
    email: str
    password: str 
    birthdate: date

class UserRead(SQLModel):
    
    id: int
    username: str
    email: str
    is_active: bool




class Pin(SQLModel, table=True):
    
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: str
    image_url: str
    category: str = Field(default="General", index=True)
    is_sensitive: bool = Field(default=False)
    
    
    creator_id: Optional[int] = Field(default=None, foreign_key="user.id")
   
    creator: Optional[User] = Relationship(back_populates="pins")

class PinCreate(SQLModel):
    
    title: str
    description: str
    image_url: str
    category: str
    is_sensitive: bool = False
    creator_id: int 