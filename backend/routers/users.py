import os
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlmodel import Session, select
from bdd import get_session
from models.schemas import User, UserCreate, UserRead, VerifyRequest, ResendRequest
from core.security import obtener_hash_password, obtener_usuario_actual, crear_token_acceso
from core.codes import generar_codigo, validar_codigo
from utils.email_service import enviar_correo_bienvenida, enviar_codigo_verificacion


router = APIRouter(
    prefix="/api/v1/users",
    tags=["Gestión de Usuarios"]
)


@router.get("/me", response_model=UserRead)
def usuario_actual(usuario: User = Depends(obtener_usuario_actual)):
    """Devuelve los datos del usuario autenticado (incluye is_admin)."""
    return usuario


@router.post("/")
def registrar_usuario(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
    """Crea la cuenta INACTIVA y envía un código de verificación al correo.
    La cuenta no se activa hasta confirmar el código en /users/verify."""
    existente = db.exec(select(User).where(User.email == user_data.email)).first()

    if existente and existente.is_active:
        raise HTTPException(status_code=400, detail="Este correo electrónico ya está registrado.")

    # La cuenta definida en ADMIN_EMAIL se crea ya como administradora.
    es_admin = user_data.email == os.getenv("ADMIN_EMAIL")

    if existente and not existente.is_active:
        # Reintento de un registro nunca verificado: actualizamos los datos.
        existente.username = user_data.username
        existente.birthdate = user_data.birthdate
        existente.hashed_password = obtener_hash_password(user_data.password)
        existente.is_admin = es_admin
        usuario = existente
    else:
        usuario = User(
            username=user_data.username,
            email=user_data.email,
            birthdate=user_data.birthdate,
            hashed_password=obtener_hash_password(user_data.password),
            is_admin=es_admin,
            is_active=False,
        )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    codigo = generar_codigo(db, usuario.email, "register")
    background_tasks.add_task(enviar_codigo_verificacion, usuario.email, codigo, "register")

    return {
        "requires_verification": True,
        "email": usuario.email,
        "message": "Te enviamos un código de 6 dígitos a tu correo.",
    }


@router.post("/verify")
def verificar_registro(datos: VerifyRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
    """Verifica el código de registro, activa la cuenta y devuelve el token (login automático)."""
    usuario = db.exec(select(User).where(User.email == datos.email)).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="No existe una cuenta con ese correo.")

    if not validar_codigo(db, datos.email, datos.code, "register"):
        raise HTTPException(status_code=400, detail="Código inválido o expirado.")

    usuario.is_active = True
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    background_tasks.add_task(enviar_correo_bienvenida, usuario.email, usuario.username)
    token_jwt = crear_token_acceso(data={"sub": str(usuario.id)})

    return {
        "access_token": token_jwt,
        "token_type": "bearer",
        "usuario_id": usuario.id,
        "username": usuario.username,
        "is_admin": usuario.is_admin,
    }


@router.post("/resend-code")
def reenviar_codigo(datos: ResendRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
    """Reenvía un código (registro o login) al correo indicado."""
    if datos.purpose not in ("register", "login"):
        raise HTTPException(status_code=400, detail="Propósito inválido.")

    usuario = db.exec(select(User).where(User.email == datos.email)).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="No existe una cuenta con ese correo.")

    codigo = generar_codigo(db, datos.email, datos.purpose)
    background_tasks.add_task(enviar_codigo_verificacion, datos.email, codigo, datos.purpose)
    return {"message": "Código reenviado."}