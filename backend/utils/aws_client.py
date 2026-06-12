import os
import uuid
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

try:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    
    rekognition_client = boto3.client(
        'rekognition',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
except Exception as e:
    print(f"Error al inicializar los clientes de AWS. Detalles: {e}")


def analizar_imagen_nsfw(imagen_bytes: bytes) -> tuple[bool, list]:
    tamano_mb = len(imagen_bytes) / (1024 * 1024)
    print(f"🤖 [IA] Evaluando imagen... Tamaño: {tamano_mb:.2f} MB")
    
    if tamano_mb > 5.0:
        print("❌ [IA] Bloqueo preventivo: La imagen supera los 5MB (Límite de AWS Rekognition)")
        return False, ["Imagen demasiado pesada para la IA (Máx 5MB)"]

    try:
        respuesta = rekognition_client.detect_moderation_labels(
            Image={'Bytes': imagen_bytes},
            MinConfidence=75.0
        )
        etiquetas_peligrosas = respuesta.get('ModerationLabels', [])
        
        if len(etiquetas_peligrosas) > 0:
            nombres_etiquetas = [etiqueta['Name'] for etiqueta in etiquetas_peligrosas]
            print(f"⚠️ [IA] Alerta de seguridad. Contenido bloqueado: {nombres_etiquetas}")
            return False, nombres_etiquetas
            
        print("✅ [IA] Imagen limpia y segura.")
        return True, []
        
    except ClientError as e:
        # Extraemos el mensaje de error exacto de Amazon
        codigo_error = e.response.get('Error', {}).get('Code', 'Desconocido')
        mensaje_error = e.response.get('Error', {}).get('Message', str(e))
        print(f"❌ [AWS FATAL] Fallo en Rekognition - Código: {codigo_error} | Detalle: {mensaje_error}")
        return False, [f"Error del proveedor de IA: {codigo_error}"]
        
    except Exception as e:
        print(f"❌ [SISTEMA] Error crítico inesperado en la IA: {e}")
        return False, ["Error de validación AI local"]


def subir_imagen_s3(archivo_bytes: bytes, nombre_original: str, content_type: str) -> str:
    extension = nombre_original.split('.')[-1]
    nombre_unico = f"{uuid.uuid4()}.{extension}"
    ruta_s3 = f"uploads/usuarios/{nombre_unico}"
    
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=ruta_s3,
            Body=archivo_bytes,
            ContentType=content_type
        )
        url_publica = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{ruta_s3}"
        return url_publica
    except ClientError as e:
        print(f"Error de AWS al subir la imagen: {e}")
        return None


def eliminar_imagen_s3_por_url(url_publica: str) -> bool:
    """
    Parsea la URL pública de AWS S3 para extraer el Key y eliminar el objeto
    evitando acumular basura en el bucket.
    """
    try:
        marcador = f"{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/"
        if marcador in url_publica:
            ruta_s3 = url_publica.split(marcador)[1]
            s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=ruta_s3)
            print(f"🗑️ Recurso S3 eliminado con éxito: {ruta_s3}")
            return True
        return False
    except ClientError as e:
        print(f"❌ Fallo al eliminar objeto en S3: {e}")
        return False