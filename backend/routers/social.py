from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy import func

from bdd import get_session
from models.schemas import Pin, User, Like, Comment, CommentCreate, CommentRead
from core.security import obtener_usuario_actual, obtener_usuario_opcional

router = APIRouter(
    prefix="/api/v1/pins",
    tags=["Social (Likes y Comentarios)"]
)


def _verificar_pin(pin_id: int, db: Session) -> Pin:
    pin = db.get(Pin, pin_id)
    if not pin:
        raise HTTPException(status_code=404, detail="Pin no encontrado")
    return pin


def _contar_likes(pin_id: int, db: Session) -> int:
    return db.exec(
        select(func.count()).select_from(Like).where(Like.pin_id == pin_id)
    ).one()


# ==========================================
# LIKES
# ==========================================

@router.get("/{pin_id}/likes")
def obtener_likes(
    pin_id: int,
    db: Session = Depends(get_session),
    usuario: Optional[User] = Depends(obtener_usuario_opcional),
):
    _verificar_pin(pin_id, db)
    liked_by_me = False
    if usuario:
        existente = db.exec(
            select(Like).where(Like.pin_id == pin_id, Like.user_id == usuario.id)
        ).first()
        liked_by_me = existente is not None
    return {"likes_count": _contar_likes(pin_id, db), "liked_by_me": liked_by_me}


@router.post("/{pin_id}/like")
def alternar_like(
    pin_id: int,
    db: Session = Depends(get_session),
    usuario: User = Depends(obtener_usuario_actual),
):
    """Alterna el 'me gusta' del usuario actual. Máximo 1 like por usuario y pin."""
    _verificar_pin(pin_id, db)

    existente = db.exec(
        select(Like).where(Like.pin_id == pin_id, Like.user_id == usuario.id)
    ).first()

    if existente:
        db.delete(existente)
        db.commit()
        liked = False
    else:
        db.add(Like(user_id=usuario.id, pin_id=pin_id))
        db.commit()
        liked = True

    return {"liked": liked, "likes_count": _contar_likes(pin_id, db)}


# ==========================================
# COMENTARIOS
# ==========================================

@router.get("/{pin_id}/comments", response_model=List[CommentRead])
def listar_comentarios(pin_id: int, db: Session = Depends(get_session)):
    _verificar_pin(pin_id, db)
    comentarios = db.exec(
        select(Comment).where(Comment.pin_id == pin_id).order_by(Comment.created_at)
    ).all()

    # Resolvemos los nombres de usuario en una sola consulta.
    user_ids = {c.user_id for c in comentarios}
    usuarios = {}
    if user_ids:
        for u in db.exec(select(User).where(User.id.in_(user_ids))).all():
            usuarios[u.id] = u.username

    return [
        CommentRead(
            id=c.id,
            text=c.text,
            user_id=c.user_id,
            username=usuarios.get(c.user_id, "Usuario"),
            created_at=c.created_at,
        )
        for c in comentarios
    ]


@router.post("/{pin_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def crear_comentario(
    pin_id: int,
    datos: CommentCreate,
    db: Session = Depends(get_session),
    usuario: User = Depends(obtener_usuario_actual),
):
    _verificar_pin(pin_id, db)

    texto = datos.text.strip()
    if not texto:
        raise HTTPException(status_code=400, detail="El comentario no puede estar vacío.")

    comentario = Comment(text=texto, user_id=usuario.id, pin_id=pin_id)
    db.add(comentario)
    db.commit()
    db.refresh(comentario)

    return CommentRead(
        id=comentario.id,
        text=comentario.text,
        user_id=comentario.user_id,
        username=usuario.username,
        created_at=comentario.created_at,
    )
