import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const PageLoader = () => {
    const loaderRef = useRef(null);
    const counterRef = useRef(null);
    const progressRef = useRef(null);

    useGSAP(() => {
        // Bloqueamos el scroll mientras carga
        document.body.style.overflow = 'hidden';

        const tl = gsap.timeline({
            onComplete: () => {
                // Devolvemos el scroll cuando termina
                document.body.style.overflow = '';
            }
        });

        // 1. Animamos el contador de 0 a 100 y llenamos la barra
        tl.to({ val: 0 }, {
            val: 100,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: function () {
                if (counterRef.current) {
                    counterRef.current.innerText = Math.round(this.targets()[0].val).toString().padStart(2, '0');
                }
                if (progressRef.current) {
                    progressRef.current.style.width = this.targets()[0].val + "%";
                }
            }
        })
        // 2. El telón rojo se desliza hacia arriba y desaparece
        .to(loaderRef.current, {
            yPercent: -100,
            duration: 0.8,
            ease: "power3.inOut",
            delay: 0.2
        });
    });

    return (
        // z-[9999] asegura que esté por encima de TODO
        <div ref={loaderRef} className="fixed inset-0 z-[9999] bg-brandPrimary flex flex-col items-center justify-center pointer-events-none">
            {/* Aquí puedes cambiar la V por tu Logo real luego */}
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-brandPrimary font-bold text-3xl mb-8">
                V
            </div>
            
            {/* Barra de progreso */}
            <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden mb-3">
                <div ref={progressRef} className="h-full bg-white w-0 rounded-full"></div>
            </div>
            
            {/* Contador */}
            <div className="font-mono text-sm tracking-widest text-white/70">
                <span ref={counterRef}>00</span>
            </div>
        </div>
    );
};

export default PageLoader;