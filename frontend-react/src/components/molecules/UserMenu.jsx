import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthMsal from "../../hooks/useAuthMsal";
import { ChevronDown } from "lucide-react"; 

const UserMenu = ({ isScrolled }) => {
    // BORRA el useEffect que lee el 'username' y cambia tu useState a esto:
    const [username]    = useState(() => localStorage.getItem('username') || 'Usuario');
    const [isOpen, setIsOpen] = useState(false); // Control del menú desplegable
    const menuRef = useRef(null); // Referencia para detectar clics afuera
    
    const navigate = useNavigate();
    const { instance } = useAuthMsal();

   
    // Cerrar el menú si el usuario hace clic en cualquier otro lado de la pantalla
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.clear(); 
        const activeAccount = instance.getActiveAccount();
        if (activeAccount || instance.getAllAccounts().length > 0) {
            instance.logoutRedirect().catch(e => console.error(e));
        } else {
            navigate('/login');
        }
    };

    const initial = username ? username.charAt(0).toUpperCase() : 'U';

    return (
        <div className="relative" ref={menuRef}>
            {/* GESTOR DEL CLIC DEL DISPARADOR */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 p-1 rounded-full transition-colors select-none"
            >
                {/* Avatar Circular Perfecto */}
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {initial}
                </div>
                
                {!isScrolled && (
                    <ChevronDown className={`w-4 h-4 text-slate-700 mr-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                )}
            </div>
            
            {/* MENÚ DESPLEGABLE ABSOLUTO CONTROLADO POR ESTADO */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 text-gray-900 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    <p className="text-xs text-gray-500 mb-2 pl-1">Actualmente en</p>
                    
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 w-full overflow-hidden mb-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg shrink-0">
                            {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-800 truncate block w-full" title={username}>
                                {username}
                            </p>
                            <p className="text-xs text-gray-500">Personal</p>
                        </div>
                    </div>

                    <button className="w-full text-left text-sm font-medium text-slate-700 hover:bg-gray-50 hover:text-slate-950 px-3 py-2 rounded-lg transition-colors">
                        Convertir en cuenta para empresas
                    </button>
                    
                    <button className="w-full text-left text-sm font-medium text-slate-700 hover:bg-gray-50 hover:text-slate-950 px-3 py-2 rounded-lg transition-colors mt-1">
                        Añadir cuenta de Pinterest
                    </button>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <button 
                            onClick={handleLogout}
                            className="w-full text-left text-sm font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;