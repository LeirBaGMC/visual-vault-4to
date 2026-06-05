import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../molecules/header/Logo'; // Asegúrate de que esta ruta coincida con tu proyecto

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        // El contenedor fijo en la parte superior
        <header className={`fixed top-0 left-0 w-full z-50 flex justify-center transition-all duration-500 pointer-events-none ${isScrolled ? 'pt-4' : 'pt-6'}`}>
            
            {/* La barra de navegación que se transforma */}
            <nav 
                className={`pointer-events-auto flex items-center transition-all duration-500 bg-white/80 backdrop-blur-md border border-slate-200/50 shadow-lg ${
                    isScrolled 
                    ? 'rounded-full p-1.5 gap-1' // ESTADO SCROLL: Pequeña píldora apretada
                    : 'w-[90%] max-w-[1200px] rounded-full px-6 py-3 justify-between' // ESTADO INICIAL: Ancha y expandida
                }`}
            >
                {/* LADO IZQUIERDO: Logo y Links (Solo existen si NO hay scroll) */}
                {!isScrolled && (
                    <div className="flex items-center gap-8 animate-in fade-in zoom-in duration-300">
                        <Logo />
                        {/* Links del centro (Ocultos en móviles, visibles en PC) */}
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                            <Link to="/" className="hover:text-slate-900 transition-colors">Inicio</Link>
                            <Link to="/about" className="hover:text-slate-900 transition-colors">Quiénes Somos</Link>
                            <Link to="/services" className="hover:text-slate-900 transition-colors">Servicios</Link>
                            <Link to="/policies" className="hover:text-slate-900 transition-colors">Políticas</Link>
                        </div>
                    </div>
                )}

                {/* LADO DERECHO: Botones de Acción (Siempre visibles) */}
                <div className="flex items-center gap-2">
                    
                    {/* Botón Login */}
                    <Link 
                        to="/login" 
                        className={`font-semibold rounded-full transition-all flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-slate-900 ${
                            isScrolled 
                            ? 'h-10 px-6 text-sm bg-white shadow-sm border border-slate-100' // Destaca un poco más cuando es píldora
                            : 'h-10 px-4 text-sm'
                        }`}
                    >
                        Inicio de Sesión
                    </Link>
                    
                    {/* Botón Registro */}
                    <Link 
                        to="/register" 
                        className="h-10 px-6 text-sm font-semibold rounded-full transition-all flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                    >
                        Registro
                    </Link>
                    
                </div>
            </nav>
        </header>
    );
};

export default Header;