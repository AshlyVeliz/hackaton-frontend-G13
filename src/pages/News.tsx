import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { toApiError, type ApiError } from "../api/errors";
import { EmptyState, ErrorState } from "../components/StateViews";
import { getNewsFeed } from "../services/news.service";
import type { NewsDetail, NewsItem, NewsPriority } from "../types/api";
import { formatDate } from "../utils/format";
import {
  NEWS_PRIORITIES,
  NEWS_PRIORITY_LABELS,
  NEWS_STATUSES,
  NEWS_STATUS_LABELS,
  NEWS_TYPES,
  NEWS_TYPE_LABELS,
  parseNewsFilters,
  toNewsSearchParams,
  type NewsFilters,
} from "../utils/newsFilters";
import { pickOption } from "../utils/wantedQuery";

const PAGE_LIMIT = 20;

// Lo que el feed le pasa al detalle (ruta hija) para que le avise cuando verifica una noticia.
export type NewsOutletContext = {
  onNewsUpdated: (news: NewsDetail) => void;
};

const PRIORITY_STYLES: Record<NewsPriority, string> = {
  LOW: "bg-slate-500/25 text-slate-300",
  MEDIUM: "bg-sky-500/20 text-sky-300",
  HIGH: "bg-orange-500/20 text-orange-300",
  CRITICAL: "bg-red-500/25 text-red-300",
};

export const NEWS_STATUS_STYLES = {
  RUMOR: "bg-amber-500/20 text-amber-300",
  CONFIRMED: "bg-emerald-500/20 text-emerald-300",
  DEBUNKED: "bg-slate-500/30 text-slate-300 line-through",
} as const;

export default function News() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Los filtros viven en la URL (igual que en /wanted).
  const filters = parseNewsFilters(searchParams);
  const filtersKey = toNewsSearchParams(filters).toString();

  // Si la URL trae filtros inválidos, la reemplazamos por la versión limpia.
  useEffect(() => {
    if (filtersKey !== searchParams.toString()) {
      setSearchParams(new URLSearchParams(filtersKey), { replace: true });
    }
  }, [filtersKey, searchParams, setSearchParams]);

  // Estado que se DIBUJA
  const [items, setItems] = useState<NewsItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [loadCount, setLoadCount] = useState(0); // sube en cada carga terminada
  const [restartKey, setRestartKey] = useState(0);

  // Refs: valores que se leen al instante y NO necesitan re-render
  // (un setState no se aplica inmediatamente; un ref sí).
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const seenIds = useRef(new Set<string>()); // Regla de Nami: nada se cuenta dos veces
  const inFlight = useRef<AbortController | null>(null); // la carga que está en camino
  const filtersRef = useRef<NewsFilters>(filters);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    // Una sola carga en vuelo: si ya hay una, o no hay más, no hacemos nada.
    if (inFlight.current || !hasMoreRef.current) return;

    const controller = new AbortController();
    inFlight.current = controller;
    setLoading(true);
    setError(null);

    try {
      const { type, priority, status } = filtersRef.current;
      const page = await getNewsFeed(
        {
          cursor: cursorRef.current ?? undefined,
          limit: PAGE_LIMIT,
          type: type || undefined,
          priority: priority || undefined,
          status: status || undefined,
        },
        controller.signal,
      );
      // Si mientras esperábamos cambiaron los filtros, esta respuesta ya no sirve.
      if (controller.signal.aborted) return;

      const fresh = page.items.filter((news) => !seenIds.current.has(news.id));
      fresh.forEach((news) => seenIds.current.add(news.id));

      cursorRef.current = page.nextCursor;
      hasMoreRef.current = page.hasMore && page.nextCursor !== null;
      setItems((prev) => [...prev, ...fresh]); // SUMAR a lo que ya había, no reemplazar
      setHasMore(hasMoreRef.current);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(toApiError(err)); // las noticias ya cargadas NO se borran
    } finally {
      if (inFlight.current === controller) {
        inFlight.current = null;
        setLoading(false);
        setLoadCount((n) => n + 1);
      }
    }
  }, []);

  // Cada vez que cambian los filtros: cancelar lo que estaba en vuelo, vaciar y empezar de cero.
  // Así nunca se mezclan noticias de filtros distintos.
  useEffect(() => {
    filtersRef.current = parseNewsFilters(new URLSearchParams(filtersKey));
    inFlight.current?.abort();
    inFlight.current = null;
    cursorRef.current = null;
    hasMoreRef.current = true;
    seenIds.current = new Set();
    setItems([]);
    setHasMore(true);
    setError(null);
    setLoading(false);
    void loadMore();

    return () => {
      inFlight.current?.abort();
      inFlight.current = null;
    };
  }, [filtersKey, restartKey, loadMore]);

  // Infinite scroll: IntersectionObserver (API nativa del navegador) vigila un div invisible
  // al final de la lista. Cuando entra en pantalla, se pide la siguiente carga.
  // Se vuelve a crear tras cada carga: si el div sigue visible (pocas noticias), pide otra.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || error) return; // con error se espera al botón "Reintentar"

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "300px 0px" }, // empieza a cargar un poco antes de llegar al final
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, error, loadCount, loadMore]);

  const retry = () => {
    // Si el cursor ya no es válido, hay que pedir el feed desde el inicio (sin cursor).
    if (error?.code === "INVALID_CURSOR" || error?.code === "CURSOR_FILTER_MISMATCH") {
      setRestartKey((n) => n + 1);
    } else {
      void loadMore();
    }
  };

  // El detalle avisa cuando verifica una noticia: actualizamos esa noticia en el feed.
  const onNewsUpdated = useCallback((news: NewsDetail) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.id !== news.id) return [item];
        const updated: NewsItem = {
          ...item,
          status: news.status,
          verifiedAt: news.verifiedAt,
          updatedAt: news.updatedAt,
        };
        // Si filtramos por estado y ya no coincide, sale del feed: lo que se ve
        // siempre corresponde a lo que pidió el usuario.
        const statusFilter = filtersRef.current.status;
        return statusFilter && updated.status !== statusFilter ? [] : [updated];
      }),
    );
  }, []);

  const updateFilter = (patch: Partial<NewsFilters>) => {
    setSearchParams((prev) => toNewsSearchParams({ ...parseNewsFilters(prev), ...patch }));
  };

  const outletContext: NewsOutletContext = { onNewsUpdated };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300">News Coo</p>
        <h1 className="text-3xl font-bold">Noticias del mundo</h1>
      </header>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="card grid gap-4 p-4 sm:grid-cols-3"
        aria-label="Filtros de noticias"
      >
        <label className="field">
          <span>Tipo</span>
          <select
            value={filters.type}
            onChange={(e) => updateFilter({ type: pickOption(NEWS_TYPES, e.target.value) ?? "" })}
          >
            <option value="">Todos</option>
            {NEWS_TYPES.map((t) => (
              <option key={t} value={t}>
                {NEWS_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Prioridad</span>
          <select
            value={filters.priority}
            onChange={(e) =>
              updateFilter({ priority: pickOption(NEWS_PRIORITIES, e.target.value) ?? "" })
            }
          >
            <option value="">Todas</option>
            {NEWS_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {NEWS_PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Estado</span>
          <select
            value={filters.status}
            onChange={(e) =>
              updateFilter({ status: pickOption(NEWS_STATUSES, e.target.value) ?? "" })
            }
          >
            <option value="">Todos</option>
            {NEWS_STATUSES.map((s) => (
              <option key={s} value={s}>
                {NEWS_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </form>

      <ul className="flex flex-col gap-3">
        {items.map((news) => (
          <li key={news.id}>
            <NewsCard news={news} search={location.search} />
          </li>
        ))}
      </ul>

      {/* Estado al final de la lista */}
      <div aria-live="polite">
        {loading && (
          <p className="p-6 text-center text-slate-300" role="status">
            <span className="mr-2 inline-block motion-safe:animate-bounce" aria-hidden>
              🐦
            </span>
            Llegan más noticias…
          </p>
        )}
        {error && <ErrorState error={error} onRetry={retry} />}
        {!loading && !error && !hasMore && items.length === 0 && (
          <EmptyState title="Sin noticias" hint="No hay noticias con estos filtros." />
        )}
        {!loading && !error && !hasMore && items.length > 0 && (
          <p className="p-6 text-center text-sm text-slate-400">
            🏁 No hay más noticias. Llegaste al final del feed.
          </p>
        )}
      </div>

      {/* Div invisible que observa el IntersectionObserver */}
      <div ref={sentinelRef} aria-hidden className="h-px" />

      {/* Detalle /news/:id encima del feed: el feed no se desmonta y conserva su posición */}
      <Outlet context={outletContext} />
    </div>
  );
}

function NewsCard({ news, search }: { news: NewsItem; search: string }) {
  return (
    <Link
      to={{ pathname: `/news/${encodeURIComponent(news.id)}`, search }}
      state={{ fromList: true }}
      className="card flex flex-col gap-2 p-4 transition hover:border-amber-400/60"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-white/10 px-2 py-0.5">{NEWS_TYPE_LABELS[news.type]}</span>
        <span className={`rounded-full px-2 py-0.5 ${PRIORITY_STYLES[news.priority]}`}>
          Prioridad {NEWS_PRIORITY_LABELS[news.priority].toLowerCase()}
        </span>
        <span className={`rounded-full px-2 py-0.5 ${NEWS_STATUS_STYLES[news.status]}`}>
          {NEWS_STATUS_LABELS[news.status]}
        </span>
      </div>
      <h2 className="text-lg font-semibold leading-snug">{news.title}</h2>
      <p className="text-sm text-slate-300">{news.summary}</p>
      <p className="text-xs text-slate-500">
        {news.source} · 📍 {news.island} · {formatDate(news.publishedAt)}
      </p>
    </Link>
  );
}
