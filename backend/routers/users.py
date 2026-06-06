from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlmodel import Session, select
from bdd import get_session
from models.schemas import User, UserCreate, UserRead
from core.security import obtener_hash_password
from utils.email_service import enviar_correo_bienvenida


router = APIRouter(
    prefix="/api/v1/users",
    tags=["Gestión de Usuarios"]
)


@router.post("/", response_model=UserRead)
def registrar_usuario(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
    
    
    consulta = select(User).where(User.email == user_data.email)
    usuario_existente = db.exec(consulta).first()
    
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Este correo electrónico ya está registrado.")
    
   
    nuevo_usuario = User(
        username=user_data.username,
        email=user_data.email,
        birthdate=user_data.birthdate,
        hashed_password=obtener_hash_password(user_data.password) 
    )
    
  
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    background_tasks.add_task(enviar_correo_bienvenida, nuevo_usuario.email, nuevo_usuario.username)
    
    return nuevo_usuario