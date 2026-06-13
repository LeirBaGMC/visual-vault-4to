import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bdd import get_session
from models.schemas import User
from sqlmodel import Session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login")
# Versión que NO lanza 401 si falta el token (para endpoints de lectura pública)
oauth2_scheme_opcional = OAuth2PasswordBearer(tokenUrl="/api/v1/login", auto_error=False)


load_dotenv()


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def obtener_hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verificar_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)



SECRET_KEY = os.getenv("JWT_SECRET_KEY", "clave_de_respaldo_por_si_acaso")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 

def crear_token_acceso(data: dict):
    """Genera un pasaporte digital firmado para el usuario"""
    datos_a_codificar = data.copy()
    
  
    expiracion = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    datos_a_codificar.update({"exp": expiracion})
    
    
    token_jwt = jwt.encode(datos_a_codificar, SECRET_KEY, algorithm=ALGORITHM)
    
    return token_jwt
def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
        
    user = db.get(User, int(user_id))
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta está desactivada.",
        )
    return user


def obtener_admin_actual(usuario: User = Depends(obtener_usuario_actual)) -> User:
    """Exige que el usuario autenticado sea administrador."""
    if not usuario.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador.",
        )
    return usuario


def obtener_usuario_opcional(
    token: Optional[str] = Depends(oauth2_scheme_opcional),
    db: Session = Depends(get_session),
) -> Optional[User]:
    """Devuelve el usuario si hay un token válido; None si no hay token o es inválido.

    No lanza error: sirve para endpoints públicos que personalizan la respuesta
    cuando el visitante está autenticado (p. ej. saber si ya dio 'me gusta').
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        user = db.get(User, int(user_id))
        if user is None or not user.is_active:
            return None
        return user
    except Exception:
        return None