import os
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import inspect, text
from dotenv import load_dotenv
# IMPORTANTE: Importamos los modelos aquí para que SQLModel los registre en la memoria
from models.schemas import User, Pin, Like, Comment, Board, SavedPin, VerificationCode

load_dotenv()

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=True, connect_args=connect_args)


def _migrar_is_admin():
    """Añade la columna is_admin a tablas existentes (SQLite no lo hace con create_all)
    y promueve a admin la cuenta indicada en ADMIN_EMAIL. Idempotente."""
    columnas = [c["name"] for c in inspect(engine).get_columns("user")]
    with engine.begin() as conn:
        if "is_admin" not in columnas:
            conn.execute(
                text("ALTER TABLE user ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0")
            )
            print("[MIGRACIÓN] Columna 'is_admin' añadida a 'user'.")

        admin_email = os.getenv("ADMIN_EMAIL")
        if admin_email:
            res = conn.execute(
                text("UPDATE user SET is_admin = 1 WHERE email = :e"),
                {"e": admin_email},
            )
            if res.rowcount:
                print(f"[MIGRACIÓN] {res.rowcount} usuario(s) promovido(s) a admin ({admin_email}).")


def _migrar_pin_created_at():
    """Añade created_at a 'pin' y rellena las filas existentes con la fecha actual."""
    from datetime import datetime, timezone

    columnas = [c["name"] for c in inspect(engine).get_columns("pin")]
    with engine.begin() as conn:
        if "created_at" not in columnas:
            conn.execute(text("ALTER TABLE pin ADD COLUMN created_at TIMESTAMP"))
            conn.execute(
                text("UPDATE pin SET created_at = :now WHERE created_at IS NULL"),
                {"now": datetime.now(timezone.utc).isoformat()},
            )
            print("[MIGRACIÓN] Columna 'created_at' añadida a 'pin'.")


def _migrar_pin_link():
    """Añade la columna link (enlace externo) a 'pin' si no existe."""
    columnas = [c["name"] for c in inspect(engine).get_columns("pin")]
    if "link" not in columnas:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE pin ADD COLUMN link TEXT"))
            print("[MIGRACIÓN] Columna 'link' añadida a 'pin'.")


def _migrar_user_perfil():
    """Añade columnas de perfil (name, bio, website) a 'user' si faltan."""
    columnas = [c["name"] for c in inspect(engine).get_columns("user")]
    nuevas = {"name": "TEXT", "bio": "TEXT", "website": "TEXT"}
    faltantes = {c: t for c, t in nuevas.items() if c not in columnas}
    if faltantes:
        with engine.begin() as conn:
            for col, tipo in faltantes.items():
                conn.execute(text(f"ALTER TABLE user ADD COLUMN {col} {tipo}"))
            print(f"[MIGRACIÓN] Columnas de perfil añadidas a 'user': {list(faltantes)}")


def init_db():
    SQLModel.metadata.create_all(engine)
    _migrar_is_admin()
    _migrar_pin_created_at()
    _migrar_pin_link()
    _migrar_user_perfil()

def get_session():
    with Session(engine) as session:
        yield session