import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const PageLoader = () => {
    const [progress, setProgress] = useState(0);
    const loaderRef = useRef(null);

    useEffect(() => {
        
        let currentProgress = 0;
        
        const interval = setInterval(() => {
            
            currentProgress += Math.floor(Math.random() * 100) + 5;
            
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                
                
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
        
        <div 
            ref={loaderRef} 
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF7F4] w-full h-screen"
        >
            
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black shadow-2xl mb-10 overflow-hidden bg-white border border-slate-200">
                
                
                <div 
                    className="absolute bottom-0 left-0 w-full bg-slate-900 transition-all duration-200 ease-out"
                    style={{ height: `${progress}%` }}
                ></div>

                
                <span className="relative z-10 text-slate-900 mix-blend-difference text-white">
                    V
                </span>
            </div>

            

            
        </div>
    );
};

export default PageLoader;