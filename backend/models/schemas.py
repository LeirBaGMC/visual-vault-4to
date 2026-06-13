from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint
from typing import Optional, List
from datetime import date, datetime, timezone


class User(SQLModel, table=True):
    
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    birthdate: date
    is_active: bool = Field(default=True)
    is_admin: bool = Field(default=False)


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
    is_admin: bool = False




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


class PinUpdate(SQLModel):
    # Campos editables por un admin (todos opcionales).
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None


# ==========================================
# RED SOCIAL: Likes y Comentarios
# ==========================================

class Like(SQLModel, table=True):
    # Un usuario solo puede dar 1 like por pin (restricción única).
    __table_args__ = (UniqueConstraint("user_id", "pin_id", name="uq_like_user_pin"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    pin_id: int = Field(foreign_key="pin.id", index=True)


class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str
    user_id: int = Field(foreign_key="user.id", index=True)
    pin_id: int = Field(foreign_key="pin.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CommentCreate(SQLModel):
    text: str


class CommentRead(SQLModel):
    id: int
    text: str
    user_id: int
    username: str
    created_at: datetime


# ==========================================
# TABLEROS: Board y pines guardados
# ==========================================

class Board(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SavedPin(SQLModel, table=True):
    # Un pin solo puede estar 1 vez en el mismo tablero.
    __table_args__ = (UniqueConstraint("board_id", "pin_id", name="uq_board_pin"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    board_id: int = Field(foreign_key="board.id", index=True)
    pin_id: int = Field(foreign_key="pin.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BoardCreate(SQLModel):
    name: str


class BoardRead(SQLModel):
    id: int
    name: str
    pin_count: int
    covers: List[str] = []