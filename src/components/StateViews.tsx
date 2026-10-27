import type { ApiError } from "../api/errors";

export function LoadingBlock({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-10 text-slate-300" role="status">
      <span className="text-2xl motion-safe:animate-bounce" aria-hidden>
        ⚓
      </span>
      {label}
    </div>
  );
}

// La cola de inspección vive en el mismo servidor que la API (sin /api/v1).
const INSPECTION_URL = `${new URL(import.meta.env.VITE_API_BASE_URL).origin}/reverse-mountain`;

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  // 423: el Grand Line sigue bloqueado hasta aprobar el CP3. El bloqueo lo aplica el servidor.
  if (error.code === "LOG_POSE_REQUIRED") {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center" role="alert">
        <span className="text-4xl" aria-hidden>
          🔒
        </span>
        <p className="font-semibold">El Grand Line está bloqueado</p>
        <p className="text-sm text-slate-400">{error.message}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <a className="btn-primary" href={INSPECTION_URL} target="_blank" rel="noreferrer">
            Ir a Reverse Mountain
          </a>
          <button className="btn-ghost" onClick={onRetry}>
            Ya tenemos Log Pose, reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex flex-col items-center gap-3 p-8 text-center" role="alert">
      <span className="text-3xl" aria-hidden>
        🌊
      </span>
      <p className="font-semibold">Hubo una tormenta al pedir los datos</p>
      <p className="text-sm text-slate-400">{error.message}</p>
      <button className="btn-primary" onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-8 text-center">
      <span className="text-3xl" aria-hidden>
        🏝️
      </span>
      <p className="font-semibold">{title}</p>
      {hint && <p className="text-sm text-slate-400">{hint}</p>}
    </div>
  );
}
