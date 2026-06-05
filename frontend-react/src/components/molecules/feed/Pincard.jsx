import { Button } from "@heroui/react";

const PinCard = ({ pin }) => {
    return (
        /* break-inside-avoid es la magia que evita que las imágenes se corten a la mitad en la cuadrícula */
        <div className="group relative break-inside-avoid mb-4 rounded-2xl overflow-hidden cursor-zoom-in">
            
            {/* Imagen del Pin */}
            <img 
                src={pin.image_url} 
                alt={pin.title} 
                className="w-full h-auto object-cover rounded-2xl"
                loading="lazy"
            />

            {/* Capa oscura (Overlay) que solo aparece al hacer hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
                
                {/* Parte superior: Botón Guardar */}
                <div className="flex justify-end">
                    <Button color="danger" radius="full" size="sm" className="font-bold text-white shadow-md">
                        Guardar
                    </Button>
                </div>

                {/* Parte inferior: Título del Pin (opcional) */}
                <div className="flex justify-start items-end pb-1 pl-1">
                    <p className="text-white font-semibold text-sm truncate max-w-[80%]">
                        {pin.title}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PinCard;