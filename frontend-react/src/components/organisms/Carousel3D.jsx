import { useState, useRef, useEffect, useCallback } from "react";

// Carrusel 3D en CSS (técnica de MusicPlayer2024, reimplementada sin GSAP):
// tarjetas en círculo con rotateY(i*step) translateZ(R) dentro de un anillo
// con perspective + preserve-3d. El anillo rota para traer una tarjeta al frente.
// Navegación: arrastre, rueda y click. Snap a la tarjeta más cercana al soltar.
const Carousel3D = ({
  items,
  renderCard, // (item, { isFront }) => JSX
  onSelectFront, // (item, index) => void
  onFrontChange, // (item, frontIndex) => void  (al cambiar la tarjeta central)
  cardClass = "w-56 h-72", // tamaño de tarjeta (responsive via clases sm:)
  radius, // px; si se omite, se calcula por ancho de pantalla
  className = "",
}) => {
  const n = items.length;
  const step = n > 0 ? 360 / n : 0;

  const [index, setIndex] = useState(0); // índice continuo del frente
  const [liveRotation, setLiveRotation] = useState(null); // ángulo en vivo al arrastrar
  const [R, setR] = useState(radius || 300);

  const dragging = useRef(false);
  const startX = useRef(0);
  const startRot = useRef(0);
  const moved = useRef(0);
  const wheelLock = useRef(false);

  // Radio responsive
  useEffect(() => {
    if (radius) {
      setR(radius);
      return;
    }
    const calc = () => setR(Math.max(150, Math.min(330, window.innerWidth * 0.26)));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [radius]);

  const baseRotation = -index * step;
  const rotation = liveRotation !== null ? liveRotation : baseRotation;
  const frontIndex = n ? (((Math.round(-rotation / step) % n) + n) % n) : 0;

  // Notificar cuál es la tarjeta central (para mostrar su metadata fuera).
  useEffect(() => {
    if (n > 0) onFrontChange?.(items[frontIndex], frontIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontIndex, n]);

  const irA = useCallback(
    (targetMod) => {
      // rotar por el camino más corto hasta la tarjeta targetMod
      let delta = targetMod - (((index % n) + n) % n);
      if (delta > n / 2) delta -= n;
      if (delta < -n / 2) delta += n;
      setIndex((i) => i + delta);
    },
    [index, n]
  );

  const onWheel = (e) => {
    if (wheelLock.current) return;
    wheelLock.current = true;
    setTimeout(() => (wheelLock.current = false), 420);
    setIndex((i) => i + (e.deltaY > 0 ? 1 : -1));
  };

  const onPointerDown = (e) => {
    dragging.current = true;
    startX.current = e.clientX;
    startRot.current = rotation;
    moved.current = 0;
    setLiveRotation(rotation);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    moved.current = Math.max(moved.current, Math.abs(dx));
    setLiveRotation(startRot.current + dx * 0.26);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const nearest = Math.round(-(liveRotation ?? rotation) / step);
    setIndex(nearest);
    setLiveRotation(null);
  };

  return (
    <div
      className={`relative w-full select-none touch-none cursor-grab active:cursor-grabbing ${className}`}
      style={{ perspective: "1200px" }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          transformStyle: "preserve-3d",
          transform: `translateZ(${-R}px) rotateY(${rotation}deg)`,
          transition:
            liveRotation !== null
              ? "none"
              : "transform 0.6s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {items.map((item, i) => {
          const isFront = i === frontIndex;
          const net = ((((i * step + rotation) % 360) + 540) % 360) - 180; // -180..180
          const opacity = Math.max(0.2, Math.cos((net * Math.PI) / 180) * 0.5 + 0.5);
          return (
            <div
              key={i}
              className={`absolute top-0 left-0 ${cardClass} will-change-transform`}
              style={{
                transform: `translate(-50%, -50%) rotateY(${i * step}deg) translateZ(${R}px)`,
                opacity,
                transition: liveRotation !== null ? "none" : "opacity 0.6s ease",
                zIndex: Math.round(Math.cos((net * Math.PI) / 180) * 100),
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (moved.current > 6) return; // fue arrastre, no click
                if (isFront) onSelectFront?.(item, i);
                else irA(i);
              }}
            >
              {renderCard(item, { isFront })}
            </div>
          );
        })}
      </div>

      {/* Flechas de navegación */}
      {n > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => i - 1)}
            className="absolute left-3 sm:left-8 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 text-white flex items-center justify-center transition-colors"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            onClick={() => setIndex((i) => i + 1)}
            className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 text-white flex items-center justify-center transition-colors"
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
