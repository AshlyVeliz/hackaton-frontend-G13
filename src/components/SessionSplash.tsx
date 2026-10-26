import { useAuth } from "../context/AuthContext";

// Pantalla que se ve mientras se restaura la sesión (o si el servidor no respondió).
export default function SessionSplash() {
  const { status, checkError, retryCheck, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-5xl motion-safe:animate-spin [animation-duration:3s]" aria-hidden>
        🧭
      </div>
      {status === "error" ? (
        <>
          <p className="text-lg font-semibold">No pudimos verificar tu sesión</p>
          <p className="text-sm text-slate-400">{checkError?.message}</p>
          <div className="flex gap-3">
            <button className="btn-primary" onClick={retryCheck}>
              Reintentar
            </button>
            <button className="btn-ghost" onClick={logout}>
              Ir al login
            </button>
          </div>
        </>
      ) : (
        <p className="text-slate-300" role="status">
          Verificando el Log Pose de tu tripulación…
        </p>
      )}
    </div>
  );
}
