import { Button } from "@heroui/react";

const PinCard = ({ pin, isViewed, onClick, onSave, onLike }) => {
    
    const handleSaveClick = (e) => {
        e.stopPropagation(); // Evita que se abra el detalle del pin al hacer click aquí
        if (onSave) {
            onSave(pin);
        } else {
            console.log("Guardar pin para la IA:", pin.title);
        }
    };

    const handleLikeClick = (e) => {
        e.stopPropagation(); // Evita que se dispare el onClick de la tarjeta completa
        if (onLike) {
            onLike(pin);
        } else {
            console.log("Me gusta rápido registrado para el feed:", pin.title);
        }
    };

    return (
        <div 
            className="group relative break-inside-avoid mb-6 rounded-[24px] overflow-hidden cursor-grab active:cursor-grabbing bg-slate-900 border border-black/5 shadow-md transition-transform duration-200 hover:scale-[1.01]"
            onClick={() => {
                if (onClick) onClick(pin);
            }}
        >
            {/* 1. EL CONTENEDOR PARALLAX */}
            {/* Se añade scale-[1.25] para que la imagen sea más grande y tenga espacio para moverse internamente */}
            <div className="w-full h-full overflow-hidden">
                <img 
                    src={pin.image_url} 
                    alt={pin.title} 
                    className={`parallax-target w-full h-auto object-cover scale-[1.25] origin-center transition-[filter] duration-300 ${isViewed ? 'brightness-50' : 'brightness-100 group-hover:brightness-75'}`}
                    loading="lazy"
                />
            </div>

            {/* Marcador de historial ("IA") */}
            {isViewed && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-black/20">
                    <span className="text-white font-bold text-sm md:text-base drop-shadow-md bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                        Última visita
                    </span>
                </div>
            )}

            {/* Overlays y botones */}
            {/* Se añade un gradiente oscuro sutil (from-black/60) abajo para que el texto blanco nunca se pierda en fotos claras */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-30 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none">
                
                {/* FILA SUPERIOR: Botón Guardar Principal */}
                <div className="flex justify-end pointer-events-auto">
                    <Button 
                        color="danger" 
                        radius="full" 
                        size="sm" 
                        className="font-bold text-white shadow-md bg-[#e60023] hover:bg-[#b6001a] active:scale-95 transition-all"
                        onClick={handleSaveClick}
                    >
                        Guardar
                    </Button>
                </div>

                {/* FILA INFERIOR: Título del pin y Botón de Reacción Rápida */}
                <div className="flex justify-between items-center pointer-events-auto w-full gap-2">
                    <p className="text-white font-semibold text-sm truncate max-w-[75%] drop-shadow-md pl-1 pb-0.5">
                        {pin.title}
                    </p>
                    
                    {/* Botón de Like interactivo (Ideal para capturar clicks rápidos e intereses para tu feed organizado) */}
                    <button
                        onClick={handleLikeClick}
                        className="p-2 bg-white/90 hover:bg-white rounded-full text-zinc-900 shadow-md active:scale-90 transition-all flex items-center justify-center group/btn shrink-0"
                        title="Me gusta"
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={2.5} 
                            stroke="currentColor" 
                            className="w-4 h-4 text-red-600 transition-transform group-hover/btn:scale-110"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PinCard;