const { useState, useEffect } = React;

function Feed() {
    // 1. Estados de la aplicación
    const [pines, setPines] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [categoriaActiva, setCategoriaActiva] = useState('Todos');

    // 2. Conexión con el Backend (FastAPI)
    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/v1/pins")
            .then(respuesta => respuesta.json())
            .then(datos => {
                setPines(datos);
                setCargando(false);
            })
            .catch(error => {
                console.error("Error conectando con FastAPI:", error);
                setCargando(false);
            });
    }, []);

    // Traductor para limpiar los nombres de la base de datos en la interfaz
    const traductorVisual = {
        "Artes Marciales Kendo": "Kendo",
        "Ciberseguridad Hack": "Ciberseguridad",
        "Videojuegos Concept": "Videojuegos",
        "Outfits": "Outfits"
    };

    const obtenerNombreBonito = (nombreDB) => {
        if (nombreDB === 'Todos') return 'Todos';
        return traductorVisual[nombreDB] || nombreDB;
    };

    // 3. Lógica de Filtrado Inteligente
    const categoriasUnicas = ["Todos", ...new Set(pines.map(pin => pin.category))];
    
    // Decidimos qué pines mostrar según el botón seleccionado
    const pinesFiltrados = categoriaActiva === 'Todos' 
        ? pines 
        : pines.filter(pin => pin.category === categoriaActiva);

    // 4. Renderizado durante la carga
    if (cargando) {
        return <p className="loader-placeholder" style={{textAlign: 'center', marginTop: '50px'}}>Conectando con AWS y SQLite...</p>;
    }

    if (pines.length === 0) {
        return <p className="loader-placeholder" style={{textAlign: 'center', marginTop: '50px'}}>Aún no hay imágenes en la bóveda.</p>;
    }

    // 5. Renderizado de la Interfaz Final
    return (
        <div>
            {/* --- NAVEGADOR DE CATEGORÍAS DINÁMICO --- */}
            <nav className="categories-nav" aria-label="Filtrado rápido por Categorías">
                <p className="categories-title" id="category-heading">
                    Explora por categoría:
                </p>
               <ul className="categories-list" aria-labelledby="category-heading">
                    {categoriasUnicas.map(categoria => (
                        <li key={categoria}>
                            <button 
                                onClick={() => setCategoriaActiva(categoria)}
                                className={`category-btn ${categoriaActiva === categoria ? 'active' : ''}`}
                            >
                                {obtenerNombreBonito(categoria)}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav> {/* <-- ¡AQUÍ ESTÁ LA ETIQUETA QUE FALTABA! --> */}

            {/* --- CUADRÍCULA DE IMÁGENES --- */}
            <section className="feed-section" aria-label="Feed principal de imágenes">
                <div className="feed-grid">
                    {pinesFiltrados.map((pin) => (
                        <div key={pin.id} className="pin-card">
                            <img 
                                src={pin.image_url} 
                                alt={pin.title} 
                                onError={(e) => { e.target.style.display = 'none'; }}
                                style={{ 
                                    filter: pin.is_sensitive ? 'blur(25px)' : 'none',
                                    transition: 'filter 0.3s ease'
                                }}
                            />
                            
                            {/* Capa de advertencia para contenido sensible */}
                            {pin.is_sensitive && (
                                <div className="sensitive-overlay" style={{
                                    position: 'absolute', top: '0', left: '0', right: '0', bottom: '0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(0,0,0,0.4)', color: 'white', fontWeight: 'bold', pointerEvents: 'none'
                                }}>
                                    Contenido Sensible
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

// Inyección en el DOM
const rootElement = document.getElementById('react-feed-root');
const root = ReactDOM.createRoot(rootElement);
root.render(<Feed />);                                                                          