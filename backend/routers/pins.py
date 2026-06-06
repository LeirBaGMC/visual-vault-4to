from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlmodel import Session, select
from bdd import get_session
from models.schemas import Pin, PinCreate, User
from utils.aws_client import subir_imagen_s3, analizar_imagen_nsfw




router = APIRouter(
    prefix="/api/v1/pins",
    tags=["Curaduría de Pines"]
)

@router.post("/")
def crear_pin_manual(pin_data: PinCreate, db: Session = Depends(get_session)):
    
    nuevo_pin = Pin(
        title=pin_data.title,
        description=pin_data.description,
        image_url=pin_data.image_url,
        category=pin_data.category
    )
    
    db.add(nuevo_pin)
    db.commit()
    db.refresh(nuevo_pin)   
    
    return {"mensaje": "¡Éxito! Pin guardado en la base de datos", "pin": nuevo_pin}

@router.get("/")
def obtener_todos_los_pines(db: Session = Depends(get_session)):
    
    consulta = select(Pin)
    pines = db.exec(consulta).all()
    return pines

@router.delete("/{pin_id}")
def eliminar_pin(pin_id: int, db: Session = Depends(get_session)):
   
    pin_a_eliminar = db.get(Pin, pin_id)
    
    if not pin_a_eliminar:
        raise HTTPException(status_code=404, detail="Pin no encontrado")
    
    db.delete(pin_a_eliminar)
    db.commit()

    return {"mensaje": f"Pin {pin_id} eliminado exitosamente de la bóveda."}

@router.delete("/categoria/{nombre_categoria}")
def eliminar_pines_por_categoria(nombre_categoria: str, db: Session = Depends(get_session)):
 
    consulta = select(Pin).where(Pin.category == nombre_categoria)
    pines_a_eliminar = db.exec(consulta).all()
    
    if not pines_a_eliminar:
        raise HTTPException(status_code=404, detail=f"No se encontraron pines en la categoría '{nombre_categoria}'")
    
    cantidad = len(pines_a_eliminar)
    for pin in pines_a_eliminar:
        db.delete(pin)
        
    db.commit()
    
    return {"mensaje": f"¡Operación exitosa! Se eliminaron {cantidad} pines de la categoría '{nombre_categoria}'."}

@router.post("/upload/")
def subir_nuevo_pin(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    creator_id: int = Form(...), 
    file: UploadFile = File(...),
    db: Session = Depends(get_session)
):
    
    contenido_archivo = file.file.read()
    

    es_segura, etiquetas = analizar_imagen_nsfw(contenido_archivo)
    
    if not es_segura:
        
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail=f"Bloqueo de seguridad: La imagen contiene material no permitido ({', '.join(etiquetas)})."
        )
    # ==========================================
    
    
    url_publica_aws = subir_imagen_s3(
        archivo_bytes=contenido_archivo, 
        nombre_original=file.filename, 
        content_type=file.content_type
    )
    
    if not url_publica_aws:
        raise HTTPException(status_code=500, detail="Fallo catastrófico al subir a la nube.")
        
    
    nuevo_pin = Pin(
        title=title,
        description=description,
        category=category,
        image_url=url_publica_aws,
        creator_id=creator_id,
        is_sensitive=False 
    )

    
   
    db.add(nuevo_pin)
    db.commit()
    db.refresh(nuevo_pin)
    
    return {"mensaje": "¡Pin validado por IA y subido con éxito!", "pin": nuevo_pin}