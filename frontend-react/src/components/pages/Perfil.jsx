import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SaveToBoardButton from "../molecules/SaveToBoardButton";
import UploadModal from "../molecules/UploadModal";

const GRID_PATTERNS = [
  "md:col-span-2 md:row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-2",
  "col-span-1 row-span-1",
  "md:col-span-2 row-span-1",
  "col-span-1 row-span-2",
];

const Perfil = () => {
  const navigate = useNavigate();

  const [pins, setPins] = useState([]);
  const [filteredPins, setFilteredPins] = useState([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false); // ¿el usuario logueado es admin real?
  const [uploadOpen, setUploadOpen] = useState(false); // modal de subir imagen
  const [editingPinId, setEditingPinId] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  const esAdminRef = useRef(false); // espejo para leer el valor dentro del listener
  const authHeaders = () => {
    const t = localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  // Búsqueda y Categorías
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  // UX y Scroll
  const [isScrolling, setIsScrolling] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [isPillMenuOpen, setIsPillMenuOpen] = useState(false);

  // Estados Interactivos de Red Social
  const [likedPins, setLikedPins] = useState(new Set());
  const [toastMsg, setToastMsg] = useState("");
  const [categoryWeights, setCategoryWeights] = useState({});

  const scrollTimeout = useRef(null);
  const lastScrollY = useRef(0);
  const mainMenuRef = useRef(null);
  const pillMenuRef = useRef(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  const cargarPines = async () => {
    try {
      const response = await fetch(`${apiUrl}/pins/`);
      if (response.ok) {
        const data = await response.json();
        const shuffledData = data.sort(() => 0.5 - Math.random());
        setPins(shuffledData);
        setFilteredPins(shuffledData);
      }
    } catch (error) {
      console.error("Error API:", error);
    }
  };

  // Saber si el usuario logueado es admin real (el backend manda is_admin).
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${apiUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setEsAdmin(!!u?.is_admin))
      .catch(() => setEsAdmin(false));
  }, [apiUrl]);

  // Mantener el ref en sincronía para leerlo dentro del listener de teclado.
  useEffect(() => {
    esAdminRef.current = esAdmin;
    if (!esAdmin) setIsAdminMode(false); // al perder admin, salir del modo
  }, [esAdmin]);

  useEffect(() => {
    cargarPines();
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        // Solo los administradores reales pueden activar el modo controlador.
        if (!esAdminRef.current) {
          setToastMsg("Acceso de administrador requerido");
          setTimeout(() => setToastMsg(""), 2500);
          return;
        }
        setIsAdminMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let resultados = [...pins];

    if (selectedCategory === "Para Ti") {
      resultados.sort((a, b) => {
        const pesoA = categoryWeights[a.category] || 0;
        const pesoB = categoryWeights[b.category] || 0;
        return pesoB - pesoA;
      });
    } else if (selectedCategory !== "Todas") {
      resultados = resultados.filter(
        (pin) => pin.category === selectedCategory,
      );
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      resultados = resultados.filter(
        (pin) =>
          (pin.title && pin.title.toLowerCase().includes(term)) ||
          (pin.category && pin.category.toLowerCase().includes(term)) ||
          (pin.description && pin.description.toLowerCase().includes(term)),
      );
    }
    setFilteredPins(resultados);
  }, [searchTerm, selectedCategory, pins, categoryWeights]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 120) {
        setIsHeaderCollapsed(true);
        setIsMainMenuOpen(false);
      } else if (currentScrollY < lastScrollY.current || currentScrollY <= 50) {
        setIsHeaderCollapsed(false);
        setIsPillMenuOpen(false);
      }
      lastScrollY.current = currentScrollY;

      setIsScrolling(true);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => setIsScrolling(false), 250);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mainMenuRef.current && !mainMenuRef.current.contains(event.target))
        setIsMainMenuOpen(false);
      if (pillMenuRef.current && !pillMenuRef.current.contains(event.target))
        setIsPillMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLike = (e, pin) => {
    e.stopPropagation();
    const pinId = pin.id;
    const cat = pin.category;

    setLikedPins((prev) => {
      const newLikes = new Set(prev);
      if (newLikes.has(pinId)) {
        newLikes.delete(pinId);
        setCategoryWeights((w) => ({
          ...w,
          [cat]: Math.max((w[cat] || 0) - 1, 0),
        }));
      } else {
        newLikes.add(pinId);
        setCategoryWeights((w) => ({ ...w, [cat]: (w[cat] || 0) + 1 }));
      }
      return newLikes;
    });
  };

  const copiarEnlace = (e, pinId) => {
    e.stopPropagation();
    const urlPin = `${window.location.origin}/pin/${pinId}`;
    navigator.clipboard.writeText(urlPin);
    setToastMsg("Enlace de referencia copiado");
    setTimeout(() => setToastMsg(""), 3000);
  };

  const guardarEdicion = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/pins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title: newTitle }),
      });
      if (response.ok) {
        setEditingPinId(null);
        cargarPines();
      } else if (response.status === 401 || response.status === 403) {
        setToastMsg("No autorizado: se requiere admin");
        setTimeout(() => setToastMsg(""), 2500);
      }
    } catch (error) {
      console.error("Error al editar:", error);
    }
  };

  const eliminarPin = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar esta referencia?")) return;
    try {
      const response = await fetch(`${apiUrl}/pins/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (response.ok) {
        cargarPines();
      } else if (response.status === 401 || response.status === 403) {
        setToastMsg("No autorizado: se requiere admin");
        setTimeout(() => setToastMsg(""), 2500);
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const categoriasUnicas = [
    "Todas",
    "Para Ti",
    ...new Set(pins.map((pin) => pin.category).filter(Boolean)),
  ];

  return (
    <div className="min-h-screen bg-[#090B0E] p-4 md:p-8 text-white relative">
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => cargarPines()}
        categorias={categoriasUnicas.filter((c) => c !== "Todas" && c !== "Para Ti")}
      />

      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-zinc-800 text-white px-6 py-3 rounded-full shadow-2xl border border-zinc-700 animate-fade-in-up flex items-center gap-2">
          <svg
            className="w-5 h-5 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-bold tracking-widest uppercase">
            {toastMsg}
          </span>
        </div>
      )}

      {isAdminMode && (
        <div className="mt-28 mb-6 p-3 bg-red-950/40 border border-red-800 text-red-400 rounded-sm text-center font-mono tracking-widest text-xs animate-pulse">
          ⚠️ MODO CONTROLADOR ACTIVO — PERMISOS DE ESCRITURA TOTAL
        </div>
      )}

      {/* HEADER EXPANDIDO */}
      <div
        className={`fixed z-50 top-4 left-4 right-4 md:left-8 md:right-8 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${isHeaderCollapsed ? "opacity-0 -translate-y-12 pointer-events-none" : "opacity-100 translate-y-0 pointer-events-auto"}`}
      >
        <div className="flex gap-3 w-full md:w-1/2">
          <div className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar referencias en el ecosistema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm pl-11 pr-4 py-3 rounded-full focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="bg-white hover:bg-gray-200 text-black px-5 py-3 rounded-full shadow-lg flex items-center justify-center flex-shrink-0 font-bold text-sm tracking-wider uppercase transition-colors"
          >
            <svg
              className="w-5 h-5 md:mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden md:block">Subir</span>
          </button>
        </div>

        <div className="flex gap-4 w-full md:w-auto items-center justify-between md:justify-end mt-4 md:mt-0">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar items-center max-w-[calc(100%-60px)] md:max-w-none">
            {categoriasUnicas.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all ${
                  selectedCategory === cat
                    ? "bg-zinc-100 text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]"
                    : cat === "Para Ti"
                      ? "bg-gradient-to-r from-blue-900 to-indigo-900 text-blue-300 border border-blue-700 hover:brightness-110"
                      : "bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white"
                }`}
              >
                {cat === "Para Ti" ? "Para Ti " : cat}
              </button>
            ))}
          </div>

          <div className="relative flex-shrink-0" ref={mainMenuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMainMenuOpen(!isMainMenuOpen);
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-white w-11 h-11 rounded-full flex items-center justify-center font-bold font-display shadow-lg border border-zinc-700 hover:border-zinc-500 transition-all active:scale-95"
            >
              MC
            </button>

            {isMainMenuOpen && (
              <div className="absolute top-[130%] right-0 w-72 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.9)] overflow-hidden z-[100] animate-fade-in-up">
                <div className="p-4 border-b border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
                    Identidad de Sesión
                  </p>
                  <div className="flex items-center gap-3 bg-zinc-800/50 p-2 rounded-xl">
                    <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center font-bold text-gray-300">
                      MC
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Gabriel Minda
                      </p>
                      <p className="text-xs text-zinc-400">Personal</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  {/* REDIRECCIÓN REDISEÑADA EN MENÚ PRINCIPAL */}
                  <button
                    onClick={() => navigate("/tableros")}
                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg font-medium transition-colors flex items-center justify-between group"
                  >
                    <span>Mis Tableros (3D)</span>
                    <svg
                      className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
                    Añadir cuenta
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Volver al Inicio
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-950/50 rounded-lg transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HEADER COMPACTO (PÍLDORA) */}
      <div
        className={`fixed z-50 top-4 right-4 md:right-8 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 shadow-2xl rounded-full p-1.5 flex items-center gap-2 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                ${isHeaderCollapsed ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none"}`}
      >
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setIsHeaderCollapsed(false);
          }}
          className="bg-transparent hover:bg-zinc-800 text-white p-2.5 rounded-full transition-colors group"
        >
          <svg
            className="w-5 h-5 group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
        <button
          onClick={() => setUploadOpen(true)}
          className="bg-zinc-800 hover:bg-zinc-700 text-white p-2.5 rounded-full transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        <div className="relative" ref={pillMenuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPillMenuOpen(!isPillMenuOpen);
            }}
            className="bg-zinc-700 text-white w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold font-display border border-zinc-600 hover:border-zinc-400 transition-all active:scale-95"
          >
            MC
          </button>
          {isPillMenuOpen && (
            <div className="absolute top-[130%] right-0 w-72 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.9)] overflow-hidden z-[100] animate-fade-in-up">
              <div className="p-4 border-b border-zinc-800">
                <p className="text-xs text-zinc-400 uppercase tracking-widest mb-3">
                  Identidad de Sesión
                </p>
                <div className="flex items-center gap-3 bg-zinc-800/50 p-2 rounded-xl">
                  <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center font-bold">
                    MC
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Gabriel Minda
                    </p>
                    <p className="text-xs text-zinc-400">Personal</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                {/* REDIRECCIÓN EN MENÚ PÍLDORA FLOTANTE */}
                <button
                  onClick={() => navigate("/tableros")}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg font-medium transition-colors flex items-center justify-between group"
                >
                  <span>Mis Tableros (3D)</span>
                  <svg
                    className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
                <button className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
                  Añadir cuenta
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-950/50 rounded-lg transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN MASONRY + SECTOR DE TABS DE PERFIL */}
      <div className="pt-32 md:pt-24">
        {/* =========================================
                    NUEVO: SUB-HEADER DE PESTAÑAS (TABS)
                   ========================================= */}
        <div className="flex justify-center gap-8 border-b border-zinc-800/60 w-full mb-8">
          <button className="pb-4 border-b-2 border-white text-white font-bold text-sm tracking-wider uppercase transition-all">
            Pines
          </button>
          <button
            onClick={() => navigate("/tableros")}
            className="pb-4 border-b-2 border-transparent text-zinc-500 hover:text-zinc-300 font-bold text-sm tracking-wider uppercase transition-all"
          >
            Tableros
          </button>
          <button
            onClick={() => alert("Próximamente: Motor de Collages")}
            className="pb-4 border-b-2 border-transparent text-zinc-500 hover:text-zinc-300 font-bold text-sm tracking-wider uppercase transition-all"
          >
            Collages
          </button>
        </div>

        {filteredPins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-50">
            <p className="text-xl font-display tracking-widest text-zinc-500">
              NO SE ENCONTRARON REFERENCIAS
            </p>
          </div>
        ) : (
          <div
            className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[220px] md:auto-rows-[280px] grid-flow-dense group ${isScrolling ? "pointer-events-none" : ""}`}
          >
            {filteredPins.map((pin, index) => {
              const patternClass = GRID_PATTERNS[index % GRID_PATTERNS.length];
              const isLiked = likedPins.has(pin.id);

              return (
                <div
                  key={pin.id}
                  onClick={() =>
                    editingPinId !== pin.id && navigate(`/pin/${pin.id}`)
                  }
                  className={`relative rounded-sm overflow-hidden shadow-lg cursor-pointer flex flex-col justify-end p-6 group/card animate-fade-in-up ${patternClass}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-500 delay-0 group-hover:delay-500 group-hover:blur-[12px] group-hover:brightness-40 group-hover/card:!blur-none group-hover/card:!brightness-100 group-hover/card:!delay-0 group-hover/card:scale-[1.03]"
                    style={{ backgroundImage: `url(${pin.image_url})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

                  <div
                    className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Guardar en tablero (desplegable real) */}
                    <SaveToBoardButton pin={pin} size="sm" />
                    <button
                      onClick={(e) => toggleLike(e, pin)}
                      className="bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 rounded-full p-2.5 shadow-lg flex items-center justify-center transition-all transform hover:scale-110 active:scale-95"
                    >
                      <svg
                        className={`w-5 h-5 transition-colors duration-300 ${isLiked ? "text-red-500 fill-red-500" : "text-white"}`}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={isLiked ? "0" : "2"}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="absolute bottom-4 right-4 z-20 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => copiarEnlace(e, pin.id)}
                      className="bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 text-white rounded-full p-2.5 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                      </svg>
                    </button>
                  </div>

                  <div className="z-10 w-full relative pointer-events-none opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-y-4 group-hover/card:translate-y-0">
                    {editingPinId === pin.id ? (
                      <div
                        className="flex gap-2 pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 text-white text-sm px-2 py-1 rounded-sm w-full"
                        />
                        <button
                          onClick={() => guardarEdicion(pin.id)}
                          className="bg-blue-600 text-xs px-2 py-1 rounded-sm font-bold"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-lg md:text-2xl font-display font-bold tracking-wider drop-shadow-lg text-gray-100 truncate">
                          {pin.title}
                        </h1>
                        <h3 className="text-xs font-sans tracking-widest text-gray-400 mt-1 uppercase">
                          {pin.category}
                        </h3>
                      </>
                    )}

                    {isAdminMode && editingPinId !== pin.id && (
                      <div
                        className="flex gap-2 mt-3 z-30 relative pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setEditingPinId(pin.id);
                            setNewTitle(pin.title);
                          }}
                          className="bg-zinc-800/90 text-[10px] uppercase font-bold px-3 py-1 rounded-sm text-zinc-300 hover:text-white"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => eliminarPin(pin.id, e)}
                          className="bg-red-950/90 text-[10px] uppercase font-bold px-3 py-1 rounded-sm text-red-400 hover:text-white"
                        >
                          Borrar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Perfil;
