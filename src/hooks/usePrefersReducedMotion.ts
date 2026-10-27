import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

// true si el usuario pidió en su sistema operativo "reducir movimiento".
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const handleChange = () => setReduced(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return reduced;
}
