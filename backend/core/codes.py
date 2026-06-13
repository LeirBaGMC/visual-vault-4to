import secrets
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select
from models.schemas import VerificationCode

CODE_TTL_MIN = 10  # los códigos caducan a los 10 minutos


def generar_codigo(db: Session, email: str, purpose: str) -> str:
    """Genera un código de 6 dígitos, invalida los anteriores y lo guarda."""
    # Marcamos como usados los códigos previos no consumidos del mismo propósito.
    previos = db.exec(
        select(VerificationCode).where(
            VerificationCode.email == email,
            VerificationCode.purpose == purpose,
            VerificationCode.used == False,  # noqa: E712
        )
    ).all()
    for vc in previos:
        vc.used = True
        db.add(vc)

    code = f"{secrets.randbelow(1_000_000):06d}"
    db.add(
        VerificationCode(
            email=email,
            code=code,
            purpose=purpose,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=CODE_TTL_MIN),
        )
    )
    db.commit()
    return code


def validar_codigo(db: Session, email: str, code: str, purpose: str) -> bool:
    """Valida el código más reciente para (email, purpose). Lo consume si es válido."""
    vc = db.exec(
        select(VerificationCode)
        .where(
            VerificationCode.email == email,
            VerificationCode.purpose == purpose,
            VerificationCode.used == False,  # noqa: E712
        )
        .order_by(VerificationCode.id.desc())
    ).first()

    if not vc or vc.code != code.strip():
        return False

    # Comparación de expiración robusta ante fechas naive/aware.
    exp = vc.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        return False

    vc.used = True
    db.add(vc)
    db.commit()
    return True
