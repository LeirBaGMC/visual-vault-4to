import { Button } from "@heroui/react";
import { useState } from "react";
import { Heart, Share2, MoreHorizontal, MessageSquare, ExternalLink } from "lucide-react";

const PinDetailPanel = ({ pin }) => {
    const [comment, setComment] = useState("");

    const tableros = [
        { key: "perfil", label: "Perfil" },
        { key: "samurai", label: "Arte de samurai" },
        { key: "oscuros", label: "Fondo de pantalla oscuros" },
        { key: "dibujos", label: "Dibujos bonitos" }
    ];

    if (!pin) return null;

    return (
        <div className="bg-white rounded-[32px] shadow-[0_1px_20px_rgba(0,0,0,0.08)] flex flex-col md:flex-row w-full overflow-hidden border border-gray-150">
            
            {/* LADO IZQUIERDO: Imagen Acoplada al Borde */}
            <div className="w-full md:w-1/2 relative bg-gray-50 flex items-center justify-center">
                <img 
                    src={pin.image_url} 
                    alt={pin.title} 
                    className="w-full h-auto max-h-[75vh] object-cover block"
                />
            </div>

            {/* LADO DERECHO: Acciones e Información */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-between bg-white min-h-[500px]">
                
                <div>
                    {/* BARRA DE ACCIONES SUPERIOR (Fiel a image_fe67d7) */}
                    <div className="flex justify-between items-center mb-6 gap-2 w-full">
                        
                        {/* Iconos de Utilidad Izquierdos */}
                        <div className="flex items-center gap-1 text-gray-800">
                            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-1 font-semibold text-sm">
                                <Heart className="w-5 h-5" strokeWidth={2.2} />
                                <span className="text-xs">18</span>
                            </button>
                            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <MessageSquare className="w-5 h-5" strokeWidth={2.2} />
                            </button>
                            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <Share2 className="w-5 h-5" strokeWidth={2.2} />
                            </button>
                            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <MoreHorizontal className="w-5 h-5" strokeWidth={2.2} />
                            </button>
                        </div>

                        {/* Guardado en Tableros Derecho */}
                        <div className="flex items-center gap-2 max-w-[60%] shrink-0">
                            <div className="relative">
                                <select 
                                    className="bg-transparent text-gray-900 text-sm font-semibold py-2 pl-3 pr-8 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors outline-none appearance-none"
                                    defaultValue="perfil"
                                >
                                    {tableros.map((tablero) => (
                                        <option key={tablero.key} value={tablero.key} className="font-semibold bg-white">
                                            {tablero.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <ChevronDown size={14} strokeWidth={3} />
                                </div>
                            </div>
                            
                            <Button 
                                color="danger" 
                                radius="full" 
                                size="md" 
                                className="font-bold text-white px-5 bg-[#e60023] hover:bg-[#b50019] transition-colors"
                            >
                                Guardar
                            </Button>
                        </div>
                    </div>

                    {/* DATOS DEL PIN */}
                    <div className="space-y-4">
                        <a 
                            href="#" 
                            className="text-xs font-medium underline text-gray-800 hover:text-black flex items-center gap-1"
                        >
                            Ver sitio web asociado <ExternalLink size={12} />
                        </a>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                            {pin.title || "Pin"}
                        </h1>
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-line">
                            {pin.description || "Contenido extraído para la sección correspondiente."}
                        </p>
                    </div>
                </div>

                {/* SECCIÓN INFERIOR: COMENTARIOS */}
                <div className="border-t border-gray-100 pt-5 mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-900">Comentarios</h3>
                        <span className="text-xs text-gray-500 font-medium">0 comentarios</span>
                    </div>

                    <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            M
                        </div>
                        <div className="w-full relative flex items-center bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-gray-400 transition-colors px-3 py-1">
                            <input
                                type="text"
                                placeholder="Añade un comentario..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full bg-transparent outline-none text-sm py-2 placeholder:text-gray-400 text-gray-800"
                            />
                            {comment && (
                                <button 
                                    onClick={() => setComment("")}
                                    className="text-xs font-bold text-red-600 hover:text-red-700 ml-2"
                                >
                                    Enviar
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Componente helper para la flecha del select nativo
const ChevronDown = ({ size = 16, className = "", strokeWidth = 2 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
);

export default PinDetailPanel;