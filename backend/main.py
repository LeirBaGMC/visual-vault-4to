import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import Session
from bdd import init_db, get_session
from models.schemas import Pin, PinCreate
from routers import pins, users, auth, social, boards


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[SERVER] Creando/Verificando base de datos SQLite...")
    init_db()
    print("[SERVER] ¡Base de datos lista!")
    yield
    print("[SERVER] Apagando el servidor...")

app = FastAPI(
    title="API Visual Vault",
    description="Motor backend para la subida de secciones",
    version="1.0.0",
    lifespan=lifespan
)

# Orígenes permitidos por CORS. Configurables por entorno para producción (EC2):
# CORS_ORIGINS="https://tu-dominio.com,https://www.tu-dominio.com"
_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",") if o.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(pins.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(social.router)
app.include_router(boards.router)

@app.get("/", tags=["Estado"])
def estado_servidor():
    return {"status": "online", "message": "Ve a http://127.0.0.1:8000/docs para registrar pines"}

