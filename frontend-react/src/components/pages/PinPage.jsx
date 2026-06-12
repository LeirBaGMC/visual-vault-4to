import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Spinner } from "@heroui/react";
import { Home, Compass, Plus, Bell, MessageCircle, Search, ChevronDown, ArrowLeft } from 'lucide-react';
import PinDetailPanel from '../organism/PinDetailPanel.jsx'; 
import Feed from '../organism/Feed.jsx'; 

const PinPage = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    
    const [pinData, setPinData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Inicialización perezosa (Lazy initialization) correcta
    const [username] = useState(() => localStorage.getItem('username') || 'V');

    useEffect(() => {
        const fetchPinDetail = async () => {
            setLoading(true); 
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/pins/${id}`);
                if (!response.ok) {
                    if (response.status === 404) throw new Error("La imagen no fue encontrada.");
                    throw new Error(`Error del servidor: ${response.status}`);
                }
                const data = await response.json();
                setPinData(data);
            } catch (err) {
                // Solo lo imprimimos en consola, ya no usamos setError
                console.error("Fallo al cargar el pin:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPinDetail();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex justify-center items-center">
                <Spinner color="danger" size="lg" label="Cargando panel..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-white font-sans text-[#111111] flex">
            {/* BARRA LATERAL ESTÁTICA ESTILO PINTEREST */}
            <aside className="fixed left-0 top-0 h-screen w-[60px] bg-white flex flex-col items-center py-4 z-50 border-r border-gray-100">
                <Link to="/perfil" className="mb-6 p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <div className="w-6 h-6 bg-[#e60023] rounded-full flex items-center justify-center text-white font-bold text-xs">V</div>
                </Link>
                <nav className="flex flex-col gap-2 w-full items-center">
                    <button onClick={() => navigate('/perfil')} className="w-12 h-12 rounded-full flex items-center justify-center bg-transparent text-[#767676] hover:bg-[#e9e9e9] transition-colors">
                        <Home className="w-6 h-6" />
                    </button>
                    <button className="w-12 h-12 rounded-full flex items-center justify-center bg-transparent text-[#767676] hover:bg-[#e9e9e9] transition-colors">
                        <Compass className="w-6 h-6" />
                    </button>
                    <button className="w-12 h-12 rounded-full flex items-center justify-center bg-transparent text-[#767676] hover:bg-[#e9e9e9] transition-colors">
                        <Plus className="w-6 h-6" />
                    </button>
                </nav>
                <div className="mt-auto flex flex-col gap-2 w-full items-center pb-4">
                    <button className="w-12 h-12 rounded-full flex items-center justify-center text-[#767676] hover:bg-gray-100"><Bell className="w-6 h-6" /></button>
                    <button className="w-12 h-12 rounded-full flex items-center justify-center text-[#767676] hover:bg-gray-100"><MessageCircle className="w-6 h-6" /></button>
                </div>
            </aside>

            {/* CONTENEDOR DERECHO DE CONTENIDO */}
            <div className="flex-1 ml-[60px] flex flex-col min-w-0">
                {/* CABECERA SUPERIOR CON BUSCADOR */}
                <header className="fixed top-0 right-0 left-[60px] h-[72px] bg-white z-40 flex items-center justify-between px-6 border-b border-gray-50">
                    <div className="flex-1 max-w-[95%] pr-4">
                        <div className="w-full bg-[#e9e9e9] hover:bg-[#e1e1e1] transition-colors rounded-full h-12 flex items-center px-4 gap-3 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#76cbff]/30">
                            <Search className="w-[20px] h-[20px] text-[#767676]" strokeWidth={2.5} />
                            <input type="text" placeholder="Buscar" className="bg-transparent outline-none w-full text-[#111111] font-normal placeholder:text-[#767676] text-[16px]" />
                        </div>
                    </div>
                    <div onClick={() => navigate('/perfil')} className="flex items-center gap-1 cursor-pointer hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                        <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <ChevronDown className="w-4 h-4 text-[#111111]" strokeWidth={2.5} />
                    </div>
                </header>

                {/* AREA DE TRABAJO PRINCIPAL */}
                <main className="pt-[90px] px-6 pb-8 w-full flex flex-col items-start">
                    <button 
                        onClick={() => navigate(-1)}
                        className="mb-4 p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center mt-2"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-800" strokeWidth={2.5} />
                    </button>

                    <div className="w-full flex flex-col lg:flex-row gap-8 items-start justify-between">
                        <div className="w-full lg:w-[55%] xl:w-[50%] shrink-0">
                            <PinDetailPanel pin={pinData} />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 pl-1">
                                Más para explorar
                            </h2>
                            <div className="w-full">
                                <Feed excludeId={id} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PinPage;