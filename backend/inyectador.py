import requests
import boto3
from botocore import UNSIGNED
from botocore.config import Config

# ==========================================
# CONFIGURACIÓN DEL CLOUD INYECTOR
# ==========================================
NOMBRE_BUCKET = "visual-vault-4to-semestre"
REGION = "us-east-1"
URL_BASE_S3 = f"https://{NOMBRE_BUCKET}.s3.{REGION}.amazonaws.com"

# La URL de tu servidor local FastAPI
API_URL = "http://127.0.0.1:8000/api/v1/pins/"

def inyectar_desde_s3():
    print("🚀 Iniciando protocolo de inyección directa desde AWS S3...")
    
    # 1. Conectar a AWS S3
    # Nota: Usamos UNSIGNED por si el bucket es de acceso público para lectura. 
    # Si tu bucket es privado, borra 'config=Config(...)' para que use tus credenciales de AWS CLI.
    s3 = boto3.client('s3', region_name=REGION, config=Config(signature_version=UNSIGNED))
    
    # 2. Obtener el inventario actual de la base de datos local para evitar duplicados
    print("[*] Consultando base de datos local...")
    titulos_existentes = set()
    try:
        respuesta_db = requests.get(API_URL)
        if respuesta_db.status_code == 200:
            pines_db = respuesta_db.json()
            titulos_existentes = {pin["title"] for pin in pines_db}
    except Exception as e:
        print(f"❌ Error al conectar con FastAPI: {e}")
        print("💡 Asegúrate de que FastAPI esté corriendo en la otra terminal (fastapi dev main.py)")
        return

    # 3. Escanear el Bucket de AWS S3 usando un Paginador (soporta más de 1000 archivos)
    print(f"[*] Conectando al bucket '{NOMBRE_BUCKET}' y listando objetos...")
    try:
        paginator = s3.get_paginator('list_objects_v2')
        # Filtramos para que solo lea lo que esté dentro de la ruta 'Pics/'
        pages = paginator.paginate(Bucket=NOMBRE_BUCKET, Prefix="Pics/")
        
        contador_exitos = 0
        
        for page in pages:
            if "Contents" not in page:
                print("⚠️ No se encontraron archivos con el prefijo 'Pics/' en el bucket.")
                return
                
            for obj in page["Contents"]:
                key = obj["Key"]  # Ejemplo: "Pics/Outfits/000001.jpg"
                
                # Ignorar carpetas vacías o archivos ocultos de sistema
                if key.endswith('/') or '/.' in key:
                    continue
                    
                # Solo procesamos imágenes válidas
                if not (key.lower().endswith('.jpg') or key.lower().endswith('.png') or key.lower().endswith('.jpeg')):
                    continue
                
                # Descomponer la ruta de AWS S3 para extraer la categoría y el archivo
                # "Pics/Outfits/000001.jpg".split('/') -> ['Pics', 'Outfits', '000001.jpg']
                partes_ruta = key.split('/')
                if len(partes_ruta) < 3:
                    continue # Salta archivos sueltos fuera de las subcarpetas
                    
                categoria = partes_ruta[1]
                nombre_archivo = partes_ruta[2]
                
                # Formateamos el título exactamente igual que antes para que la magia anti-duplicados funcione
                titulo_limpio = f"Pin {nombre_archivo.replace('.jpg', '').replace('.png', '').replace('.jpeg', '')}"
                
                # --- LA MAGIA ANTI-DUPLICADOS ---
                if titulo_limpio in titulos_existentes:
                    print(f"[-] Saltando {titulo_limpio} (Ya existe en tu BD local)")
                    continue
                
                # Construimos la URL pública del objeto que ya está guardado en AWS
                url_imagen_aws = f"{URL_BASE_S3}/{key}"
                
                # Armamos el paquete de datos para tu FastAPI
                paquete_datos = {
                    "title": titulo_limpio,
                    "description": f"Contenido recuperado de S3 para la sección de {categoria.replace('_', ' ').title()}",
                    "image_url": url_imagen_aws,
                    "category": categoria.replace('_', ' ').title(),
                    "is_sensitive": False,
                    "creator_id": 1
                }
                
                # Disparamos el POST a tu FastAPI local para guardarlo en la Base de Datos SQLite
                try:
                    respuesta = requests.post(API_URL, json=paquete_datos)
                    if respuesta.status_code == 200:
                        print(f"✅ Éxito: {titulo_limpio} ('{categoria}') registrado en la BD local.")
                        contador_exitos += 1
                    else:
                        print(f"⚠️ Fallo al registrar {titulo_limpio}: {respuesta.text}")
                except Exception as e:
                    print(f"❌ Error de conexión al enviar el pin {titulo_limpio}: {e}")
                    
        print("=" * 50)
        print(f"🎉 ¡Inyección completada! Se sincronizaron {contador_exitos} pines desde S3 a tu base de datos.")

    except Exception as e:
        print(f"❌ Error crítico al leer el bucket de AWS: {e}")

if __name__ == "__main__":
    inyectar_desde_s3()