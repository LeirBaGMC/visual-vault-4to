import { useState, useRef, useEffect, useCallback } from "react";

// Carrusel 3D tipo "coverflow" (inspirado en MusicPlayer2024, sin GSAP).
// Renderiza solo una ventana de tarjetas alrededor del centro: la central queda
// al frente y nítida, las laterales se abren en abanico, se hunden y se difuminan.
// Funciona bien con pocas o MUCHAS imágenes (a diferencia del cilindro denso).
const WINDOW = 4; // tarjetas visibles a cada lado del centro

const Carousel3D = ({
  items,
  renderCard, // (item, { isFront }) => JSX
  onSelectFront, // (item, index) => void
  onFrontChange, // (item, frontIndex) => void
  cardClass = "w-56 h-72",
  className = "",
}) => {
  const n = items.length;

  const [index, setIndex] = useState(0); // posición central (continua para animar)
  const [drag, setDrag] = useState(0); // offset fraccional mientras se arrastra
  const dragging = useRef(false);
  const startX = useRef(0);
  const moved = useRef(0);
  const wheelLock = useRef(false);
  const [gap, setGap] = useState(180);

  useEffect(() => {
    const calc = () => setGap(Math.max(110, Math.min(220, window.innerWidth * 0.16)));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const effective = index + drag;
  const frontIndex = n ? (((Math.round(index) % n) + n) % n) : 0;

  useEffect(() => {
    if (n > 0) onFrontChange?.(items[frontIndex], frontIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontIndex, n]);

  // offset más corto (con wrap) entre la tarjeta i y el centro actual
  const offsetDe = useCallback(
    (i) => {
      const eMod = ((effective % n) + n) % n;
      let raw = i - eMod;
      if (raw > n / 2) raw -= n;
      if (raw < -n / 2) raw += n;
      return raw;
    },
    [effective, n]
  );

  const onWheel = (e) => {
    if (wheelLock.current) return;
    wheelLock.current = true;
    setTimeout(() => (wheelLock.current = false), 380);
    setIndex((i) => i + (e.deltaY > 0 ? 1 : -1));
  };

  const onPointerDown = (e) => {
    dragging.current = true;
    startX.current = e.clientX;
    moved.current = 0;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    moved.current = Math.max(moved.current, Math.abs(dx));
    setDrag(-dx / gap); // arrastrar a la derecha → tarjeta anterior al centro
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setIndex((i) => Math.round(i + drag));
    setDrag(0);
  };

  const animating = !dragging.current;

  return (
    <div
      className={`relative w-full select-none touch-none cursor-grab active:cursor-grabbing ${className}`}
      style={{ perspective: "1400px" }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d" }}>
        {items.map((item, i) => {
          const o = offsetDe(i);
          const a = Math.abs(o);
          const visible = a <= WINDOW + 0.5;
          const isFront = a < 0.5;
          const ry = Math.max(-58, Math.min(58, -o * 42));
          const tx = o * gap;
          const tz = -a * 90;
          const opacity = visible ? Math.max(0, 1 - a / (WINDOW + 0.7)) : 0;
          return (
            <div
              key={i}
              className={`absolute top-0 left-0 ${cardClass} will-change-transform`}
              style={{
                transform: `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg)`,
                opacity,
                visibility: visible ? "visible" : "hidden",
                pointerEvents: visible ? "auto" : "none",
                zIndex: 1000 - Math.round(a * 10),
                transition: animating
                  ? "transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease"
                  : "none",
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (moved.current > 6) return;
                if (isFront) onSelectFront?.(item, i);
                else setIndex((idx) => idx + o);
              }}
            >
              {renderCard(item, { isFront })}
            </div>
          );
        })}
      </div>

      {n > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => i - 1)}
            className="absolute left-3 sm:left-8 top-1/2 -translate-y-1/2 z-[2000] w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 text-white text-xl flex items-center justify-center transition-colors"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            onClick={() => setIndex((i) => i + 1)}
            className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 z-[2000] w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 text-white text-xl flex items-center justify-center transition-colors"
            aria-label="Siguiente"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
};

export default Carousel3D;
