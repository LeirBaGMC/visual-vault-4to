import os
import secrets
import httpx  # Necesario agregar a requirements.txt
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from bdd import get_session
from models.schemas import User, VerifyRequest
from core.security import verificar_password, crear_token_acceso, obtener_hash_password
from core.codes import generar_codigo, validar_codigo
from utils.email_service import enviar_alerta_login, enviar_codigo_verificacion
from datetime import datetime

router = APIRouter(
    prefix="/api/v1",
    tags=["Autenticación"]
)


def _respuesta_token(usuario: User) -> dict:
    return {
        "access_token": crear_token_acceso(data={"sub": str(usuario.id)}),
        "token_type": "bearer",
        "usuario_id": usuario.id,
        "username": usuario.username,
        "is_admin": usuario.is_admin,
    }


@router.post("/login")
def iniciar_sesion(background_tasks: BackgroundTasks, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)):
    """Paso 1 del login: verifica la contraseña y envía un código 2FA al correo.
    No devuelve token todavía (ver /login/verify)."""
    consulta = select(User).where(User.email == form_data.username)
    usuario = db.exec(consulta).first()

    if not usuario or not verificar_password(form_data.password, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Cuenta registrada pero nunca verificada → mandamos código de registro.
    if not usuario.is_active:
        codigo = generar_codigo(db, usuario.email, "register")
        background_tasks.add_task(enviar_codigo_verificacion, usuario.email, codigo, "register")
        return {"requires_verification": True, "email": usuario.email}

    # 2FA: enviamos código de inicio de sesión.
    codigo = generar_codigo(db, usuario.email, "login")
    background_tasks.add_task(enviar_codigo_verificacion, usuario.email, codigo, "login")
    return {"requires_2fa": True, "email": usuario.email}


@router.post("/login/verify")
def verificar_login(datos: VerifyRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
    """Paso 2 del login: valida el código 2FA y devuelve el token de acceso."""
    usuario = db.exec(select(User).where(User.email == datos.email)).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="No existe una cuenta con ese correo.")

    if not validar_codigo(db, datos.email, datos.code, "login"):
        raise HTTPException(status_code=400, detail="Código inválido o expirado.")

    # Por si la cuenta ADMIN_EMAIL aún no estaba marcada como admin.
    if usuario.email == os.getenv("ADMIN_EMAIL") and not usuario.is_admin:
        usuario.is_admin = True
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

    background_tasks.add_task(enviar_alerta_login, usuario.email, usuario.username)
    return _respuesta_token(usuario)

@router.post("/microsoft")
async def microsoft_login(ms_token: str = Form(...), db: Session = Depends(get_session)):
    headers = {"Authorization": f"Bearer {ms_token}"}
    
    # CORREGIDO: Cliente asíncrono no bloqueante
    async with httpx.AsyncClient() as client:
        graph_response = await client.get("https://graph.microsoft.com/v1.0/me", headers=headers)

    if graph_response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de Microsoft inválido o expirado")

    ms_user = graph_response.json()
    email = ms_user.get("mail") or ms_user.get("userPrincipalName")
    username = ms_user.get("displayName", "Usuario de Microsoft")

    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se pudo obtener el correo de Microsoft")

    consulta = select(User).where(User.email == email)
    usuario = db.exec(consulta).first()

    if not usuario:
        fecha_por_defecto = datetime.strptime("2000-01-01", "%Y-%m-%d").date()
        
        # CORREGIDO: Se inyecta un hash Bcrypt válido pero de un string aleatorio inescrutable.
        # Esto previene errores de Passlib en verificaciones concurrentes o ataques dirigidos.
        password_imposible = secrets.token_urlsafe(32)
        
        usuario = User(
            username=username,
            email=email,
            hashed_password=obtener_hash_password(password_imposible),
            birthdate=fecha_por_defecto,
            is_admin=(email == os.getenv("ADMIN_EMAIL")),
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
    elif usuario.email == os.getenv("ADMIN_EMAIL") and not usuario.is_admin:
        usuario.is_admin = True
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

    token_jwt = crear_token_acceso(data={"sub": str(usuario.id)})

    return {
        "access_token": token_jwt,
        "token_type": "bearer",
        "usuario_id": usuario.id,
        "username": usuario.username,
        "is_admin": usuario.is_admin,
    }