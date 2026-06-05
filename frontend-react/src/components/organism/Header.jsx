import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@heroui/react";
import Logo from '../molecules/header/Logo';
// Quitamos el SearchBar viejo por ahora para replicar el de Spread

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    // Escuchamos el scroll de la página
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        /* 
           Contenedor principal: Se centra y usa transiciones fluidas de Tailwind
           para imitar la curva cúbica de Spread (duration-500 ease-out) 
        */
        <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out overflow-hidden rounded-full backdrop-blur-md flex items-center
            ${isScrolled 
                ? 'w-[280px] bg-white/80 shadow-lg border border-gray-200/60 py-2 px-4 gap-2' // Estado Scrolled (Chiquito)
                : 'w-[90%] max-w-[800px] bg-gray-900/10 border border-gray-400/20 py-3 px-6 gap-6' // Estado Top (Grande)
            }
        `}>
            
            {/* Logo siempre visible */}
            <div className="flex-shrink-0">
                <Logo />
            </div>

            {/* Links centrales: Se ocultan al hacer scroll */}
            <div className={`flex-1 overflow-hidden transition-all duration-500 ease-out ${isScrolled ? 'max-w-0 opacity-0' : 'max-w-[500px] opacity-100'}`}>
                <ul className="flex items-center justify-center gap-6 text-sm font-medium text-gray-700 whitespace-nowrap">
                    <li><Link to="/" className="hover:text-brandPrimary transition-colors">Inicio</Link></li>
                    <li><Link to="/nosotros" className="hover:text-brandPrimary transition-colors">Quiénes Somos</Link></li>
                    <li><Link to="/servicios" className="hover:text-brandPrimary transition-colors">Servicios</Link></li>
                    <li><Link to="/politicas" className="hover:text-brandPrimary transition-colors">Políticas</Link></li>
                </ul>
            </div>

            {/* Botón de Registro: Cambia de tamaño según el scroll */}
            <div className="flex-shrink-0 ml-auto">
                <Link to="/register">
                    <Button 
    radius="full" 
    className={`font-bold bg-slate-900 text-white shadow-md transition-all duration-500 hover:bg-slate-800 ${isScrolled ? 'h-8 px-4 text-xs' : 'h-10 px-6 text-sm'}`}
>
    Registro
</Button>
                </Link>
            </div>

        </nav>
    );
};

export default Header;