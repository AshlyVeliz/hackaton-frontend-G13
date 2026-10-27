import { useLocation, useNavigate, useParams } from "react-router-dom";
import Modal from "../components/Modal";
import { EmptyState, ErrorState, LoadingBlock } from "../components/StateViews";
import { useFetch } from "../hooks/useFetch";
import { getWantedById } from "../services/wanted.service";
import type { WantedDetail as WantedDetailData } from "../types/api";
import { FRUIT_LABELS, STATUS_LABELS, formatBerries, formatDate } from "../utils/format";

const ROLE_LABELS: Record<string, string> = {
  CAPTAIN: "Capitán",
  FIRST_MATE: "Segundo al mando",
  NAVIGATOR: "Navegante",
  SNIPER: "Francotirador",
  COOK: "Cocinero",
  DOCTOR: "Médico",
  SHIPWRIGHT: "Carpintero",
  MUSICIAN: "Músico",
  ARCHAEOLOGIST: "Arqueólogo",
  HELMSMAN: "Timonel",
  FIGHTER: "Combatiente",
};

// location.state es `unknown`: lo validamos antes de leerlo.
function cameFromList(state: unknown) {
  return typeof state === "object" && state !== null && "fromList" in state;
}

export default function WantedDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const detail = useFetch((signal) => getWantedById(id, signal), [id]);

  const close = () => {
    if (cameFromList(location.state)) {
      navigate(-1); // volvemos a la URL exacta del listado (misma página y filtros)
    } else {
      // Entró directo por URL: no hay "atrás" en la app, vamos al listado.
      navigate({ pathname: "/wanted", search: location.search }, { replace: true });
    }
  };

  return (
    <Modal title={detail.data ? detail.data.name : "Detalle del cartel"} onClose={close}>
      {detail.loading ? (
        <LoadingBlock label="Buscando el cartel…" />
      ) : detail.error?.status === 404 ? (
        <EmptyState title="Cartel no encontrado" hint="Puede que ya no exista en tu workspace." />
      ) : detail.error ? (
        <ErrorState error={detail.error} onRetry={detail.reload} />
      ) : (
        detail.data && <DetailView wanted={detail.data} />
      )}
    </Modal>
  );
}

function DetailView({ wanted }: { wanted: WantedDetailData }) {
  const maxBounty = Math.max(...wanted.bountyHistory.map((h) => h.amount), 1);

  return (
    <article className="flex flex-col gap-5">
      <header className="pr-10">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
          Wanted · {STATUS_LABELS[wanted.status]}
        </p>
        <h2 className="text-3xl font-bold">{wanted.name}</h2>
        <p className="italic text-slate-400">“{wanted.epithet}”</p>
        <p className="mt-2 font-mono text-2xl font-bold text-amber-300">
          {formatBerries(wanted.bounty)}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Info label="Tripulación" value={wanted.crew.name} />
        <Info label="Puesto" value={ROLE_LABELS[wanted.role] ?? wanted.role} />
        <Info
          label="Fruta del diablo"
          value={
            wanted.devilFruit
              ? `${wanted.devilFruit.name} (${FRUIT_LABELS[wanted.devilFruit.type]})`
              : FRUIT_LABELS.NONE
          }
        />
        <Info label="Edad" value={`${wanted.age} años`} />
        <Info label="Altura" value={`${wanted.heightCm} cm`} />
        <Info label="Amenaza" value={`${"☠".repeat(wanted.threatLevel)} (${wanted.threatLevel}/5)`} />
        <Info
          label="Visto por última vez"
          value={`${wanted.lastSeen.island} · ${formatDate(wanted.lastSeen.seenAt)}`}
        />
      </dl>

      <p className="leading-relaxed text-slate-300">{wanted.bio}</p>

      <section>
        <h3 className="mb-2 font-semibold">Historial de recompensas</h3>
        <ol className="flex flex-col gap-2">
          {wanted.bountyHistory.map((h) => (
            <li key={h.issuedAt} className="text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">{formatDate(h.issuedAt)}</span>
                <span className="font-mono">{formatBerries(h.amount)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-amber-400"
                  style={{ width: `${(h.amount / maxBounty) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <dt className="text-xs uppercase tracking-widest text-slate-400">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
