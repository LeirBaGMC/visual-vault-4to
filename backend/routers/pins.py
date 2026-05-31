from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session,select
from bdd import get_session
from models.schemas import Pin, PinCreate
from utils.aws_client import subir_imagen_s3

# Creamos el enrutador específico para los pines
router = APIRouter(
    prefix="/api/v1/pins",
    tags=["Curaduría de Pines"]
)

# Nota que ahora solo usamos "/" porque el prefijo ya tiene la ruta completa
@router.post("/")
def crear_pin_manual(pin_data: PinCreate, db: Session = Depends(get_session)):
    """
    Registra un nuevo Pin en la base de datos usando la URL de Amazon S3.
    """
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
    """Entrega la lista de pines a la interfaz de React"""
    consulta = select(Pin)
    pines = db.exec(consulta).all()
    return pines

@router.delete("/{pin_id}")
def eliminar_pin(pin_id: int, db: Session = Depends(get_session)):
    """
    Elimina un pin de la base de datos usando su ID.
    """
    # 1. Buscamos el pin en la base de datos
    pin_a_eliminar = db.get(Pin, pin_id)
    
    # 2. Si no existe, lanzamos un error 404
    if not pin_a_eliminar:
        raise HTTPException(status_code=404, detail="Pin no encontrado")
    
    # 3. Si existe, lo borramos y guardamos los cambios
    db.delete(pin_a_eliminar)
    db.commit()

    return {"mensaje": f"Pin {pin_id} eliminado exitosamente de la bóveda."}

@router.delete("/categoria/{nombre_categoria}")
def eliminar_pines_por_categoria(nombre_categoria: str, db: Session = Depends(get_session)):
    """
    Elimina TODOS los pines que pertenezcan a una categoría específica (Bulk Delete).
    """
    # 1. Buscamos todos los pines que coincidan exactamente con el nombre de la categoría
    consulta = select(Pin).where(Pin.category == nombre_categoria)
    pines_a_eliminar = db.exec(consulta).all()
    
    # 2. Si la base de datos no encuentra nada, avisamos
    if not pines_a_eliminar:
        raise HTTPException(status_code=404, detail=f"No se encontraron pines en la categoría '{nombre_categoria}'")
    
    # 3. Recorremos la lista y borramos uno por uno de la memoria
    cantidad = len(pines_a_eliminar)
    for pin in pines_a_eliminar:
        db.delete(pin)
        
    # 4. Hacemos el "commit" para aplicar la destrucción en SQLite
    db.commit()
    
    return {"mensaje": f"¡Operación exitosa! Se eliminaron {cantidad} pines de la categoría '{nombre_categoria}'."}

@router.post("/upload/")
def subir_nuevo_pin(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    creator_id: int = Form(...), # Por ahora lo pedimos manual, luego lo sacaremos del token JWT
    file: UploadFile = File(...),
    db: Session = Depends(get_session)
):
    """
    Recibe una imagen desde el frontend, la sube a Amazon S3, 
    y guarda el registro en la base de datos SQLite.
    """
    # 1. Extraemos los bytes de la imagen
    contenido_archivo = file.file.read()
    
    # 2. Enviamos la imagen a la nube usando tu cliente de AWS
    url_publica_aws = subir_imagen_s3(
        archivo_bytes=contenido_archivo, 
        nombre_original=file.filename, 
        content_type=file.content_type
    )
    
    # 3. Verificamos que AWS no haya fallado
    if not url_publica_aws:
        raise HTTPException(status_code=500, detail="Fallo catastrófico al subir a la nube.")
        
    # 4. Creamos el registro para la base de datos usando la URL que nos dio Amazon
    nuevo_pin = Pin(
        title=title,
        description=description,
        category=category,
        image_url=url_publica_aws,
        creator_id=creator_id
    )
    
    # 5. Guardamos en SQLite
    db.add(nuevo_pin)
    db.commit()
    db.refresh(nuevo_pin)
    
    return {"mensaje": "¡Pin subido con éxito!", "pin": nuevo_pin}