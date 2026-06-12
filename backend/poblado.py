import os
import requests
import boto3
import urllib.parse # <-- LIBRERÍA NUEVA PARA CODIFICAR URLs
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# 1. Cargar credenciales desde tu archivo .env
load_dotenv()

# ==========================================
# CONFIGURACIÓN DEL CTO
# ==========================================
NOMBRE_BUCKET = os.getenv("S3_BUCKET_NAME", "visual-vault-4to-semestre")
REGION = os.getenv("AWS_REGION", "us-east-1")
URL_BASE_S3 = f"https://{NOMBRE_BUCKET}.s3.{REGION}.amazonaws.com"
API_URL = "http://127.0.0.1:8000/api/v1/pins/"

# Inicializamos el motor de subida de AWS
try:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=REGION
    )
except Exception as e:
    print(f"❌ Error crítico al inicializar AWS S3. Revisa tu archivo .env: {e}")
    exit()

def sembrar_y_subir(carpeta_raiz="Pics"):
    print("🚀 Iniciando Drone de Carga Masiva (Subida a S3 + Base de Datos)...")
    
    if not os.path.exists(carpeta_raiz):
        print(f"❌ Error: No se encuentra la carpeta '{carpeta_raiz}'. Ejecuta recolector.py primero.")
        return

    contador_exitos = 0
    
    # Consultamos qué hay en la base de datos para no duplicar
    print("[*] Verificando inventario actual...")
    try:
        respuesta_db = requests.get(API_URL)
        urls_existentes = {pin["image_url"] for pin in respuesta_db.json()} if respuesta_db.status_code == 200 else set()
    except Exception:
        urls_existentes = set()
        print("⚠️ Advertencia: No se pudo conectar a FastAPI. ¿Está encendido el servidor?")

    for raiz, directorios, archivos in os.walk(carpeta_raiz):
        for archivo in archivos:
            if archivo.startswith('.'): 
                continue
                
            partes_ruta = os.path.relpath(raiz, carpeta_raiz).split(os.sep)
            categoria = partes_ruta[0].replace('_', ' ').title()
            
            # Construimos la ruta exacta que tendrá en S3
            ruta_s3 = f"{carpeta_raiz}/{categoria}/{archivo}".replace("\\", "/")
            
            # --- LA MAGIA ANTIMANCHAS NEGRAS ---
            # urllib.parse.quote transforma espacios en %20, y safe='/' protege las carpetas
            ruta_s3_segura = urllib.parse.quote(ruta_s3, safe='/')
            url_imagen_aws = f"{URL_BASE_S3}/{ruta_s3_segura}"

            # Filtro anti-duplicados
            if url_imagen_aws in urls_existentes:
                print(f"[-] Saltando {archivo} (Ya existe en tu bóveda)")
                continue
            
            ruta_local = os.path.join(raiz, archivo)
            titulo_frontend = f"Concepto de {categoria}"

            # ========================================================
            # PASO 1: SUBIR FÍSICAMENTE LA IMAGEN AL BUCKET DE AWS S3
            # ========================================================
            try:
                # Le decimos a AWS que es una imagen para que se vea en el navegador y no se descargue como archivo
                content_type = "image/png" if archivo.lower().endswith(".png") else "image/jpeg"
                
                s3_client.upload_file(
                    ruta_local, 
                    NOMBRE_BUCKET, 
                    ruta_s3,
                    ExtraArgs={'ContentType': content_type}
                )
                print(f"☁️ [S3] Archivo subido con éxito: {archivo}")
            except ClientError as e:
                print(f"❌ [AWS Error] Fallo al subir {archivo} al bucket: {e}")
                continue # Si falla la subida, saltamos a la siguiente imagen

            # ========================================================
            # PASO 2: INYECTAR LOS DATOS Y LA URL EN FASTAPI
            # ========================================================
            paquete_datos = {
                "title": titulo_frontend,
                "description": f"Referencia visual de alta resolución extraída para la sección de {categoria}.",
                "image_url": url_imagen_aws, # <-- USAMOS LA URL SEGURA
                "category": categoria,
                "is_sensitive": False,
                "creator_id": 1
            }
            
            try:
                respuesta = requests.post(API_URL, json=paquete_datos)
                if respuesta.status_code == 200:
                    print(f"✅ [BD] Registrado en el sistema como '{titulo_frontend}'")
                    contador_exitos += 1
                else:
                    print(f"⚠️ [BD Fallo]: {respuesta.text}")
            except Exception as e:
                print(f"❌ Error de conexión con la Base de Datos: {e}")
                
    print("=" * 50)
    print(f"🎉 ¡Operación completada! Se subieron {contador_exitos} imágenes a S3 y se registraron en el sistema.")

if __name__ == "__main__":
    sembrar_y_subir()