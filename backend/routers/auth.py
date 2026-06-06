import requests
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from bdd import get_session
from models.schemas import User
from core.security import verificar_password, crear_token_acceso
from utils.email_service import enviar_alerta_login

router = APIRouter(
    prefix="/api/v1",
    tags=["Autenticación"]
)

@router.post("/login")
def iniciar_sesion(background_tasks: BackgroundTasks, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)):
    
    consulta = select(User).where(User.email == form_data.username)
    usuario = db.exec(consulta).first()
    
    if not usuario or not verificar_password(form_data.password, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token_jwt = crear_token_acceso(data={"sub": str(usuario.id)})
    background_tasks.add_task(enviar_alerta_login, usuario.email, usuario.username)
    
    return {
        "access_token": token_jwt, 
        "token_type": "bearer",
        "usuario_id": usuario.id,
        "username": usuario.username
    }

# ----------------------------------------------------
# NUEVA RUTA: LOGIN Y REGISTRO CON MICROSOFT SSO
# ----------------------------------------------------
@router.post("/microsoft")
async def microsoft_login(ms_token: str = Form(...), db: Session = Depends(get_session)):
    """
    Atrapa el Token de Microsoft desde React, valida con Microsoft Graph API,
    crea la cuenta si no existe (Just-In-Time Provisioning) y devuelve tu token JWT.
    """
    
    # 1. Validar el token con la API oficial de Microsoft
    headers = {"Authorization": f"Bearer {ms_token}"}
    graph_response = requests.get("https://graph.microsoft.com/v1.0/me", headers=headers)

    if graph_response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de Microsoft inválido o expirado")

    # 2. Extraer los datos del usuario devueltos por Microsoft
    ms_user = graph_response.json()
    email = ms_user.get("mail") or ms_user.get("userPrincipalName")
    username = ms_user.get("displayName", "Usuario de Microsoft")

    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se pudo obtener el correo de Microsoft")

    # 3. Buscar si el usuario ya existe en tu base de datos
    consulta = select(User).where(User.email == email)
    usuario = db.exec(consulta).first()

    # 4. Si el usuario no existe, registrarlo automáticamente en Visual Vault
    if not usuario:
        usuario = User(
            username=username,
            email=email,
            # Le asignamos una contraseña encriptada falsa porque su seguridad ahora depende de Microsoft
            hashed_password="sso_microsoft_no_password_required", 
            birthdate="2000-01-01" # Valor por defecto si tu DB lo requiere
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

    # 5. Generar el Token de Visual Vault (igual que en el login normal)
    token_jwt = crear_token_acceso(data={"sub": str(usuario.id)})
    
    # Opcional: Aquí también podrías añadir el envío de correo de alerta de login si lo deseas
    
    return {
        "access_token": token_jwt, 
        "token_type": "bearer",
        "usuario_id": usuario.id,
        "username": usuario.username
    }