import { useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { toApiError, type ApiError } from "../api/errors";
import Modal from "../components/Modal";
import { EmptyState, ErrorState, LoadingBlock } from "../components/StateViews";
import { useFetch } from "../hooks/useFetch";
import { getNewsById, updateNewsStatus } from "../services/news.service";
import type { NewsDetail as NewsDetailData, NewsVerdict } from "../types/api";
import { formatDate } from "../utils/format";
import { NEWS_PRIORITY_LABELS, NEWS_STATUS_LABELS, NEWS_TYPE_LABELS } from "../utils/newsFilters";
import { NEWS_STATUS_STYLES, type NewsOutletContext } from "./News";

// Estado de la verificación: un solo estado en vez de varios booleanos.
type VerifyState =
  | { kind: "idle" }
  | { kind: "sending"; target: NewsVerdict }
  | { kind: "success"; result: NewsVerdict }
  | { kind: "conflict" } // otro la verificó antes (409)
  | { kind: "error"; target: NewsVerdict; error: ApiError };

function cameFromList(state: unknown) {
  return typeof state === "object" && state !== null && "fromList" in state;
}

// `current` del 409 llega como unknown: comprobamos que sea una noticia antes de usarla.
function isNewsDetail(value: unknown): value is NewsDetailData {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "status" in value &&
    "body" in value &&
    typeof value.id === "string" &&
    typeof value.status === "string" &&
    Array.isArray(value.body)
  );
}

export default function NewsDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { onNewsUpdated } = useOutletContext<NewsOutletContext>();
  const detail = useFetch((signal) => getNewsById(id, signal), [id]);

  // Versión de la noticia que devolvió el PATCH (más nueva que la del GET)
  const [updated, setUpdated] = useState<NewsDetailData | null>(null);
  const [verify, setVerify] = useState<VerifyState>({ kind: "idle" });
  const news = updated ?? detail.data;

  const close = () => {
    if (cameFromList(location.state)) navigate(-1);
    else navigate({ pathname: "/news", search: location.search }, { replace: true });
  };

  const sendVerdict = async (target: NewsVerdict) => {
    if (verify.kind === "sending") return; // nunca dos requests a la vez
    setVerify({ kind: "sending", target });
    try {
      const result = await updateNewsStatus(id, target);
      setUpdated(result);
      onNewsUpdated(result); // el feed refleja el nuevo estado al volver
      setVerify({ kind: "success", result: target });
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError.code === "NEWS_ALREADY_VERIFIED" && isNewsDetail(apiError.current)) {
        // Ya no era RUMOR: mostramos el estado real que mandó el servidor.
        setUpdated(apiError.current);
        onNewsUpdated(apiError.current);
        setVerify({ kind: "conflict" });
      } else {
        // Falla: NO tocamos la noticia (conserva su estado anterior) y se puede reintentar.
        setVerify({ kind: "error", target, error: apiError });
      }
    }
  };

  return (
    <Modal title={news ? news.title : "Detalle de la noticia"} onClose={close}>
      {detail.loading && !news ? (
        <LoadingBlock label="Abriendo el periódico…" />
      ) : detail.error?.status === 404 ? (
        <EmptyState title="Noticia no encontrada" hint="Puede que ya no exista en tu workspace." />
      ) : detail.error ? (
        <ErrorState error={detail.error} onRetry={detail.reload} />
      ) : (
        news && (
          <article className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 pr-10 text-xs">
              <span className="rounded-full bg-white/10 px-2 py-0.5">
                {NEWS_TYPE_LABELS[news.type]}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5">
                Prioridad {NEWS_PRIORITY_LABELS[news.priority].toLowerCase()}
              </span>
              <span className={`rounded-full px-2 py-0.5 ${NEWS_STATUS_STYLES[news.status]}`}>
                {NEWS_STATUS_LABELS[news.status]}
              </span>
            </div>
            <h2 className="text-2xl font-bold leading-tight">{news.title}</h2>
            <p className="text-xs text-slate-500">
              {news.source} · 📍 {news.island} · {formatDate(news.publishedAt)}
              {news.verifiedAt && ` · Verificada ${formatDate(news.verifiedAt)}`}
            </p>
            <p className="font-medium text-slate-200">{news.summary}</p>
            {news.body.map((paragraph, i) => (
              <p key={i} className="leading-relaxed text-slate-300">
                {paragraph}
              </p>
            ))}
            {news.relatedWanted && (
              <p className="text-sm">
                Cartel relacionado:{" "}
                <Link className="link" to={`/wanted/${encodeURIComponent(news.relatedWanted.id)}`}>
                  {news.relatedWanted.name}
                </Link>
              </p>
            )}

            <VerifyPanel status={news.status} verify={verify} onVerdict={sendVerdict} />
          </article>
        )
      )}
    </Modal>
  );
}

function VerifyPanel({
  status,
  verify,
  onVerdict,
}: {
  status: NewsDetailData["status"];
  verify: VerifyState;
  onVerdict: (target: NewsVerdict) => void;
}) {
  const sending = verify.kind === "sending";

  return (
    <section className="mt-2 rounded-xl border border-white/10 bg-white/5 p-4" aria-live="polite">
      {status === "RUMOR" ? (
        <>
          <p className="mb-3 text-sm font-semibold">¿Verificar este rumor?</p>
          <div className="flex flex-wrap gap-3">
            <button
              className="btn-primary"
              disabled={sending}
              onClick={() => onVerdict("CONFIRMED")}
            >
              {verify.kind === "sending" && verify.target === "CONFIRMED"
                ? "Confirmando…"
                : "✅ Confirmar"}
            </button>
            <button className="btn-ghost" disabled={sending} onClick={() => onVerdict("DEBUNKED")}>
              {verify.kind === "sending" && verify.target === "DEBUNKED"
                ? "Desmintiendo…"
                : "❌ Desmentir"}
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-300">
          Esta noticia ya está {NEWS_STATUS_LABELS[status].toLowerCase()}.
        </p>
      )}

      {verify.kind === "success" && (
        <p className="mt-3 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300" role="status">
          Listo: la noticia quedó {NEWS_STATUS_LABELS[verify.result].toLowerCase()}.
        </p>
      )}
      {verify.kind === "conflict" && (
        <p className="mt-3 rounded-lg bg-amber-500/15 px-3 py-2 text-sm text-amber-200" role="status">
          Alguien la verificó antes que tú. Te mostramos su estado actual.
        </p>
      )}
      {verify.kind === "error" && (
        <div className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300" role="alert">
          <p>
            No se pudo marcar como {NEWS_STATUS_LABELS[verify.target].toLowerCase()}:{" "}
            {verify.error.message} La noticia sigue como rumor.
          </p>
          <button className="btn-ghost mt-2" onClick={() => onVerdict(verify.target)}>
            Reintentar
          </button>
        </div>
      )}
    </section>
  );
}
