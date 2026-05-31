from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from bdd import get_session
from models.schemas import User, UserCreate, UserRead
from core.security import obtener_hash_password

# Creamos el enrutador para los usuarios
router = APIRouter(
    prefix="/api/v1/users",
    tags=["Gestión de Usuarios"]
)

# Nota: response_model=UserRead asegura que FastAPI NO devuelva el hash de la contraseña en la respuesta
@router.post("/", response_model=UserRead)
def registrar_usuario(user_data: UserCreate, db: Session = Depends(get_session)):
    
    # 1. Verificamos si el correo ya existe para no tener cuentas duplicadas
    consulta = select(User).where(User.email == user_data.email)
    usuario_existente = db.exec(consulta).first()
    
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Este correo electrónico ya está registrado.")
    
    # 2. Creamos el usuario, ¡ENCRIPTANDO la contraseña en el proceso!
    nuevo_usuario = User(
        username=user_data.username,
        email=user_data.email,
        birthdate=user_data.birthdate,
        hashed_password=obtener_hash_password(user_data.password) # 👈 Magia criptográfica
    )
    
    # 3. Guardamos en SQLite
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    return nuevo_usuario