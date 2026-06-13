import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PinPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pin, setPin] = useState(null);
    const [loading, setLoading] = useState(true);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

    useEffect(() => {
        const fetchPinDetail = async () => {
            try {
                const response = await fetch(`${apiUrl}/pins/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setPin(data);
                }
            } catch (error) {
                console.error("Error al cargar el detalle del pin:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPinDetail();
    }, [id, apiUrl]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#090B0E] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-zinc-800 border-t-zinc-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!pin) return <div className="min-h-screen bg-[#090B0E] text-white p-8">Pin no encontrado.</div>;

    return (
        <div className="min-h-screen bg-[#090B0E] pt-24 pb-12 px-4 md:px-8">
            
            {/* Botón Volver */}
            <button 
                onClick={() => navigate(-1)}
                className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group w-fit"
            >
                <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-sans font-medium uppercase tracking-widest text-sm">Volver a la Bóveda</span>
            </button>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                
                {/* Lado Izquierdo: Imagen Principal */}
                <div className="relative group rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-zinc-800/50 bg-zinc-900">
                    <img 
                        src={pin.image_url} 
                        alt={pin.title} 
                        className="w-full h-auto object-cover max-h-[85vh]"
                    />
                </div>

                {/* Lado Derecho: Metadatos e Interacción */}
                <div className="flex flex-col text-white py-4">
                    
                    {/* Top Bar: Iconos de Acción */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex gap-4">
                            <button className="text-zinc-400 hover:text-red-500 transition-colors">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </button>
                            <button className="text-zinc-400 hover:text-blue-400 transition-colors">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            </button>
                        </div>
                        <button className="bg-white text-black font-bold uppercase tracking-widest text-sm px-6 py-3 rounded-full hover:bg-gray-200 transition-colors">
                            Guardar
                        </button>
                    </div>

                    {/* Información Central */}
                    <div className="mb-10">
                        <span className="text-blue-500 text-xs font-bold tracking-widest uppercase mb-3 block">
                            {pin.category}
                        </span>
                        <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tight mb-6">
                            {pin.title}
                        </h1>
                        <p className="text-zinc-400 font-sans text-lg leading-relaxed">
                            {pin.description || `Referencia visual de alta resolución extraída para la sección de ${pin.category}. Visual Vault analiza y protege los metadatos de esta imagen.`}
                        </p>
                    </div>

                    {/* Creador (Mockup visual) */}
                    <div className="flex items-center gap-4 mb-10 pb-10 border-b border-zinc-800">
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-lg">
                            MC
                        </div>
                        <div>
                            <p className="font-bold text-gray-200">Gabriel Minda Carrión</p>
                            <p className="text-sm text-zinc-500">CTO & Curador</p>
                        </div>
                    </div>

                    {/* Comentarios Oscuros */}
                    <div>
                        <h3 className="text-xl font-display font-medium mb-6 flex justify-between">
                            Comentarios <span className="text-zinc-600 text-sm">0 comentarios</span>
                        </h3>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Añade un análisis o comentario técnico..." 
                                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl py-4 pl-4 pr-24 focus:outline-none focus:border-zinc-600 transition-colors placeholder-zinc-600"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-lg transition-colors">
                                Enviar
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PinPage;