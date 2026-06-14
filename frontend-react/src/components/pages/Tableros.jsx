import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Carousel3D from "../organisms/Carousel3D";

const Tableros = () => {
  const navigate = useNavigate();
  const [misBoards, setMisBoards] = useState([]);
  const [perfilUser, setPerfilUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("carrusel"); // "carrusel" | "grid"

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const auth = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${apiUrl}/boards/`, { headers: auth })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMisBoards(Array.isArray(data) ? data : []))
      .catch(() => setMisBoards([]))
      .finally(() => setLoading(false));
    fetch(`${apiUrl}/users/me`, { headers: auth })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setPerfilUser(u))
      .catch(() => {});
  }, [apiUrl]);

  const displayName = perfilUser?.name || perfilUser?.username || "Tu perfil";
  const handle = perfilUser?.username ? `@${perfilUser.username}` : "";
  const iniciales = (perfilUser?.name || perfilUser?.username || "VV").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#070809] text-white pt-24 pb-16 overflow-hidden">
      {/* HEADER DE PERFIL */}
      <header className="flex flex-col items-center mb-8 px-4 relative z-20">
        <div className="w-24 h-24 bg-gradient-to-br from-zinc-700 to-zinc-900 ring-1 ring-white/10 rounded-full mb-4 flex items-center justify-center text-2xl font-bold shadow-xl">
          {iniciales}
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tight">{displayName}</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {handle && <>{handle} • </>}Siguiendo a 0
        </p>

        {/* Toggle Carrusel / Cuadrícula */}
        <div className="mt-6 inline-flex items-center gap-1 p-1 rounded-full bg-zinc-900/70 ring-1 ring-white/10 backdrop-blur">
          <ToggleBtn activo={vista === "carrusel"} onClick={() => setVista("carrusel")}>
            Carrusel
          </ToggleBtn>
          <ToggleBtn activo={vista === "grid"} onClick={() => setVista("grid")}>
            Cuadrícula
          </ToggleBtn>
        </div>
      </header>

      {loading ? (
        <div className="max-w-7xl mx-auto px-6">
          <BoardsSkeleton />
        </div>
      ) : misBoards.length === 0 ? (
        <div className="text-center py-20 px-4">
          <p className="text-zinc-400 mb-2">Todavía no tienes tableros.</p>
          <p className="text-zinc-600 text-sm">
            Pasa el cursor sobre cualquier pin y pulsa{" "}
            <span className="text-zinc-300 font-semibold">Guardar</span> para crear tu primer tablero.
          </p>
        </div>
      ) : vista === "carrusel" ? (
        <>
          <Carousel3D
            items={misBoards}
            className="h-[64vh] min-h-[440px]"
            cardClass="w-56 h-72 sm:w-64 sm:h-80"
            onSelectFront={() => navigate("/perfil")}
            renderCard={(board, { isFront }) => (
              <div
                className={`w-full h-full rounded-3xl overflow-hidden bg-zinc-900 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.95)] ring-1 transition-all duration-300 ${
                  isFront ? "ring-white/40" : "ring-white/10"
                }`}
              >
                {board.covers?.[0] ? (
                  <img
                    src={board.covers[0]}
                    alt={board.name}
                    draggable={false}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent flex flex-col justify-end p-5">
                  <h3 className="font-bold text-lg leading-tight">{board.name}</h3>
                  <p className="text-xs text-zinc-300 mt-0.5">{board.pin_count} Pines</p>
                </div>
              </div>
            )}
          />
          <p className="text-center text-[11px] uppercase tracking-[0.2em] text-zinc-600 mt-4">
            arrastra, usa la rueda o las flechas
          </p>
        </>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-lg font-semibold text-zinc-200">Tus tableros</h2>
            <span className="text-sm text-zinc-500">
              {misBoards.length} {misBoards.length === 1 ? "tablero" : "tableros"}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
            {misBoards.map((board, i) => (
              <BoardCard key={board.id} board={board} index={i} onClick={() => navigate("/perfil")} />
            ))}
          </div>
        </main>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes board-in {
              from { opacity: 0; transform: translateY(16px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `,
        }}
      />
    </div>
  );
};

const ToggleBtn = ({ activo, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
      activo ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"
    }`}
  >
    {children}
  </button>
);

// --- Tarjeta de tablero (vista Cuadrícula) ---
const BoardCard = ({ board, index, onClick }) => {
  const covers = board.covers || [];
  const [big, segundo, tercero] = covers;
  const small = [segundo, tercero];

  return (
    <button
      onClick={onClick}
      style={{ animation: `board-in 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 0.06}s both` }}
      className="group text-left focus:outline-none"
    >
      <div className="relative rounded-3xl overflow-hidden ring-1 ring-white/10 bg-zinc-900 shadow-lg transition-all duration-300 group-hover:ring-white/25 group-hover:shadow-2xl group-hover:-translate-y-1">
        <div className="grid grid-cols-3 grid-rows-2 gap-1 h-44 sm:h-52">
          <div className="col-span-2 row-span-2 overflow-hidden bg-zinc-800">
            {big && (
              <img src={big} alt={board.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            )}
          </div>
          {[0, 1].map((slot) => (
            <div key={slot} className="overflow-hidden bg-zinc-800">
              {small[slot] && (
                <img src={small[slot]} alt={board.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 px-1">
        <h3 className="font-semibold text-[15px] text-zinc-100 truncate group-hover:text-white">{board.name}</h3>
        <p className="text-xs text-zinc-500 mt-0.5">{board.pin_count} Pines</p>
      </div>
    </button>
  );
};

const BoardsSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="rounded-3xl bg-zinc-900 ring-1 ring-white/5 h-44 sm:h-52" />
        <div className="h-3.5 w-2/3 bg-zinc-800 rounded mt-3" />
        <div className="h-2.5 w-1/4 bg-zinc-900 rounded mt-2" />
      </div>
    ))}
  </div>
);

export default Tableros;
