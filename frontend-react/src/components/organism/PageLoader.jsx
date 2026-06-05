import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const PageLoader = () => {
    const [progress, setProgress] = useState(0);
    const loaderRef = useRef(null);

    useEffect(() => {
        // Simulador de carga (puedes conectarlo a la carga real de imágenes después)
        let currentProgress = 0;
        
        const interval = setInterval(() => {
            // Avanza aleatoriamente para que se sienta humano y real
            currentProgress += Math.floor(Math.random() * 100) + 5;
            
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                
                // LA MAGIA DE SALIDA: 
                // Cuando llega a 100, espera medio segundo y desliza la pantalla hacia arriba
                gsap.to(loaderRef.current, {
                    yPercent: -100, 
                    duration: 1.2,
                    ease: "power4.inOut",
                    delay: 0.4
                });
            }
            
            setProgress(currentProgress);
        }, 150);

        return () => clearInterval(interval);
    }, []);

    return (
        // El contenedor ahora usa el color crema de tu tema (#FAF7F4)
        <div 
            ref={loaderRef} 
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF7F4] w-full h-screen"
        >
            {/* El Logo Animado */}
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black shadow-2xl mb-10 overflow-hidden bg-white border border-slate-200">
                
                {/* El líquido de fondo que sube con el porcentaje */}
                <div 
                    className="absolute bottom-0 left-0 w-full bg-slate-900 transition-all duration-200 ease-out"
                    style={{ height: `${progress}%` }}
                ></div>

                {/* La letra 'V' que cambia de color por contraste (magia CSS) */}
                <span className="relative z-10 text-slate-900 mix-blend-difference text-white">
                    V
                </span>
            </div>

            

            
        </div>
    );
};

export default PageLoader;