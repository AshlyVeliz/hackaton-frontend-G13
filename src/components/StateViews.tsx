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

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
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
