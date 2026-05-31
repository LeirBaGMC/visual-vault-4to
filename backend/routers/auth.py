from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

# Importaciones locales de tu proyecto
from bdd import get_session
from models.schemas import User
from core.security import verificar_password, crear_token_acceso

# Definición del router (¡Esto es lo que FastAPI no encontraba!)
router = APIRouter(
    prefix="/api/v1",
    tags=["Autenticación"]
)

@router.post("/login")
def iniciar_sesion(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)):
    """
    Endpoint para iniciar sesión. 
    Recibe las credenciales, las verifica en la base de datos y devuelve un Token JWT.
    """
    
    # 1. Buscamos al usuario por su correo electrónico 
    # (FastAPI llama a este campo 'username' por defecto en su estándar OAuth2)
    consulta = select(User).where(User.email == form_data.username)
    usuario = db.exec(consulta).first()
    
    # 2. Verificamos que el usuario exista y que la contraseña desencriptada coincida
    if not usuario or not verificar_password(form_data.password, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 3. Si pasó las pruebas de seguridad, creamos su pasaporte digital (Token JWT)
    token_jwt = crear_token_acceso(data={"sub": str(usuario.id)})
    
    # 4. Entregamos el token empaquetado en el formato estándar
    return {
        "access_token": token_jwt, 
        "token_type": "bearer",
        "usuario_id": usuario.id,
        "username": usuario.username
    }