import { useEffect, useState } from "react";

// ¿El navegador soporta CSS Scroll-driven Animations?
const supportsScrollTimeline =
  typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()");

// Barra fija arriba que muestra cuánto se ha leído de la página.
// - Con soporte: la anima solo CSS (clase .scroll-progress en index.css).
// - Sin soporte: comportamiento equivalente con un listener de scroll.
export default function ScrollProgress({ color, hidden }: { color: string; hidden: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (supportsScrollTimeline || hidden) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update); // máximo una actualización por frame
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [hidden]);

  // Con prefers-reduced-motion no se muestra: el progreso por etapas ya informa lo mismo.
  if (hidden) return null;

  return (
    <div
      aria-hidden
      className={`fixed left-0 top-0 z-50 h-1 w-full origin-left ${supportsScrollTimeline ? "scroll-progress" : ""}`}
      style={{
        backgroundColor: color,
        transform: supportsScrollTimeline ? undefined : `scaleX(${progress})`,
      }}
    />
  );
}
