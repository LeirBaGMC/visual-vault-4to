import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Registramos el hook y el plugin correctamente
gsap.registerPlugin(useGSAP, ScrollTrigger);

const FeatureShowcase = () => {
    const sectionRef = useRef(null);

    // Reemplazamos useEffect por useGSAP. 
    // Esto limpia la memoria automáticamente y evita que las letras se queden en opacity: 0
    useGSAP(() => {
        const elements = gsap.utils.toArray('.gs-reveal');
        
        elements.forEach((el) => {
            gsap.fromTo(el, 
                { y: 50, opacity: 0 }, 
                { 
                    y: 0, 
                    opacity: 1, 
                    duration: 1, 
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 85%", 
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });

        // EL SEGURO DE VIDA:
        // Le pedimos a GSAP que vuelva a calcular TODAS las posiciones de la página 
        // medio segundo después de montar el componente, dando tiempo a que las imágenes carguen.
        const timeout = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 500);

        return () => clearTimeout(timeout); // Limpieza de memoria

    }, { scope: sectionRef });

    return (
        <div ref={sectionRef} className="w-full bg-[#FAF7F4] pt-24 pb-32 overflow-hidden text-gray-900">
            <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex flex-col gap-32">
                
                {/* Bloque 1: Texto Izquierda, Imagen Derecha */}
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                    <div className="flex-1 space-y-6">
                        <span className="gs-reveal inline-block text-xs font-bold tracking-widest text-gray-500 uppercase">
                            CÓMO FUNCIONA
                        </span>
                        <h2 className="gs-reveal font-display text-4xl md:text-5xl font-medium tracking-tight leading-tight">
                            Tu cerebro digital, perfectamente organizado.
                        </h2>
                        <p className="gs-reveal text-lg text-gray-600 leading-relaxed">
                            Olvídate de tener cientos de capturas de pantalla perdidas o enlaces que nunca abres. Visual Vault centraliza tu inspiración técnica, arquitecturas y diseños UI en una sola bóveda.
                        </p>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="gs-reveal relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-gray-200">
                            <img 
                                src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1200&auto=format&fit=crop" 
                                alt="Workspace" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Bloque 2: Imagen Izquierda, Texto Derecha (Reversado) */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-24">
                    <div className="flex-1 space-y-6">
                        <span className="gs-reveal inline-block text-xs font-bold tracking-widest text-gray-500 uppercase">
                            BÚSQUEDA INTELIGENTE
                        </span>
                        <h2 className="gs-reveal font-display text-4xl md:text-5xl font-medium tracking-tight leading-tight">
                            Encuentra ese diagrama en segundos.
                        </h2>
                        <p className="gs-reveal text-lg text-gray-600 leading-relaxed">
                            Nuestro sistema de etiquetado te permite recuperar referencias de interfaces, snippets de código o esquemas cloud exactamente cuando estás en medio de un desarrollo.
                        </p>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="gs-reveal relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-gray-200">
                            <img 
                                src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop" 
                                alt="Búsqueda" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* Bloque 3: Banner de Estadísticas */}
            <div className="mt-32 max-w-[1400px] mx-auto px-4">
                <div className="relative w-full rounded-[32px] overflow-hidden bg-slate-900 text-white py-24 px-8 md:px-16 flex flex-col items-center text-center">
                    <img 
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop" 
                        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
                        alt="Background"
                    />
                    <div className="relative z-10 max-w-3xl">
                        <h2 className="gs-reveal font-display text-4xl md:text-6xl font-medium tracking-tight mb-6">
                            Menos tiempo buscando. Empieza a construir.
                        </h2>
                        <p className="gs-reveal text-lg text-slate-300 mb-16">
                            Desarrolladores y diseñadores gastan horas a la semana buscando referencias pasadas. Pasa de buscar a implementar en 2 clics.
                        </p>
                        
                        <div className="gs-reveal grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/20 pt-12">
                            <div>
                                <div className="text-4xl md:text-5xl font-sans font-light tracking-tighter mb-2">0</div>
                                <div className="text-xs text-slate-400 uppercase tracking-widest">Ideas Perdidas</div>
                            </div>
                            <div>
                                <div className="text-4xl md:text-5xl font-sans font-light tracking-tighter mb-2">AWS</div>
                                <div className="text-xs text-slate-400 uppercase tracking-widest">Almacenamiento</div>
                            </div>
                            <div>
                                <div className="text-4xl md:text-5xl font-sans font-light tracking-tighter mb-2">100%</div>
                                <div className="text-xs text-slate-400 uppercase tracking-widest">Enfoque Visual</div>
                            </div>
                            <div>
                                <div className="text-4xl md:text-5xl font-sans font-light tracking-tighter mb-2">&lt;2s</div>
                                <div className="text-xs text-slate-400 uppercase tracking-widest">Búsqueda</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default FeatureShowcase;