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

# El backend (servicio systemd) escucha aquí
API_URL = "http://127.0.0.1:8000/api/v1/pins/"

EXTENSIONES_VALIDAS = (".jpg", ".jpeg", ".png", ".webp")


def inyectar_desde_s3():
    print("🚀 Iniciando inyección desde AWS S3...")

    # Acceso anónimo (UNSIGNED) si el bucket es de lectura pública.
    # Si tu bucket es privado, quita 'config=Config(...)' y usa credenciales AWS CLI.
    s3 = boto3.client("s3", region_name=REGION, config=Config(signature_version=UNSIGNED))

    # 1. Deduplicamos por URL de imagen (no por título): así re-ejecutar NO duplica.
    print("[*] Consultando base de datos local...")
    urls_existentes = set()
    try:
        respuesta_db = requests.get(API_URL, timeout=10)
        if respuesta_db.status_code == 200:
            urls_existentes = {p.get("image_url") for p in respuesta_db.json()}
    except Exception as e:
        print(f"❌ No se pudo conectar con FastAPI: {e}")
        print("💡 Asegúrate de que el servicio 'visualvault' esté corriendo (systemctl status visualvault).")
        return

    # 2. Listar el bucket (solo lo que está bajo 'Pics/')
    print(f"[*] Listando objetos de '{NOMBRE_BUCKET}/Pics/'...")
    contadores = {}  # para títulos limpios por categoría: "Arquitectura 01", "02", ...
    exitos = 0

    try:
        paginator = s3.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=NOMBRE_BUCKET, Prefix="Pics/"):
            for obj in page.get("Contents", []):
                key = obj["Key"]  # ej: "Pics/Arquitectura/6c17d52f-....jpg"

                # Saltar carpetas/ocultos y archivos no-imagen
                if key.endswith("/") or "/." in key:
                    continue
                if not key.lower().endswith(EXTENSIONES_VALIDAS):
                    continue

                partes = key.split("/")
                if len(partes) < 3:
                    continue  # archivo suelto fuera de subcarpeta

                categoria = partes[1].replace("_", " ").title()
                url_imagen = f"{URL_BASE_S3}/{key}"

                # --- Deduplicación por URL ---
                if url_imagen in urls_existentes:
                    continue

                # --- Título limpio: "Categoria 01" en vez del UUID del archivo ---
                contadores[categoria] = contadores.get(categoria, 0) + 1
                titulo = f"{categoria} {contadores[categoria]:02d}"

                paquete = {
                    "title": titulo,
                    "description": f"Referencia de {categoria} en la bóveda Visual Vault.",
                    "image_url": url_imagen,
                    "category": categoria,
                    "is_sensitive": False,
                    "creator_id": 1,
                }

                try:
                    resp = requests.post(API_URL, json=paquete, timeout=10)
                    if resp.status_code in (200, 201):
                        print(f"✅ {titulo}")
                        exitos += 1
                        urls_existentes.add(url_imagen)
                    else:
                        print(f"⚠️ Fallo {titulo}: HTTP {resp.status_code} {resp.text[:120]}")
                except Exception as e:
                    print(f"❌ Error enviando {titulo}: {e}")

        print("=" * 50)
        print(f"🎉 Inyección completada: {exitos} pines nuevos sincronizados desde S3.")

    except Exception as e:
        print(f"❌ Error al leer el bucket de AWS: {e}")
        print("💡 Si es un 403, el bucket no permite listado anónimo: usa credenciales o ajusta la política del bucket.")


if __name__ == "__main__":
    inyectar_desde_s3()
