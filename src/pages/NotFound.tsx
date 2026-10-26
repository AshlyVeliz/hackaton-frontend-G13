import { Link, useLocation } from "react-router-dom";

// Se renderiza con path="*": cualquier ruta que no coincide con ninguna otra.
export default function NotFound() {
  const location = useLocation();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="relative h-32 w-32" aria-hidden>
        <span className="absolute inset-0 flex items-center justify-center text-7xl motion-safe:animate-[drift_4s_ease-in-out_infinite]">
          ⛵
        </span>
        <span className="absolute -bottom-2 left-0 right-0 text-3xl">🌊🌊🌊</span>
      </div>
      <p className="font-mono text-6xl font-black text-amber-300">404</p>
      <h1 className="text-2xl font-bold">Te perdiste en el Calm Belt</h1>
      <p className="max-w-md text-slate-400">
        Ni el Log Pose encuentra la isla <code className="text-amber-200">{location.pathname}</code>.
        Sin viento y rodeado de Reyes Marinos, mejor vuelve a aguas conocidas.
      </p>
      <Link to="/dashboard" className="btn-primary">
        Volver al puerto
      </Link>
    </main>
  );
}
