import os
import requests

# ==========================================
# CONFIGURACIÓN DEL CTO
# ==========================================
NOMBRE_BUCKET = "visual-vault-4to-semestre" # 👈 Asegúrate de que sea tu nombre real de bucket
REGION = "us-east-1"
URL_BASE_S3 = f"https://{NOMBRE_BUCKET}.s3.{REGION}.amazonaws.com"

# La URL de tu servidor local FastAPI
API_URL = "http://127.0.0.1:8000/api/v1/pins/"

def sembrar_base_de_datos(carpeta_raiz="Pics"):
    print("🚀 Iniciando protocolo de sembrado masivo de base de datos...")
    
    if not os.path.exists(carpeta_raiz):
        print(f"❌ Error: No se encuentra la carpeta local '{carpeta_raiz}'.")
        return

    contador_exitos = 0
    
    # 1. Obtener el inventario actual de la base de datos
    print("[*] Consultando base de datos actual...")
    respuesta_db = requests.get(API_URL)
    titulos_existentes = set()
    
    if respuesta_db.status_code == 200:
        pines_db = respuesta_db.json()
        titulos_existentes = {pin["title"] for pin in pines_db}
    
    # 2. Iniciar escaneo local (UN SOLO BUCLE MAESTRO)
    for raiz, directorios, archivos in os.walk(carpeta_raiz):
        for archivo in archivos:
            if archivo.startswith('.'):
                continue # Ignoramos archivos ocultos de sistema
                
            # Formateamos el título (ej: "000001.jpg" -> "Pin 000001")
            titulo_limpio = f"Pin {archivo.replace('.jpg', '').replace('.png', '')}"
            
            # --- LA MAGIA ANTI-DUPLICADOS ---
            # Si el título ya está en la BD, saltamos a la siguiente imagen inmediatamente
            if titulo_limpio in titulos_existentes:
                print(f"[-] Saltando {titulo_limpio} (Ya existe en BD)")
                continue
            
            # Si llegamos aquí, es un Pin NUEVO (como los de la nueva carpeta Outfits)
            
            # Extraemos la categoría basándonos en el nombre de la subcarpeta
            partes_ruta = os.path.relpath(raiz, carpeta_raiz).split(os.sep)
            categoria = partes_ruta[0]
            
            # Construimos la URL exacta que generó AWS S3
            ruta_s3 = f"{carpeta_raiz}/{categoria}/{archivo}".replace("\\", "/")
            url_imagen_aws = f"{URL_BASE_S3}/{ruta_s3}"

            # Armamos el paquete de datos exacto que espera tu FastAPI
            paquete_datos = {
                "title": titulo_limpio,
                "description": f"Contenido extraído para la sección de {categoria.replace('_', ' ').title()}",
                "image_url": url_imagen_aws,
                "category": categoria.replace('_', ' ').title(),
                "is_sensitive": False,
                "creator_id": 1
            }
            
            # Disparamos el POST a tu propio backend
            try:
                respuesta = requests.post(API_URL, json=paquete_datos)
                if respuesta.status_code == 200:
                    print(f"✅ Éxito: {titulo_limpio} de la categoría '{categoria}' registrado.")
                    contador_exitos += 1
                else:
                    print(f"⚠️ Fallo al subir {archivo}: {respuesta.text}")
            except Exception as e:
                print(f"❌ Error de conexión con FastAPI: {e}")
                
    print("=" * 40)
    print(f"🎉 ¡Sembrado completado! Se inyectaron {contador_exitos} pines nuevos en la base de datos.")

if __name__ == "__main__":
    # Asegúrate de que FastAPI esté corriendo en otra terminal antes de ejecutar esto
    sembrar_base_de_datos()