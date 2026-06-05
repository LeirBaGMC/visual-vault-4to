import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const CONSTELLATION_POSITIONS = [
    { top: '10%', left: '3%', width: '15vw', height: '22vh' },
    { top: '40%', left: '14%', width: '12vw', height: '18vh' },
    { top: '70%', left: '5%', width: '14vw', height: '20vh' },
    { top: '22%', left: '22%', width: '10vw', height: '15vh' },
    { top: '55%', left: '2%', width: '13vw', height: '19vh' },
    { top: '85%', left: '20%', width: '11vw', height: '16vh' },

    { top: '12%', right: '8%', width: '14vw', height: '21vh' },
    { top: '38%', right: '3%', width: '12vw', height: '17vh' },
    { top: '65%', right: '16%', width: '13vw', height: '18vh' },
    { top: '25%', right: '23%', width: '11vw', height: '16vh' },
    { top: '78%', right: '4%', width: '15vw', height: '22vh' },
    { top: '50%', right: '24%', width: '10vw', height: '14vh' },
];

const Hero = () => {
    const [heroData, setHeroData] = useState({ centerPin: null, scatteredPins: [] });
    
    // TODAS LAS REFERENCIAS (Blindaje contra re-renders de React)
    const heroRef = useRef(null);
    const pinsRef = useRef([]);
    const textRef = useRef(null);      // <-- NUEVA REF PARA EL TEXTO
    const mainImgRef = useRef(null);   // <-- NUEVA REF PARA LA IMAGEN CENTRAL

    useEffect(() => {
        const fetchPins = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/v1/pins/');
                if (!response.ok) throw new Error("Error en red");
                const data = await response.json();
                
                const highResPins = data.filter(pin => pin.image_url && pin.image_url.includes('w=2000'));
                const selectedCenter = highResPins.length > 0 ? highResPins[Math.floor(Math.random() * highResPins.length)] : data[0]; 
                
                const others = data.filter(pin => pin.id !== selectedCenter.id);
                const shuffledOthers = others.sort(() => 0.5 - Math.random()).slice(0, 12);
                
                setHeroData({ centerPin: selectedCenter, scatteredPins: shuffledOthers });
            } catch (error) {
                console.error("Error cargando imágenes:", error);
            }
        };

        fetchPins();
    }, []);

    useGSAP(() => {
        if (!heroData.centerPin || heroData.scatteredPins.length === 0) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom bottom", 
                scrub: 1.2, 
            }
        });

        // 1. Imagen Principal: Usamos mainImgRef.current en lugar de un string
        tl.fromTo(mainImgRef.current, 
            { scale: 1, borderRadius: "0px" },
            { scale: 0.38, borderRadius: "80px", ease: "none", force3D: true }, 
        0);

        // 2. El Texto: Usamos textRef.current para garantizar que GSAP siempre lo encuentre
        tl.fromTo(textRef.current, 
            { opacity: 1, y: 0 },
            { opacity: 0, y: -150, ease: "power1.inOut", force3D: true }, 
        0);

        // 3. La Cascada (Ya estaba blindada)
        pinsRef.current.forEach((el, i) => {
            if (!el) return;
            
            const parallaxDistance = window.innerHeight * (1 + (i % 6) * 0.3); 

            tl.fromTo(el, 
                { y: parallaxDistance, opacity: 0 }, 
                { y: 0, opacity: 1, ease: "none", force3D: true }, 
            0);
        });

    }, { scope: heroRef, dependencies: [heroData] });

    // Le ponemos h-[250vh] para que guarde el espacio exacto y no empuje las cosas hacia abajo
if (!heroData.centerPin) return <div className="h-[250vh] w-full bg-[#FAF7F4]"></div>;

    return (
        <section ref={heroRef} className="relative w-full h-[250vh] bg-[#FAF7F4]">
            
            <div className="sticky top-0 h-screen w-full flex items-center justify-center bg-[#FAF7F4] overflow-hidden">
                
                {/* Asignamos el mainImgRef aquí */}
                <div 
                    ref={mainImgRef}
                    className="absolute inset-0 z-20 w-full h-full origin-center will-change-transform shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden"
                >
                    <img 
                        src={heroData.centerPin.image_url} 
                        alt={heroData.centerPin.title} 
                        className="w-full h-full object-cover object-center"
                        decoding="async" 
                    />
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>

                {/* Constelación de imágenes */}
                {heroData.scatteredPins.map((pin, i) => {
                    const pos = CONSTELLATION_POSITIONS[i];
                    if (!pos) return null;

                    return (
                        <div 
                            key={pin.id} 
                            ref={(el) => (pinsRef.current[i] = el)}
                            style={{ 
                                top: pos.top, 
                                left: pos.left, 
                                right: pos.right,
                                width: pos.width, 
                                height: pos.height 
                            }} 
                            className="absolute rounded-[20px] overflow-hidden shadow-lg z-10 will-change-transform bg-white"
                        >
                            <img 
                                src={pin.image_url.replace('w=2000', 'w=400')} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                decoding="async"
                                loading="lazy"
                            />
                        </div>
                    );
                })}

                {/* Asignamos el textRef aquí para blindarlo */}
                <div 
                    ref={textRef}
                    className="absolute bottom-12 left-6 md:bottom-24 md:left-[5vw] z-30 flex flex-col items-start text-white pointer-events-none max-w-4xl will-change-transform"
                >
                    <h1 className="font-display text-5xl md:text-7xl lg:text-[92px] font-medium tracking-tight leading-[1] mb-6 drop-shadow-lg">
                        Descubre. Guarda.<br /> 
                        Construye.
                    </h1>
                    <p className="font-sans text-lg md:text-2xl text-white/90 font-normal max-w-2xl drop-shadow-md">
                        La bóveda definitiva para referencias visuales, arquitectura de software y diseño de interfaces. AI que clasifica todo por ti.
                    </p>
                </div>

            </div>
        </section>
    );
};

export default Hero;