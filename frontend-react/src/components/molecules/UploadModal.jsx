import { useState, useRef, useEffect } from "react";
import { X, UploadCloud, ImagePlus } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Modal para que un usuario suba una foto (POST /pins/upload/).
// El título es opcional; si se deja vacío, el pin queda "Sin título".
const UploadModal = ({ isOpen, onClose, onUploaded, categorias = [] }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [category, setCategory] = useState("");
  const [boardId, setBoardId] = useState(""); // tablero destino (opcional)
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // Cargar los tableros del usuario al abrir (para el selector "Tablero").
  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${apiUrl}/boards/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBoards(Array.isArray(d) ? d : []))
      .catch(() => setBoards([]));
  }, [isOpen]);

  if (!isOpen) return null;

  const elegir = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const cerrar = () => {
    setFile(null);
    setPreview(null);
    setTitle("");
    setDescription("");
    setLink("");
    setCategory("");
    setBoardId("");
    setError("");
    onClose();
  };

  const subir = async () => {
    if (!file) {
      setError("Elige una imagen primero.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title.trim());
      fd.append("category", category.trim() || "General");
      fd.append("description", description.trim());
      fd.append("link", link.trim());

      const token = localStorage.getItem("token");
      const r = await fetch(`${apiUrl}/pins/upload/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await r.json();
      if (r.status === 401 || r.status === 403) {
        throw new Error("Inicia sesión para subir imágenes.");
      }
      if (!r.ok) throw new Error(data.detail || "No se pudo subir la imagen.");

      // Si se eligió un tablero, guardamos el pin recién creado en él.
      if (boardId && data.pin?.id) {
        await fetch(`${apiUrl}/boards/${boardId}/pins`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ pin_id: data.pin.id }),
        }).catch(() => {});
      }

      onUploaded?.(data.pin);
      cerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={cerrar}
    >
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Subir una imagen</h2>
          <button
            onClick={cerrar}
            className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Dropzone / preview */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              elegir(e.dataTransfer.files?.[0]);
            }}
            className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-950/50 flex flex-col items-center justify-center gap-2 text-zinc-400 overflow-hidden transition-colors"
          >
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-contain" />
            ) : (
              <>
                <UploadCloud className="w-10 h-10" />
                <span className="text-sm font-medium">
                  Arrastra una imagen o haz click para elegir
                </span>
                <span className="text-xs text-zinc-600">PNG, JPG, WEBP</span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => elegir(e.target.files?.[0])}
          />

          {/* Título (opcional) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Título <span className="text-zinc-600 normal-case">(opcional)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Si lo dejas vacío, será “Sin título”"
              className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-zinc-400 transition-colors placeholder:text-zinc-600"
            />
          </div>

          {/* Descripción (opcional) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Descripción <span className="text-zinc-600 normal-case">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Describe tu Pin"
              className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-zinc-400 transition-colors placeholder:text-zinc-600 resize-none"
            />
          </div>

          {/* Enlace (opcional) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Enlace <span className="text-zinc-600 normal-case">(opcional)</span>
            </label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-zinc-400 transition-colors placeholder:text-zinc-600"
            />
          </div>

          {/* Tablero destino (opcional) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Tablero
            </label>
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-zinc-400 transition-colors appearance-none"
            >
              <option value="">Sin tablero</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Categoría
            </label>
            <input
              list="categorias-existentes"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="General"
              className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-zinc-400 transition-colors placeholder:text-zinc-600"
            />
            <datalist id="categorias-existentes">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <button
            onClick={subir}
            disabled={loading}
            className="w-full bg-[#e60023] hover:bg-[#b6001a] disabled:opacity-60 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Subiendo y validando…
              </>
            ) : (
              <>
                <ImagePlus className="w-5 h-5" /> Subir imagen
              </>
            )}
          </button>
          <p className="text-[11px] text-zinc-600 text-center">
            La imagen pasa por validación de contenido (IA) antes de publicarse.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
