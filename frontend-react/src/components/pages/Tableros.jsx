import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

const Tableros = () => {
  const navigate = useNavigate();
  const [pins, setPins] = useState([]);
  const [misBoards, setMisBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("espiral"); // "espiral" | "grid"

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  useEffect(() => {
    // Pines (para la espiral) + mis tableros reales (para la cuadrícula).
    const token = localStorage.getItem("token");
    Promise.all([
      fetch(`${apiUrl}/pins/`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${apiUrl}/boards/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([pinsData, boardsData]) => {
        setPins(Array.isArray(pinsData) ? pinsData : []);
        setMisBoards(Array.isArray(boardsData) ? boardsData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiUrl]);

  // Agrupamos los pines por categoría → cada categoría es un "tablero" real.
  const tableros = useMemo(() => {
    const mapa = new Map();
    for (const p of pins) {
      const cat = p.category || "General";
      if (!mapa.has(cat)) mapa.set(cat, []);
      mapa.get(cat).push(p);
    }
    return Array.from(mapa, ([nombre, items]) => ({ nombre, items })).sort(
      (a, b) => b.items.length - a.items.length
    );
  }, [pins]);

  // Tarjetas de la espiral: muestra intercalada por categoría (round-robin)
  // para que el "churro" muestre variedad y no 14 pines de la misma sección.
  const spiralItems = useMemo(() => {
    if (tableros.length === 0) return [];
    const colas = tableros.map((t) => [...t.items]);
    const resultado = [];
    let quedan = true;
    while (quedan && resultado.length < 16) {
      quedan = false;
      for (const cola of colas) {
        if (cola.length) {
          resultado.push(cola.shift());
          quedan = true;
          if (resultado.length >= 16) break;
        }
      }
    }
    return resultado;
  }, [tableros]);

  return (
    <div className="min-h-screen bg-[#070809] text-white pt-24 pb-16 overflow-hidden">
      {/* HEADER DE PERFIL */}
      <header className="flex flex-col items-center mb-8 px-4 relative z-20">
        <div className="w-24 h-24 bg-gradient-to-br from-zinc-700 to-zinc-900 ring-1 ring-white/10 rounded-full mb-4 flex items-center justify-center text-2xl font-bold shadow-xl">
          MC
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Gabriel Minda</h1>
        <p className="text-zinc-400 text-sm mt-1">@gabominda • Siguiendo a 0</p>

        {/* Toggle Espiral / Cuadrícula (estilo pacomepertant) */}
        <div className="mt-6 inline-flex items-center gap-1 p-1 rounded-full bg-zinc-900/70 ring-1 ring-white/10 backdrop-blur">
          <ToggleBtn activo={vista === "espiral"} onClick={() => setVista("espiral")}>
            Espiral
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
      ) : vista === "espiral" ? (
        <SpiralGallery
          items={spiralItems}
          onSelect={(p) => navigate(`/pin/${p.id}`)}
        />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-lg font-semibold text-zinc-200">Tus tableros</h2>
            <span className="text-sm text-zinc-500">
              {misBoards.length} {misBoards.length === 1 ? "tablero" : "tableros"}
            </span>
          </div>

          {misBoards.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-400 mb-2">Todavía no tienes tableros.</p>
              <p className="text-zinc-600 text-sm">
                Pasa el cursor sobre cualquier pin y pulsa{" "}
                <span className="text-zinc-300 font-semibold">Guardar</span> para
                crear tu primer tablero.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
              {misBoards.map((board, i) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  index={i}
                  onClick={() => navigate("/perfil")}
                />
              ))}
            </div>
          )}
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

// ============================================================
//  ESPIRAL 3D (billboards proyectados sobre una hélice rotante)
// ============================================================
const SpiralGallery = ({ items, onSelect }) => {
  const cardRefs = useRef([]);
  const progressRef = useRef(0); // avance del bucle: las tarjetas SUBEN al aumentar
  const dragging = useRef(false);
  const lastY = useRef(0);
  const movedRef = useRef(0);
  // Dimensiones de la hélice, recalculadas según el ancho de pantalla (responsive).
  const dimsRef = useRef({ R: 230, H: 760 });

  const N = items.length;

  useEffect(() => {
    const calcDims = () => {
      const w = window.innerWidth;
      // En móvil el radio y el alto se achican para que el "churro" no se salga.
      dimsRef.current = {
        R: Math.max(95, Math.min(230, w * 0.3)),
        H: Math.max(380, Math.min(760, w * 1.05)),
      };
    };
    calcDims();
    window.addEventListener("resize", calcDims);
    return () => window.removeEventListener("resize", calcDims);
  }, []);

  useEffect(() => {
    if (N === 0) return;
    let raf;

    const TURNS = 2; // vueltas que da mientras sube de abajo a arriba
    const frac = (n) => n - Math.floor(n); // parte fraccionaria (envuelve en [0,1))

    const layout = () => {
      const progress = progressRef.current;
      const { R: RADIUS, H: HEIGHT } = dimsRef.current;
      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        // u ∈ [0,1): 0 = abajo, 1 = arriba. Sube con el tiempo y vuelve a entrar por abajo.
        const u = frac(i / N + progress);
        const angle = u * TURNS * Math.PI * 2;

        const x = Math.sin(angle) * RADIUS;
        const z = Math.cos(angle) * RADIUS; // -R fondo .. +R frente
        const depth = (z + RADIUS) / (2 * RADIUS); // 0 fondo .. 1 frente
        const persp = 0.55 + depth * 0.6; // foreshortening por profundidad

        const screenX = x * persp;
        const screenY = -(u - 0.5) * HEIGHT * persp; // arriba = negativo en pantalla

        const scale = 0.42 + depth * 0.85;
        const blur = (1 - depth) * 5;

        // Inclinación tipo "página flotante" siguiendo el enroscado (sin espejar texto).
        const rotY = -(x / RADIUS) * 16;
        const rotZ = -(x / RADIUS) * 9;

        // Opacidad: por profundidad + desvanecido en los extremos para ocultar el salto del bucle.
        const edge = Math.min(1, Math.min(u, 1 - u) / 0.12);
        const opacity = (0.12 + depth * 0.88) * edge;

        el.style.transform =
          `translate(-50%, -50%) translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0) ` +
          `rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.filter = `blur(${blur.toFixed(2)}px)`;
        el.style.zIndex = String(Math.round(depth * 100));
      }
    };

    const tick = () => {
      if (!dragging.current) progressRef.current += 0.0011; // ascenso automático suave
      layout();
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [N]);

  // Arrastrar verticalmente para empujar la espiral arriba/abajo
  const onPointerDown = (e) => {
    dragging.current = true;
    lastY.current = e.clientY;
    movedRef.current = 0;
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dy = e.clientY - lastY.current;
    lastY.current = e.clientY;
    movedRef.current += Math.abs(dy);
    progressRef.current -= dy * 0.0009; // arrastrar hacia arriba = avanzar el ascenso
  };
  const endDrag = () => {
    dragging.current = false;
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      className="relative w-full h-[82vh] min-h-[560px] select-none cursor-grab active:cursor-grabbing touch-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "46px 46px",
        backgroundPosition: "center",
        maskImage:
          "radial-gradient(ellipse 75% 70% at 50% 50%, black 40%, transparent 85%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 75% 70% at 50% 50%, black 40%, transparent 85%)",
      }}
    >
      {/* Punto de fuga / perspectiva para el enroscado 3D */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{ perspective: "1300px", transformStyle: "preserve-3d" }}
      >
        {items.map((p, i) => (
          <div
            key={p.id ?? i}
            ref={(el) => (cardRefs.current[i] = el)}
            onClick={() => {
              if (movedRef.current < 6) onSelect(p);
            }}
            className="absolute w-28 h-36 sm:w-44 sm:h-56 will-change-transform"
            style={{ left: 0, top: 0 }}
          >
            <div className="group w-full h-full rounded-2xl overflow-hidden ring-1 ring-white/15 bg-zinc-900 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.95)]">
              <img
                src={p.image_url}
                alt={p.title}
                loading="lazy"
                draggable={false}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 to-transparent">
                <p className="text-[11px] uppercase tracking-widest text-blue-300/90 font-bold truncate">
                  {p.category || "Tablero"}
                </p>
                <p className="text-sm font-semibold truncate">{p.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.2em] text-zinc-600">
        sube en espiral · arrastra para mover
      </p>
    </div>
  );
};

const ToggleBtn = ({ activo, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
      activo
        ? "bg-white text-black shadow"
        : "text-zinc-400 hover:text-white"
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
      style={{
        animation: `board-in 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 0.06}s both`,
      }}
      className="group text-left focus:outline-none"
    >
      <div className="relative rounded-3xl overflow-hidden ring-1 ring-white/10 bg-zinc-900 shadow-lg transition-all duration-300 group-hover:ring-white/25 group-hover:shadow-2xl group-hover:-translate-y-1">
        <div className="grid grid-cols-3 grid-rows-2 gap-1 h-44 sm:h-52">
          <div className="col-span-2 row-span-2 overflow-hidden bg-zinc-800">
            {big && (
              <img
                src={big}
                alt={board.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
          </div>
          {[0, 1].map((slot) => (
            <div key={slot} className="overflow-hidden bg-zinc-800">
              {small[slot] && (
                <img
                  src={small[slot]}
                  alt={board.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 px-1">
        <h3 className="font-semibold text-[15px] text-zinc-100 truncate group-hover:text-white">
          {board.name}
        </h3>
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
