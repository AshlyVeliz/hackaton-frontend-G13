import { EmptyState, ErrorState, LoadingBlock } from "../components/StateViews";
import { useFetch } from "../hooks/useFetch";
import { getDashboardSummary, getLogPose } from "../services/dashboard.service";
import type { DashboardSummary, LogPose } from "../types/api";
import { FRUIT_LABELS, STATUS_LABELS, formatBerries, formatDate } from "../utils/format";

export default function Dashboard() {
  // Dos requests independientes: si una falla, la otra igual se muestra.
  const summary = useFetch((signal) => getDashboardSummary(signal), []);
  const logPose = useFetch((signal) => getLogPose(signal), []);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Puente de mando</p>
        <h1 className="text-3xl font-bold">
          {summary.data ? summary.data.team.name : "Tu tripulación"}
        </h1>
        {summary.data && <p className="text-sm text-slate-400">{summary.data.team.code}</p>}
      </header>

      <section aria-label="Estado del Log Pose">
        {logPose.loading ? (
          <LoadingBlock label="Leyendo el Log Pose…" />
        ) : logPose.error ? (
          <ErrorState error={logPose.error} onRetry={logPose.reload} />
        ) : (
          logPose.data && <LogPoseCard logPose={logPose.data} />
        )}
      </section>

      <section aria-label="Indicadores de la tripulación">
        {summary.loading ? (
          <LoadingBlock label="Contando recompensas…" />
        ) : summary.error ? (
          <ErrorState error={summary.error} onRetry={summary.reload} />
        ) : summary.data && summary.data.wanted.total === 0 ? (
          <EmptyState
            title="Aún no hay carteles en tu workspace"
            hint="Cuando la Guild publique carteles, aquí verás tus indicadores."
          />
        ) : (
          summary.data && <SummaryView summary={summary.data} />
        )}
      </section>
    </div>
  );
}

function LogPoseCard({ logPose }: { logPose: LogPose }) {
  const unlocked = logPose.grandLineUnlocked;
  return (
    <div
      className={`card flex flex-wrap items-center gap-4 p-5 ${unlocked ? "border-emerald-400/50" : "border-amber-400/40"}`}
    >
      <span className="text-4xl" aria-hidden>
        {unlocked ? "🧭" : "🔒"}
      </span>
      <div className="flex-1">
        <p className="font-semibold">
          Log Pose: {unlocked ? "Grand Line desbloqueado" : "Bloqueado"}
        </p>
        <p className="text-sm text-slate-400">{logPose.message}</p>
        {logPose.unlockedAt && (
          <p className="text-xs text-slate-500">Desde {formatDate(logPose.unlockedAt)}</p>
        )}
      </div>
    </div>
  );
}

function SummaryView({ summary }: { summary: DashboardSummary }) {
  const { wanted, crews, topBounties } = summary;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Carteles activos" value={String(wanted.total)} icon="📜" />
        <Stat label="Recompensa total" value={formatBerries(wanted.totalBounty)} icon="💰" />
        <Stat label="Recompensa promedio" value={formatBerries(wanted.averageBounty)} icon="⚖️" />
        <Stat label="Tripulaciones piratas" value={String(crews.total)} icon="🏴‍☠️" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown
          title="Por estado"
          rows={Object.entries(wanted.byStatus).map(([key, count]) => ({
            label: STATUS_LABELS[key as keyof typeof STATUS_LABELS],
            count,
          }))}
          total={wanted.total}
        />
        <Breakdown
          title="Por fruta del diablo"
          rows={Object.entries(wanted.byFruit).map(([key, count]) => ({
            label: FRUIT_LABELS[key as keyof typeof FRUIT_LABELS],
            count,
          }))}
          total={wanted.total}
        />
      </div>

      {crews.mostWanted && (
        <div className="card flex items-center gap-4 p-5">
          <span
            className="h-10 w-10 shrink-0 rounded-full border-2 border-white/30"
            style={{ backgroundColor: crews.mostWanted.jollyRogerColor }}
            aria-hidden
          />
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Tripulación más buscada</p>
            <p className="font-semibold">
              {crews.mostWanted.name} · {crews.mostWanted.shipName}
            </p>
            <p className="text-sm text-amber-300">
              {formatBerries(crews.mostWanted.totalBounty)} · {crews.mostWanted.memberCount} carteles
            </p>
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="mb-3 font-semibold">Top recompensas</h2>
        <ol className="flex flex-col gap-2">
          {/* key = id único del cartel: React lo usa para saber qué elemento cambió */}
          {topBounties.map((w, i) => (
            <li key={w.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2">
              <span>
                <span className="mr-2 text-slate-500">#{i + 1}</span>
                {w.name} <span className="text-slate-400">“{w.epithet}”</span>
              </span>
              <span className="font-mono text-amber-300">{formatBerries(w.bounty)}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="text-xs text-slate-500">Actualizado: {formatDate(summary.generatedAt)}</p>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="card p-5">
      <p className="text-2xl" aria-hidden>
        {icon}
      </p>
      <p className="mt-2 text-xs uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { label: string; count: number }[];
  total: number;
}) {
  return (
    <div className="card p-5">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex justify-between text-sm">
              <span>{row.label}</span>
              <span className="text-slate-400">{row.count}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-amber-400"
                style={{ width: `${total > 0 ? (row.count / total) * 100 : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
