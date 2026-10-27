import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingBlock } from "../components/StateViews";
import { useFetch } from "../hooks/useFetch";
import { getSagas } from "../services/sagas.service";
import type { SagaSummary } from "../types/api";
import { formatNumber } from "../utils/format";

export default function Sagas() {
  const sagas = useFetch((signal) => getSagas(signal), []);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Poneglyph</p>
        <h1 className="text-3xl font-bold">La Gran Saga</h1>
        <p className="text-slate-400">Elige una saga para recorrer su historia por el Grand Line.</p>
      </header>

      {sagas.loading ? (
        <LoadingBlock label="Leyendo los Poneglyphs…" />
      ) : sagas.error ? (
        <ErrorState error={sagas.error} onRetry={sagas.reload} />
      ) : sagas.data && sagas.data.length === 0 ? (
        <EmptyState title="Aún no hay sagas" />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {[...(sagas.data ?? [])]
            .sort((a, b) => a.order - b.order)
            .map((saga) => (
              <li key={saga.id}>
                <SagaCard saga={saga} />
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function SagaCard({ saga }: { saga: SagaSummary }) {
  const { palette } = saga;
  return (
    <Link
      to={`/sagas/${encodeURIComponent(saga.id)}`}
      // viewTransition: React Router usa la View Transition API si el navegador la soporta;
      // si no, navega normal.
      viewTransition
      // Mandamos el resumen para mostrar el título mientras carga la historia.
      state={{ saga: { id: saga.id, title: saga.title } }}
      className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 p-6 shadow-lg transition hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, ${palette.background}, ${palette.surface})`,
        color: palette.text,
      }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: palette.primary }}>
        Saga {saga.order}
      </p>
      {/* Mismo view-transition-name que el título de la historia: el título "viaja" entre páginas */}
      <h2 className="text-2xl font-bold" style={{ viewTransitionName: `saga-${saga.id}` }}>
        {saga.title}
      </h2>
      <p className="italic opacity-80">{saga.subtitle}</p>
      <p className="text-sm opacity-90">{saga.synopsis}</p>
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: palette.accent }}>
        <span>🗺️ {saga.stageCount} etapas</span>
        <span>⛵ {formatNumber(saga.totalDistanceNm)} mn</span>
        <span>
          {saga.firstIsland} → {saga.lastIsland}
        </span>
      </div>
    </Link>
  );
}
