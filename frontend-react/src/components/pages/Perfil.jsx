import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// 1. Importamos el hook de Microsoft
import { useMsal } from "@azure/msal-react";

const Perfil = () => {
    const [user, setUser] = useState(null);
    const [savedPins, setSavedPins] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    
    // 2. Inicializamos la instancia de Microsoft
    const { instance } = useMsal();

    useEffect(() => {
        const fetchProfileData = async () => {
            const token = localStorage.getItem('token');
            const savedUsername = localStorage.getItem('username');

            if (!token) {
                navigate('/login');
                return;
            }

            setUser({ nombre: savedUsername });

            try {
                const pinsResponse = await fetch('http://localhost:8000/api/v1/pins/');
                if (pinsResponse.ok) {
                    const pinsData = await pinsResponse.json();
                    setSavedPins(pinsData.slice(0, 8)); 
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [navigate]);

    // 3. ACTUALIZAMOS LA FUNCIÓN DE CERRAR SESIÓN
    const handleLogout = () => {
        // Borramos los datos locales de Visual Vault
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        
        // Cerramos la sesión en los servidores de Microsoft y redirigimos al Login
        instance.logoutRedirect({
            postLogoutRedirectUri: "http://localhost:5173/login"
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FAF7F4] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF7F4] font-sans pb-24">
            
            <nav className="w-full h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
                <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold shadow-inner">
                        V
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tight hidden md:block">
                        Visual Vault
                    </span>
                </Link>

                <div className="flex items-center gap-6">
                    <button className="font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                        Explorar Feed
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="h-10 px-6 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 hover:text-slate-900 transition-all"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </nav>

            <header className="w-full max-w-5xl mx-auto mt-16 px-6 flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full bg-slate-900 flex items-center justify-center text-white text-4xl font-display font-medium shadow-2xl mb-6 ring-4 ring-white uppercase">
                    {user?.nombre ? user.nombre.charAt(0) : 'V'}
                </div>
                
                <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight mb-2">
                    {user?.nombre || "Usuario"}
                </h1>
                
                <div className="flex items-center gap-8 border-b border-slate-200 w-full justify-center mt-8">
                    <button className="pb-4 border-b-2 border-slate-900 text-slate-900 font-bold">
                        Mi Bóveda ({savedPins.length})
                    </button>
                    <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-semibold transition-colors">
                        Pines Subidos
                    </button>
                </div>
            </header>

            <main className="w-full max-w-[1400px] mx-auto mt-12 px-6">
                {savedPins.length > 0 ? (
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                        {savedPins.map((pin) => (
                            <div key={pin.id} className="relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 break-inside-avoid cursor-pointer">
                                <img 
                                    src={pin.image_url} 
                                    alt={pin.title || "Referencia visual"} 
                                    className="w-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors duration-300 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100">
                                    <div className="flex justify-end">
                                        <button className="bg-white text-slate-900 text-xs font-bold px-4 py-2 rounded-full hover:bg-slate-100 shadow-lg">
                                            Guardado
                                        </button>
                                    </div>
                                    <h3 className="text-white font-semibold truncate drop-shadow-md">
                                        {pin.title || "Sin título"}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full py-32 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
                            <span className="text-3xl text-slate-300">🗂️</span>
                        </div>
                        <h3 className="text-2xl font-display font-semibold text-slate-900 mb-2">
                            Tu bóveda está vacía
                        </h3>
                        <p className="text-slate-500 max-w-sm mb-8">
                            Aún no has guardado ninguna referencia. Explora el feed y empieza a construir tu biblioteca visual.
                        </p>
                        <button className="h-12 px-8 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-colors shadow-lg">
                            Ir a Explorar
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Perfil;