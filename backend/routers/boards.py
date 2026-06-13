from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy import func

from bdd import get_session
from models.schemas import (
    Pin,
    User,
    Board,
    SavedPin,
    BoardCreate,
    BoardRead,
)
from core.security import obtener_usuario_actual

router = APIRouter(
    prefix="/api/v1/boards",
    tags=["Tableros"]
)


def _board_propio(board_id: int, usuario: User, db: Session) -> Board:
    board = db.get(Board, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Tablero no encontrado")
    if board.user_id != usuario.id:
        raise HTTPException(status_code=403, detail="Este tablero no te pertenece")
    return board


def _portadas(board_id: int, db: Session, limite: int = 3) -> List[str]:
    filas = db.exec(
        select(Pin.image_url)
        .join(SavedPin, SavedPin.pin_id == Pin.id)
        .where(SavedPin.board_id == board_id)
        .order_by(SavedPin.created_at.desc())
        .limit(limite)
    ).all()
    return list(filas)


def _contar(board_id: int, db: Session) -> int:
    return db.exec(
        select(func.count()).select_from(SavedPin).where(SavedPin.board_id == board_id)
    ).one()


@router.get("/", response_model=List[BoardRead])
def listar_mis_tableros(
    db: Session = Depends(get_session),
    usuario: User = Depends(obtener_usuario_actual),
):
    boards = db.exec(
        select(Board).where(Board.user_id == usuario.id).order_by(Board.created_at.desc())
    ).all()
    return [
        BoardRead(
            id=b.id,
            name=b.name,
            pin_count=_contar(b.id, db),
            covers=_portadas(b.id, db),
        )
        for b in boards
    ]


@router.post("/", response_model=BoardRead, status_code=status.HTTP_201_CREATED)
def crear_tablero(
    datos: BoardCreate,
    db: Session = Depends(get_session),
    usuario: User = Depends(obtener_usuario_actual),
):
    nombre = datos.name.strip()
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre del tablero no puede estar vacío.")

    board = Board(name=nombre, user_id=usuario.id)
    db.add(board)
    db.commit()
    db.refresh(board)
    return BoardRead(id=board.id, name=board.name, pin_count=0, covers=[])


@router.get("/{board_id}")
def ver_tablero(
    board_id: int,
    db: Session = Depends(get_session),
    usuario: User = Depends(obtener_usuario_actual),
):
    board = _board_propio(board_id, usuario, db)
    pines = db.exec(
        select(Pin)
        .join(SavedPin, SavedPin.pin_id == Pin.id)
        .where(SavedPin.board_id == board_id)
        .order_by(SavedPin.created_at.desc())
    ).all()
    return {"id": board.id, "name": board.name, "pins": pines}


@router.delete("/{board_id}")
def eliminar_tablero(
    board_id: int,
    db: Session = Depends(get_session),
    usuario: User = Depends(obtener_usuario_actual),
):
    board = _board_propio(board_id, usuario, db)
    # Quitamos primero los pines guardados (no borra los Pin originales).
    for sp in db.exec(select(SavedPin).where(SavedPin.board_id == board_id)).all():
        db.delete(sp)
    db.delete(board)
    db.commit()
    return {"mensaje": f"Tablero '{board.name}' eliminado."}


@router.post("/{board_id}/pins", status_code=status.HTTP_201_CREATED)
def guardar_pin(
    board_id: int,
    payload: dict,
    db: Session = Depends(get_session),
    usuario: User = Depends(obtener_usuario_actual),
):
    _board_propio(board_id, usuario, db)

    pin_id = payload.get("pin_id")
    if pin_id is None:
        raise HTTPException(status_code=400, detail="Falta 'pin_id'.")
    if not db.get(Pin, pin_id):
        raise HTTPException(status_code=404, detail="Pin no encontrado")

    existente = db.exec(
        select(SavedPin).where(SavedPin.board_id == board_id, SavedPin.pin_id == pin_id)
    ).first()
    if existente:
        return {"mensaje": "El pin ya estaba en este tablero.", "saved": True}

    db.add(SavedPin(board_id=board_id, pin_id=pin_id))
    db.commit()
    return {"mensaje": "Pin guardado en el tablero.", "saved": True}


@router.delete("/{board_id}/pins/{pin_id}")
def quitar_pin(
    board_id: int,
    pin_id: int,
    db: Session = Depends(get_session),
    usuario: User = Depends(obtener_usuario_actual),
):
    _board_propio(board_id, usuario, db)
    sp = db.exec(
        select(SavedPin).where(SavedPin.board_id == board_id, SavedPin.pin_id == pin_id)
    ).first()
    if not sp:
        raise HTTPException(status_code=404, detail="El pin no está en este tablero")
    db.delete(sp)
    db.commit()
    return {"mensaje": "Pin quitado del tablero.", "saved": False}
