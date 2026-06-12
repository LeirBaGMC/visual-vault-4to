import os
import sys
import requests
import uuid
from playwright.sync_api import sync_playwright

# ==========================================
# CONFIGURACIÓN DEL RECOLECTOR
# ==========================================
sys.stdout.reconfigure(encoding='utf-8')
CARPETA_RAIZ = "Pics"
LIMIT_IMAGENES_POR_SECCION = 15  # Ajusta este número según lo que necesites

# Las claves del diccionario serán los nombres de las carpetas 
# (y posteriormente las categorías en tu Base de Datos)
SECCIONES_BUSQUEDAS = {
    "Outfits": "aesthetic outfits",
    "Ciberseguridad": "cybersecurity aesthetic",
    "Arquitectura": "modern architecture"
}

def descargar_imagen(url, ruta_guardado):
    """Descarga la imagen forzando la resolución HD de Pinterest (736px)."""
    try:
        # Reemplazamos la miniatura (236x) por la versión grande (736x)
        url_hd = url.replace("/236x/", "/736x/")
        response = requests.get(url_hd, stream=True, timeout=10)
        
        if response.status_code == 200:
            with open(ruta_guardado, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return True
    except Exception as e:
        print(f"⚠️ Error menor al descargar imagen: {e}")
        pass
    return False

def ejecutar_recolector():
    os.makedirs(CARPETA_RAIZ, exist_ok=True)
    print("🤖 Iniciando Drone Recolector de Imágenes en HD...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_page(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        page = context

        for categoria, termino in SECCIONES_BUSQUEDAS.items():
            print(f"\n[*] Mapeando sector: {categoria}")
            carpeta_categoria = os.path.join(CARPETA_RAIZ, categoria)
            os.makedirs(carpeta_categoria, exist_ok=True)

            url_pinterest = f"https://www.pinterest.com/search/pins/?q={termino.replace(' ', '%20')}"
            page.goto(url_pinterest)
            page.wait_for_timeout(4000)

            urls_encontradas = set()
            scrolls = 0
            
            while len(urls_encontradas) < LIMIT_IMAGENES_POR_SECCION and scrolls < 10:
                images = page.query_selector_all("img")
                for img in images:
                    src = img.get_attribute("src")
                    if src and "i.pinimg.com" in src and "/236x/" in src:
                        urls_encontradas.add(src)
                        if len(urls_encontradas) >= LIMIT_IMAGENES_POR_SECCION:
                            break
                
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                scrolls += 1
                page.wait_for_timeout(2000)

            lista_urls = list(urls_encontradas)[:LIMIT_IMAGENES_POR_SECCION]
            print(f"[+] Encontrados {len(lista_urls)} objetivos. Extrayendo archivos locales en alta resolución...")

            exitos = 0
            for url_img in lista_urls:
                # 1. ARCHIVOS SEGUROS: Usamos un UUID puro para guardar la imagen
                # Esto garantiza que no haya sobrescritura local ni colisiones en S3
                nombre_archivo = f"{uuid.uuid4()}.jpg" 
                ruta_final = os.path.join(carpeta_categoria, nombre_archivo)
                
                if descargar_imagen(url_img, ruta_final):
                    exitos += 1
                    
            print(f"✅ {categoria} guardada en local ({exitos} imágenes).")

        browser.close()
        print("\n🎉 Recolección finalizada. Tu carpeta 'Pics' está lista para ser subida a S3.")

if __name__ == "__main__":
    ejecutar_recolector()