import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Image as ImageIcon } from 'lucide-react'; 

// 1. EL PATRÓN DE TAMAÑOS (El secreto del estilo editorial)
// Al repetirse, crea ese efecto "desordenado" pero perfectamente encajado.
const GRID_PATTERNS = [
    "col-span-1 md:col-span-2 md:row-span-2", // 1. Grande (Cuadrado/Rectángulo)
    "col-span-1 md:row-span-2",               // 2. Vertical alto
    "col-span-1 md:row-span-1",               // 3. Normal
    "col-span-1 md:row-span-1",               // 4. Normal
    "col-span-1 md:col-span-2 md:row-span-1", // 5. Horizontal ancho
    "col-span-1 md:row-span-2",               // 6. Vertical alto
    "col-span-1 md:col-span-2 md:row-span-2", // 7. Grande
    "col-span-1 md:row-span-1",               // 8. Normal
    "col-span-1 md:row-span-1",               // 9. Normal
];

const Perfil = () => {
    const [savedPins, setSavedPins] = useState([]);
    const [filteredPins, setFilteredPins] = useState([]); 
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [searchOpen, setSearchOpen] = useState(false); 
    
    const navigate = useNavigate();

    // Carga de datos
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
                const response = await fetch(`${apiUrl}/pins/`);
                if (response.ok) {
                    const data = await response.json();
                    setSavedPins(data); 
                    setFilteredPins(data); 
                }
            } catch (error) {
                console.error("Error cargando base de datos:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileData();
    }, []);

    // Lógica del Buscador en tiempo real
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredPins(savedPins);
        } else {
            const lowerCaseSearch = searchTerm.toLowerCase();
            const filtered = savedPins.filter(pin => 
                pin.title?.toLowerCase().includes(lowerCaseSearch) || 
                pin.category?.toLowerCase().includes(lowerCaseSearch)
            );
            setFilteredPins(filtered);
        }
    }, [searchTerm, savedPins]);

    return (
        <div className="min-h-screen w-full bg-[#121212] relative font-sans select-none pb-12">
            
            {/* --- CONTENEDOR FLOTANTE DEL BUSCADOR --- */}
            <div className="fixed top-8 left-0 w-full flex justify-center items-center z-[50] pointer-events-none">
                <div 
                    className={`flex items-center backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_25px_60px_rgba(0,0,0,0.7)] overflow-hidden border border-white/10 pointer-events-auto rounded-full justify-center
                        ${searchOpen 
                            ? 'w-[480px] h-11 bg-[#12131a]/95 px-4' 
                            : 'w-10 h-10 bg-white/5 cursor-pointer hover:bg-white/15 hover:scale-105 active:scale-95' 
                        }
                    `}
                    onClick={() => { if (!searchOpen) setSearchOpen(true); }}
                >
                    <div className="flex items-center justify-center shrink-0">
                        <Search 
                            className={`transition-colors duration-300 ${searchOpen ? 'w-[16px] h-[16px] text-slate-400' : 'w-[15px] h-[15px] text-white/80'}`} 
                            strokeWidth={2.5} 
                        />
                    </div>
                    
                    <input 
                        type="text" 
                        placeholder="Buscar referencias, títulos o categorías..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`bg-transparent outline-none text-white font-semibold placeholder:text-slate-500 text-xs transition-all duration-500 
                            ${searchOpen 
                                ? 'w-full ml-3 opacity-100 pointer-events-auto' 
                                : 'w-0 opacity-0 pointer-events-none'
                            }
                        `}
                    />

                    {searchOpen && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation(); 
                                setSearchOpen(false);
                                setSearchTerm(""); 
                            }}
                            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center justify-center shrink-0"
                        >
                            <X className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </div>

            {/* --- CONTENIDO PRINCIPAL (GRID DENSO) --- */}
            <div className="pt-28 px-4 md:px-8 w-full max-w-[1600px] mx-auto">
                {isLoading ? (
                    <div className="w-full h-[60vh] flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-slate-800 border-t-white rounded-full animate-spin"></div>
                    </div>
                ) : filteredPins.length > 0 ? (
                    
                    /* AQUÍ SUCEDE LA MAGIA: grid-flow-dense y auto-rows para fijar la altura base */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[220px] md:auto-rows-[280px] grid-flow-dense">
                        {filteredPins.map((pin, index) => {
                            // Asignamos la clase de tamaño (span) basándonos en la posición
                            const patternClass = GRID_PATTERNS[index % GRID_PATTERNS.length];

                            return (
                                <div 
                                    key={pin.id}
                                    onClick={() => navigate(`/pin/${pin.id}`)}
                                    style={{ backgroundImage: `url(${pin.image_url})` }}
                                    className={`group relative bg-cover bg-center rounded-sm overflow-hidden shadow-lg cursor-pointer transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl hover:z-10 ${patternClass}`}
                                >
                                    {/* Gradiente SIEMPRE visible para oscurecer la base y que las palabras resalten */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none opacity-90"></div>
                                    
                                    {/* LAS PALABRAS (Título y Categoría) - Siempre Visibles */}
                                    <div className="absolute bottom-6 left-6 text-gray-100 uppercase z-10 pointer-events-none">
                                        <h1 className="text-xl md:text-3xl font-display font-bold tracking-widest drop-shadow-lg mb-1">
                                            {pin.title}
                                        </h1>
                                        <h3 className="text-xs md:text-sm font-sans font-semibold tracking-widest text-gray-300">
                                            {pin.category || 'Inspiración'}
                                        </h3>
                                    </div>

                                    {/* Capa extra al hacer Hover (Opcional, hace que se vea más interactivo) */}
                                    <div className="absolute inset-0 h-full w-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center">
                                        <div className="flex flex-col items-center justify-center text-gray-100 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out">
                                            <ImageIcon className="w-8 h-8 mb-2 text-white" strokeWidth={1.5} />
                                            <h2 className="text-sm font-display font-bold uppercase tracking-widest">
                                                Abrir Pin
                                            </h2>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                ) : (
                    <div className="w-full h-[60vh] flex flex-col items-center justify-center text-center">
                        <h3 className="text-xl font-semibold text-slate-400">
                            {searchTerm ? "No hay resultados para tu búsqueda." : "No hay imágenes en la bóveda."}
                        </h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Perfil;