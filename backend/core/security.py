import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext

# 1. Cargamos las credenciales desde tu archivo .env
load_dotenv()

# --- TUS FUNCIONES ACTUALES DE PASSLIB SE QUEDAN AQUÍ ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def obtener_hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verificar_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ==========================================
# NUEVO: FÁBRICA DE TOKENS JWT (Segurizada)
# ==========================================

# 2. Extraemos la firma secreta del entorno de forma segura
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "clave_de_respaldo_por_si_acaso")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # El pasaporte expira en 1 hora

def crear_token_acceso(data: dict):
    """Genera un pasaporte digital firmado para el usuario"""
    datos_a_codificar = data.copy()
    
    # Calculamos la hora de muerte del token
    expiracion = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    datos_a_codificar.update({"exp": expiracion})
    
    # Creamos la firma criptográfica usando la llave de tu .env
    token_jwt = jwt.encode(datos_a_codificar, SECRET_KEY, algorithm=ALGORITHM)
    
    return token_jwt