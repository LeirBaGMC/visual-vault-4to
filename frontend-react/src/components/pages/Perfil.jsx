import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const GRID_PATTERNS = [
    "md:col-span-2 md:row-span-2", "col-span-1 row-span-1", "col-span-1 row-span-2",       
    "col-span-1 row-span-1", "md:col-span-2 row-span-1", "col-span-1 row-span-2",       
];

const Perfil = () => {
    const [pins, setPins] = useState([]);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [editingPinId, setEditingPinId] = useState(null);
    const [newTitle, setNewTitle] = useState("");
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeout = useRef(null);
    const navigate = useNavigate();
    
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Todas");
    const [filteredPins, setFilteredPins] = useState([]);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

    const cargarPines = async () => {
        try {
            const response = await fetch(`${apiUrl}/pins/`);
            if (response.ok) {
                const data = await response.json();
                const shuffledData = data.sort(() => 0.5 - Math.random());
                setPins(shuffledData);
                setFilteredPins(shuffledData); 
            }
        } catch (error) {
            console.error("Error API:", error);
        }
    };

    useEffect(() => {
        cargarPines();
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                setIsAdminMode(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAdminMode]);

    useEffect(() => {
        let resultados = pins;
        if (selectedCategory !== "Todas") {
            resultados = resultados.filter(pin => pin.category === selectedCategory);
        }
        if (searchTerm.trim() !== "") {
            const term = searchTerm.toLowerCase();
            resultados = resultados.filter(pin => 
                (pin.title && pin.title.toLowerCase().includes(term)) ||
                (pin.category && pin.category.toLowerCase().includes(term))
            );
        }
        setFilteredPins(resultados);
    }, [searchTerm, selectedCategory, pins]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolling(true);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(() => setIsScrolling(false), 250);
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        };
    }, []);

    const guardarEdicion = async (id) => {
        try {
            const response = await fetch(`${apiUrl}/pins/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
            if (response.ok) { setEditingPinId(null); cargarPines(); }
        } catch (error) {}
    };

    const eliminarPin = async (id, e) => {
        e.stopPropagation(); 
        if (!window.confirm("¿Seguro que deseas eliminar esta referencia?")) return;
        try {
            const response = await fetch(`${apiUrl}/pins/${id}`, { method: 'DELETE' });
            if (response.ok) cargarPines();
        } catch (error) {}
    };

    const categoriasUnicas = ["Todas", ...new Set(pins.map(pin => pin.category).filter(Boolean))];

    return (
        <div className="min-h-screen bg-[#090B0E] p-4 md:p-8 text-white">
            {isAdminMode && (
                <div className="mb-6 p-3 bg-red-950/40 border border-red-800 text-red-400 rounded-sm text-center font-mono tracking-widest text-xs animate-pulse">
                    ⚠️ MODO CONTROLADOR ACTIVO — PERMISOS DE ESCRITURA TOTAL
                </div>
            )}

            <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 backdrop-blur-sm sticky top-4 z-50 shadow-2xl">
                <div className="relative w-full md:w-1/2">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Buscar por título o etiqueta..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm pl-10 pr-4 py-3 rounded-md focus:outline-none focus:border-gray-400 transition-colors"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {categoriasUnicas.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                                selectedCategory === cat ? 'bg-gray-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {filteredPins.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-50">
                    <p className="text-xl font-display tracking-widest text-zinc-500">NO SE ENCONTRARON REFERENCIAS</p>
                </div>
            ) : (
                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[220px] md:auto-rows-[280px] grid-flow-dense group ${isScrolling ? 'pointer-events-none' : ''}`}>
                    {filteredPins.map((pin, index) => {
                        const patternClass = GRID_PATTERNS[index % GRID_PATTERNS.length];
                        
                        return (
                            <div 
                                key={pin.id}
                                onClick={() => editingPinId !== pin.id && navigate(`/pin/${pin.id}`)}
                                // Añadimos la clase de animación con un pequeño delay en cascada para que entren una por una
                                className={`relative rounded-sm overflow-hidden shadow-lg cursor-pointer flex flex-col justify-end p-6 group/card animate-fade-in-up ${patternClass}`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* CAPA 1: LA IMAGEN (Esta es la única que se difumina y se oscurece) */}
                                <div 
                                    className="absolute inset-0 bg-cover bg-center transition-all duration-500 delay-0 group-hover:delay-500 group-hover:blur-[8px] group-hover:brightness-50 group-hover/card:!blur-none group-hover/card:!brightness-100 group-hover/card:!delay-0 group-hover/card:scale-[1.03]"
                                    style={{ backgroundImage: `url(${pin.image_url})` }}
                                />
                                
                                {/* CAPA 2: EL GRADIENTE (Para leer los textos) */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none opacity-80" />
                                
                                {/* CAPA 3: ICONOS DE ACCIÓN (Siempre nítidos) */}
                                <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                                    <button className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2.5 shadow-lg flex items-center justify-center transition-colors" onClick={(e) => e.stopPropagation()}>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                    </button>
                                </div>
                                <div className="absolute bottom-4 right-4 z-20 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                                    <button className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full p-2 flex items-center justify-center transition-colors" onClick={(e) => e.stopPropagation()}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                    </button>
                                </div>
                                
                                {/* CAPA 4: TEXTOS (Siempre nítidos) */}
                                <div className="z-10 w-full relative">
                                    {editingPinId === pin.id ? (
                                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white text-sm px-2 py-1 rounded-sm w-full" />
                                            <button onClick={() => guardarEdicion(pin.id)} className="bg-blue-600 text-xs px-2 py-1 rounded-sm font-bold">OK</button>
                                        </div>
                                    ) : (
                                        <>
                                            <h1 className="text-lg md:text-2xl font-display font-bold tracking-wider drop-shadow-lg text-gray-100 truncate">{pin.title}</h1>
                                            <h3 className="text-xs font-sans tracking-widest text-gray-400 mt-1 uppercase">{pin.category}</h3>
                                        </>
                                    )}

                                    {isAdminMode && editingPinId !== pin.id && (
                                        <div className="flex gap-2 mt-3 z-30 relative" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => { setEditingPinId(pin.id); setNewTitle(pin.title); }} className="bg-zinc-800/90 text-[10px] uppercase font-bold px-3 py-1 rounded-sm text-zinc-300">Editar</button>
                                            <button onClick={(e) => eliminarPin(pin.id, e)} className="bg-red-950/90 text-[10px] uppercase font-bold px-3 py-1 rounded-sm text-red-400">Borrar</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Perfil;