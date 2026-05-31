from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import Session
from bdd import init_db, get_session
from models.schemas import Pin, PinCreate
from routers import pins, users, auth

# Definimos qué hace el servidor al prenderse
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

# Permisos para que el HTML/React pueda hablar con este archivo después
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(pins.router)
app.include_router(users.router)
app.include_router(auth.router)

@app.get("/", tags=["Estado"])
def estado_servidor():
    return {"status": "online", "message": "Ve a http://127.0.0.1:8000/docs para registrar pines"}

