import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SaveToBoardButton from "../molecules/SaveToBoardButton";

const PinPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pin, setPin] = useState(null);
  const [relatedPins, setRelatedPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comentarioActual, setComentarioActual] = useState("");
  const [listaComentarios, setListaComentarios] = useState([]);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  // Cabecera con el token JWT (si el usuario inició sesión).
  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Token expirado/ inválido: lo limpiamos y mandamos a re-login (no fallar en silencio).
  const manejarSesionExpirada = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    alert("Tu sesión expiró. Inicia sesión de nuevo para continuar.");
    navigate("/login");
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Reiniciamos el estado social para NO arrastrar likes/comentarios del pin anterior.
      setIsLiked(false);
      setLikesCount(0);
      setListaComentarios([]);
      try {
        // 1. Pin actual
        const responsePin = await fetch(`${apiUrl}/pins/${id}`);
        if (responsePin.ok) setPin(await responsePin.json());

        // 2. Estado de likes de ESTE pin (y si yo ya di like)
        const responseLikes = await fetch(`${apiUrl}/pins/${id}/likes`, {
          headers: authHeaders(),
        });
        if (responseLikes.ok) {
          const likeData = await responseLikes.json();
          setLikesCount(likeData.likes_count);
          setIsLiked(likeData.liked_by_me);
        }

        // 3. Comentarios de ESTE pin
        const responseComments = await fetch(`${apiUrl}/pins/${id}/comments`);
        if (responseComments.ok) setListaComentarios(await responseComments.json());

        // 4. Resto de la bóveda para el Masonry derecho
        const responseAll = await fetch(`${apiUrl}/pins/`);
        if (responseAll.ok) {
          const allData = await responseAll.json();
          const filtered = allData
            .filter((p) => p.id !== parseInt(id))
            .sort(() => 0.5 - Math.random());
          setRelatedPins(filtered);
        }
      } catch (error) {
        console.error("Error al cargar los datos de la bóveda:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, apiUrl]);

  const copiarEnlace = () => {
    const urlPin = `${window.location.origin}/pin/${id}`;
    navigator.clipboard.writeText(urlPin);
    alert("¡Enlace copiado al portapapeles!");
  };

  // Like persistido: 1 por usuario y pin. El backend decide el estado real.
  const handleLike = async () => {
    if (!localStorage.getItem("token")) {
      alert("Inicia sesión para dar me gusta.");
      return navigate("/login");
    }
    try {
      const res = await fetch(`${apiUrl}/pins/${id}/like`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.status === 401) return manejarSesionExpirada();
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setLikesCount(data.likes_count);
      } else {
        console.error("Like falló:", res.status, await res.text());
        alert("No se pudo registrar el me gusta. Intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error al alternar el like:", error);
      alert("No hay conexión con el servidor.");
    }
  };

  // Comentario persistido en el pin actual (Enter o click).
  const enviarComentario = async (e) => {
    if (e.key && e.key !== "Enter") return;
    const texto = comentarioActual.trim();
    if (texto === "") return;
    if (!localStorage.getItem("token")) {
      alert("Inicia sesión para comentar.");
      return navigate("/login");
    }
    try {
      const res = await fetch(`${apiUrl}/pins/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ text: texto }),
      });
      if (res.status === 401) return manejarSesionExpirada();
      if (res.ok) {
        const nuevo = await res.json();
        setListaComentarios((prev) => [...prev, nuevo]);
        setComentarioActual("");
      } else {
        console.error("Comentario falló:", res.status, await res.text());
        alert("No se pudo enviar el comentario. Intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error al enviar el comentario:", error);
      alert("No hay conexión con el servidor.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090B0E] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-zinc-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!pin)
    return (
      <div className="min-h-screen bg-[#090B0E] text-white p-8 flex items-center justify-center font-display text-2xl">
        Referencia no encontrada en la Bóveda.
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#090B0E] text-white overflow-hidden">
      {/* =========================================
                COLUMNA IZQUIERDA: FOCO DEL PIN ACTUAL
               ========================================= */}
      <div className="w-full lg:w-[45%] xl:w-[40%] h-auto lg:h-screen lg:overflow-y-auto hide-scrollbar flex flex-col border-r border-zinc-800/50 relative">
        {/* BARRA DE ACCIONES SUPERIOR (Sticky para que siempre esté a la mano) */}
        <div className="sticky top-0 z-50 bg-[#090B0E]/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-zinc-800/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-zinc-400 hover:text-white transition-colors hover:scale-110 transform"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-all transform hover:scale-110 ${isLiked ? "text-red-500" : "text-zinc-400 hover:text-white"}`}
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-sm font-semibold tabular-nums">{likesCount}</span>
            </button>
            <button
              onClick={copiarEnlace}
              className="text-zinc-400 hover:text-white transition-all transform hover:scale-110"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </button>
          </div>
          <SaveToBoardButton pin={pin} size="md" />
        </div>

        {/* CONTENIDO DEL PIN */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Imagen Gigante */}
          <div className="w-full bg-zinc-900 rounded-3xl overflow-hidden mb-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <img
              src={pin.image_url}
              alt={pin.title}
              className="w-full h-auto object-cover max-h-[75vh]"
            />
          </div>

          {/* Metadatos */}
          <div className="flex-1 px-2">
            <span className="text-blue-500 text-xs font-bold tracking-widest uppercase mb-2 block">
              {pin.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-display font-medium tracking-tight mb-4">
              {pin.title}
            </h1>
            <p className="text-zinc-400 font-sans text-base leading-relaxed mb-8">
              {pin.description ||
                "Referencia visual de alta resolución extraída del ecosistema."}
            </p>

            {/* Creador */}
            <div className="flex items-center gap-4 mb-10 pb-8 border-b border-zinc-800">
              <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-lg">
                MC
              </div>
              <div>
                <p className="font-bold text-gray-200">Gabriel Minda Carrión</p>
                <p className="text-sm text-zinc-500">CTO & Curador</p>
              </div>
            </div>

            {/* Comentarios */}
            <div className="pb-10">
              <h3 className="text-xl font-display font-medium mb-6 flex justify-between">
                Comentarios{" "}
                <span className="text-zinc-600 text-sm">
                  {listaComentarios.length} comentarios
                </span>
              </h3>

              {/* Lista de comentarios renderizada */}
              <div className="space-y-4 mb-6">
                {listaComentarios.map((c) => (
                  <div key={c.id} className="flex gap-3 items-start">
                    <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0 uppercase">
                      {(c.username || "?").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-200">{c.username}</p>
                      <p className="text-zinc-400 text-sm">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={comentarioActual}
                  onChange={(e) => setComentarioActual(e.target.value)}
                  onKeyDown={enviarComentario}
                  placeholder="Añade un análisis o comentario técnico..."
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl py-4 pl-4 pr-24 focus:outline-none focus:border-zinc-600 transition-colors placeholder-zinc-600"
                />
                <button
                  onClick={enviarComentario}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-lg transition-colors"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
                COLUMNA DERECHA: MASONRY EXPLORER
               ========================================= */}
      <div className="w-full lg:w-[55%] xl:w-[60%] h-auto lg:h-screen lg:overflow-y-auto p-4 md:p-6 bg-[#090B0E]">
        {/* Título de la sección de descubrimiento */}
        <h2 className="text-lg font-display font-bold tracking-wider mb-6 text-zinc-300">
          Más referencias similares
        </h2>

        {/* Grid con columnas fluidas (CSS Columns) para un Masonry perfecto */}
        <div className="columns-2 sm:columns-3 xl:columns-4 gap-4 space-y-4">
          {relatedPins.map((relatedPin) => (
            <div
              key={relatedPin.id}
              onClick={() => navigate(`/pin/${relatedPin.id}`)}
              className="break-inside-avoid relative rounded-xl overflow-hidden cursor-pointer group shadow-lg bg-zinc-900"
            >
              <img
                src={relatedPin.image_url}
                alt={relatedPin.title}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Hover Overlay en tarjetas del grid derecho */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 pointer-events-none">
                <div className="flex justify-end pointer-events-auto">
                  <SaveToBoardButton pin={relatedPin} size="sm" />
                </div>
                <div className="w-full">
                  <h3 className="text-white font-bold text-sm truncate drop-shadow-md">
                    {relatedPin.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ESTILO GLOBAL PARA OCULTAR BARRAS DE SCROLL EN LA IZQUIERDA PERO PERMITIR SCROLL */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `,
        }}
      />
    </div>
  );
};

export default PinPage;
