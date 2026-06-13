import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Carousel3D from "../organisms/Carousel3D";

// Sección de pines: mismo carrusel 3D. La rueda/arrastre avanza un pin a la vez
// para visualizarlos. Click en el pin central → abre su detalle.
const Visualizador = () => {
  const navigate = useNavigate();
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actual, setActual] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  useEffect(() => {
    fetch(`${apiUrl}/pins/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setPins(arr);
        setActual(arr[0] || null);
      })
      .catch(() => setPins([]))
      .finally(() => setLoading(false));
  }, [apiUrl]);

  return (
    <div className="min-h-screen bg-[#070809] text-white flex flex-col overflow-hidden">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-5 py-4 z-30">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>
        <span className="text-xs uppercase tracking-[0.25em] text-zinc-500">
          Visualizar pines
        </span>
        <span className="w-16" />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
        </div>
      ) : pins.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          No hay pines para visualizar.
        </div>
      ) : (
        <>
          <Carousel3D
            items={pins}
            className="flex-1 min-h-[55vh]"
            cardClass="w-60 h-80 sm:w-72 sm:h-96"
            onFrontChange={(pin) => setActual(pin)}
            onSelectFront={(pin) => navigate(`/pin/${pin.id}`)}
            renderCard={(pin, { isFront }) => (
              <div
                className={`w-full h-full rounded-3xl overflow-hidden bg-zinc-900 shadow-[0_40px_90px_-25px_rgba(0,0,0,0.95)] ring-1 transition-all duration-300 ${
                  isFront ? "ring-white/40" : "ring-white/10"
                }`}
              >
                <img
                  src={pin.image_url}
                  alt={pin.title}
                  draggable={false}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          />

          {/* Metadata del pin central */}
          <div className="text-center px-6 pb-10 z-30">
            <span className="text-blue-400/90 text-xs font-bold tracking-widest uppercase">
              {actual?.category}
            </span>
            <h1 className="text-2xl md:text-3xl font-display font-medium tracking-tight mt-1">
              {actual?.title?.trim() || "Sin título"}
            </h1>
            <p className="text-zinc-500 text-sm mt-2">
              {actual?.creator_username ? `Por ${actual.creator_username} · ` : ""}
              Click en la imagen central para abrirla · rueda para cambiar
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Visualizador;
