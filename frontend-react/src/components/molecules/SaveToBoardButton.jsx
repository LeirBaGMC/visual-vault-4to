import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Spinner,
} from "@heroui/react";
import { Plus, Check } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Botón "Guardar" que despliega los tableros del usuario y guarda el pin ahí.
// Reutilizable en las tarjetas del Feed y en la página de detalle del pin.
const SaveToBoardButton = ({ pin, size = "sm" }) => {
  const [open, setOpen] = useState(false);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedTo, setSavedTo] = useState(null);
  const [creando, setCreando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");

  const token = () => localStorage.getItem("token");
  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
  });

  const cargarBoards = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${apiUrl}/boards/`, { headers: authHeaders() });
      if (r.ok) setBoards(await r.json());
    } catch {
      /* sin conexión */
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (o) => {
    if (o && !token()) {
      alert("Inicia sesión para guardar en un tablero.");
      return;
    }
    setOpen(o);
    if (o) {
      setSavedTo(null);
      setCreando(false);
      cargarBoards();
    }
  };

  const guardarEn = async (board) => {
    try {
      const r = await fetch(`${apiUrl}/boards/${board.id}/pins`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ pin_id: pin.id }),
      });
      if (r.ok) {
        setSavedTo(board.id);
        setTimeout(() => setOpen(false), 750);
      }
    } catch {
      /* sin conexión */
    }
  };

  const crearYGuardar = async () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    try {
      const r = await fetch(`${apiUrl}/boards/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: nombre }),
      });
      if (r.ok) {
        const nuevo = await r.json();
        setNuevoNombre("");
        setCreando(false);
        setBoards((prev) => [nuevo, ...prev]);
        guardarEn(nuevo);
      }
    } catch {
      /* sin conexión */
    }
  };

  return (
    <Popover
      placement="bottom-end"
      isOpen={open}
      onOpenChange={handleOpenChange}
      backdrop="transparent"
    >
      <PopoverTrigger>
        {/* === BOTÓN CON DISEÑO PREMIUM === */}
        <Button
          radius="full"
          size={size}
          onClick={(e) => e.stopPropagation()}
          className="!rounded-full font-bold text-white bg-gradient-to-r from-[#E60023] to-[#ff3355] hover:from-[#c30420] hover:to-[#E60023] shadow-[0_4px_15px_rgba(230,0,35,0.3)] hover:shadow-[0_8px_20px_rgba(230,0,35,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 border-none"
        >
          Guardar
        </Button>
      </PopoverTrigger>

      <PopoverContent
        onClick={(e) => e.stopPropagation()}
        className="p-0 w-72 rounded-2xl overflow-hidden shadow-2xl border border-gray-100"
      >
        <div className="w-full bg-white text-gray-900">
          <div className="px-4 pt-3 pb-2 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">
              Guardar en tablero
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {loading ? (
              <div className="flex justify-center py-6">
                <Spinner size="sm" color="danger" />
              </div>
            ) : boards.length === 0 ? (
              <p className="text-xs text-gray-400 px-4 py-4 text-center">
                Aún no tienes tableros. Crea uno abajo.
              </p>
            ) : (
              boards.map((b) => (
                <button
                  key={b.id}
                  onClick={() => guardarEn(b)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {b.covers?.[0] && (
                      <img
                        src={b.covers[0]}
                        alt={b.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.pin_count} Pines</p>
                  </div>
                  {savedTo === b.id ? (
                    <span className="text-green-600 flex items-center gap-1 text-xs font-bold">
                      <Check size={16} /> Guardado
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors">
                      Guardar
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Crear tablero */}
          <div className="border-t border-gray-100 p-2">
            {creando ? (
              <div className="flex items-center gap-2 animate-fade-in-up">
                <input
                  autoFocus
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && crearYGuardar()}
                  placeholder="Nombre del tablero"
                  className="flex-1 text-sm px-3 py-2 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-gray-300 transition-shadow"
                />
                <button
                  onClick={crearYGuardar}
                  className="text-sm font-bold text-white bg-[#e60023] hover:bg-[#c30420] px-4 py-2 rounded-full shadow-md shadow-red-900/20 active:scale-95 transition-all"
                >
                  Crear
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreando(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Plus size={18} />
                </span>
                Crear tablero
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SaveToBoardButton;
