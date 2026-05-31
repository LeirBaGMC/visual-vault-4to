from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import date

# ==========================================
# MODELOS DE USUARIO
# ==========================================

class User(SQLModel, table=True):
    """Tabla real en la base de datos para los usuarios"""
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str 
    birthdate: date
    is_active: bool = Field(default=True)
    
    
    pins: List["Pin"] = Relationship(back_populates="creator")

class UserCreate(SQLModel):
    """El molde de datos que FastAPI pedirá en el /docs o al frontend"""
    username: str
    email: str
    password: str 
    birthdate: date

class UserRead(SQLModel):
    """Lo que le devolvemos al frontend (sin revelar la contraseña)"""
    id: int
    username: str
    email: str
    is_active: bool


# ==========================================
# MODELOS DE PINES (Actualizados)
# ==========================================

class Pin(SQLModel, table=True):
    """Tabla real en la base de datos para los pines"""
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: str
    image_url: str
    category: str = Field(default="General", index=True)
    is_sensitive: bool = Field(default=False)
    
    # Clave Foránea: Vincula este pin con su creador
    creator_id: Optional[int] = Field(default=None, foreign_key="user.id")
    # Relación inversa
    creator: Optional[User] = Relationship(back_populates="pins")

class PinCreate(SQLModel):
    """El molde para subir un nuevo pin"""
    title: str
    description: str
    image_url: str
    category: str
    is_sensitive: bool = False
    creator_id: int # Temporalmente lo pedimos, luego lo sacaremos del token JWT automáticamente