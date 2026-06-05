import requests

# URL exacta de tu endpoint
API_URL = "http://localhost:8000/api/v1/pins/"

pins_data = [
    {
        "title": "Arquitectura Server Cloud",
        "description": "Referencia de infraestructura de servidores en la nube de alto rendimiento.",
        "category": "Cloud",
        "image_url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Kendo Dojo Strike",
        "description": "Práctica tradicional en el dojo. Excelente referencia de iluminación.",
        "category": "Artes Marciales",
        "image_url": "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Offensive Security Terminal",
        "description": "Setup de ciberseguridad y monitorización en consola.",
        "category": "Ciberseguridad",
        "image_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Render 3D Minimalista",
        "description": "Diseño 3D abstracto para inspiración de interfaces modernas.",
        "category": "Diseño",
        "image_url": "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Dark Mode Code",
        "description": "Visualización de código Python en un editor oscuro.",
        "category": "Desarrollo",
        "image_url": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Setup High Performance",
        "description": "Estación de trabajo para diseño y desarrollo Full Stack.",
        "category": "Hardware",
        "image_url": "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Abstract UI Datacenter",
        "description": "Concepto visual de la transmisión de datos en la red.",
        "category": "Cloud",
        "image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Coffee & Aesthetic",
        "description": "Taza de café oscuro junto a un setup minimalista.",
        "category": "Lifestyle",
        "image_url": "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Neon Cyberpunk Vibe",
        "description": "Inspiración de paleta de colores neón para interfaces oscuras.",
        "category": "Diseño",
        "image_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Hardware Internals",
        "description": "Placa base e iluminación interna de un servidor.",
        "category": "Hardware",
        "image_url": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Minimalist Architecture",
        "description": "Estructura geométrica para referencias de balance espacial.",
        "category": "Arquitectura",
        "image_url": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Gaming Concept Art",
        "description": "Arte conceptual enfocado en diseño de personajes.",
        "category": "Gaming",
        "image_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Server Racks Data",
        "description": "Pasillo frío en un centro de datos empresarial.",
        "category": "Cloud",
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Clean Workspace",
        "description": "Escritorio organizado con accesorios de productividad.",
        "category": "Lifestyle",
        "image_url": "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=2000&auto=format&fit=crop"
    },
    {
        "title": "Abstract Waves",
        "description": "Fondo abstracto de ondas 3D para headers.",
        "category": "Diseño",
        "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop"
    }
]

def seed_database():
    print("Iniciando inyección de datos en Visual Vault...")
    for pin in pins_data:
        
        # --- EL ARREGLO MÁGICO ---
        # Le inyectamos el ID del creador a cada pin antes de enviarlo
        pin["creator_id"] = 1 
        
        try:
            response = requests.post(API_URL, json=pin)
            
            if response.status_code in [200, 201]:
                print(f"[EXITO] Pin creado: {pin['title']}")
            else:
                # Si sigue dando error 422, response.text nos dirá EXACTAMENTE qué campo falta
                print(f"[ERROR {response.status_code}] Fallo al crear {pin['title']}: {response.text}")
        except Exception as e:
            print(f"[ERROR DE RED] No se pudo conectar a FastAPI. Detalle: {e}")

if __name__ == "__main__":
    seed_database()