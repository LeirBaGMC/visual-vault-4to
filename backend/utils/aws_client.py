import os
import uuid
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# 1. Cargamos las credenciales desde el archivo .env
load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# 2. Inicializamos los "robots" de comunicación con Amazon (S3 y Rekognition)
try:
    # Cliente para Almacenamiento (S3)
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    
    # Cliente para Inteligencia Artificial (Rekognition)
    rekognition_client = boto3.client(
        'rekognition',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
except Exception as e:
    print(f"⚠️ Error al inicializar los clientes de AWS. Revisa tus credenciales. Detalles: {e}")


def analizar_imagen_nsfw(imagen_bytes: bytes) -> tuple[bool, list]:
    """
    Envía la imagen a Amazon Rekognition para detectar contenido +18 o sensible.
    Retorna una tupla: (Es_Segura: bool, Etiquetas_Detectadas: list)
    """
    try:
        # Llamamos a la IA de AWS para que analice los bytes
        respuesta = rekognition_client.detect_moderation_labels(
            Image={'Bytes': imagen_bytes},
            MinConfidence=75.0 # Umbral: Solo queremos etiquetas de las que la IA esté 75% o más segura
        )
        
        etiquetas_peligrosas = respuesta.get('ModerationLabels', [])
        
        # Si la lista está vacía, la imagen es completamente limpia.
        if len(etiquetas_peligrosas) > 0:
            # Extraemos los nombres exactos de las infracciones (ej: 'Explicit Nudity', 'Violence')
            nombres_etiquetas = [etiqueta['Name'] for etiqueta in etiquetas_peligrosas]
            print(f"🚨 Alerta IA: Contenido sensible detectado -> {nombres_etiquetas}")
            return False, nombres_etiquetas
            
        return True, []

    except ClientError as e:
        print(f"❌ Error en AWS Rekognition: {e}")
        # En caso de fallo de AWS, bloqueamos preventivamente
        return False, ["Error de validación AI con AWS"]


def subir_imagen_s3(archivo_bytes: bytes, nombre_original: str, content_type: str) -> str:
    """
    Toma los bytes de una imagen, la sube a Amazon S3 y devuelve la URL pública.
    """
    # Extraemos la extensión (ej. '.jpg' o '.png')
    extension = nombre_original.split('.')[-1]
    
    # Generamos un nombre único usando criptografía básica (UUID)
    # Resultado ej: 550e8400-e29b-41d4-a716-446655440000.jpg
    nombre_unico = f"{uuid.uuid4()}.{extension}"
    
    # Organizamos las fotos subidas por los usuarios en una carpeta especial
    ruta_s3 = f"uploads/usuarios/{nombre_unico}"
    
    try:
        # Disparamos el archivo hacia la nube
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=ruta_s3,
            Body=archivo_bytes,
            ContentType=content_type
        )
        
        # Armamos la URL pública exacta para guardarla en SQLite
        url_publica = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{ruta_s3}"
        return url_publica
        
    except ClientError as e:
        print(f"❌ Error de AWS al subir la imagen: {e}")
        return None