import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useSearchParams, type NavigateOptions } from "react-router-dom";
import { EmptyState, ErrorState } from "../components/StateViews";
import { useFetch } from "../hooks/useFetch";
import { getCrews, getWanted } from "../services/wanted.service";
import type { WantedSort, WantedSummary } from "../types/api";
import { FRUIT_LABELS, STATUS_LABELS, formatBerries } from "../utils/format";
import {
  FRUITS,
  PAGE_SIZES,
  SORTS,
  STATUSES,
  parseWantedQuery,
  pickOption,
  toApiParams,
  toSearchParams,
  type WantedQuery,
} from "../utils/wantedQuery";

const SORT_LABELS: Record<WantedSort, string> = {
  "bounty,desc": "Mayor recompensa",
  "name,asc": "Nombre (A-Z)",
  "updatedAt,desc": "Actualizados recientemente",
};

const STATUS_STYLES = {
  AT_LARGE: "bg-red-500/20 text-red-300",
  CAPTURED: "bg-emerald-500/20 text-emerald-300",
  MISSING: "bg-slate-500/30 text-slate-300",
} as const;

export default function Wanted() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // 1. La URL es la fuente de verdad: de ahí salen página, filtros, búsqueda, orden y tamaño.
  const query = parseWantedQuery(searchParams);
  const canonical = toSearchParams(query).toString();

  // 2. Si la URL traía valores inválidos, la reemplazamos por la versión limpia
  //    (replace: true para no ensuciar el historial).
  useEffect(() => {
    if (canonical !== searchParams.toString()) {
      setSearchParams(new URLSearchParams(canonical), { replace: true });
    }
  }, [canonical, searchParams, setSearchParams]);

  // 3. Cambiar algo = escribir en la URL. Si no se está cambiando la página
  //    (filtro, búsqueda, orden o tamaño), se vuelve a la página 1, que siempre existe.
  const updateQuery = useCallback(
    (patch: Partial<WantedQuery>, options?: NavigateOptions) => {
      setSearchParams((prev) => {
        const next = { ...parseWantedQuery(prev), ...patch };
        if (patch.page === undefined) next.page = 1;
        return toSearchParams(next);
      }, options);
    },
    [setSearchParams],
  );

  // 4. Búsqueda con debounce: el input tiene su propio estado y solo se escribe en la URL
  //    cuando el usuario deja de teclear 400 ms. Así no hay una request por cada tecla.
  const [text, setText] = useState(query.q);

  useEffect(() => {
    setText(query.q); // si la URL cambia (atrás/adelante), el input se sincroniza
  }, [query.q]);

  useEffect(() => {
    const value = text.trim();
    if (value === query.q) return;
    const timer = window.setTimeout(() => updateQuery({ q: value }), 400);
    return () => window.clearTimeout(timer); // si teclea de nuevo, se cancela el anterior
  }, [text, query.q, updateQuery]);

  // 5. Pedir los datos. Se vuelve a pedir cuando cambia cualquier parámetro.
  //    useFetch cancela la request anterior, así una respuesta vieja nunca pisa a la nueva.
  const apiParams = toApiParams(query);
  const wanted = useFetch((signal) => getWanted(apiParams, signal), [JSON.stringify(apiParams)]);
  const crews = useFetch((signal) => getCrews(signal), []);
  const data = wanted.data;

  // 6. Si la URL pide una página que no existe (?page=99 con solo 5), vamos a la última.
  useEffect(() => {
    if (wanted.loading || !data || data.page !== query.page - 1) return;
    const lastPage = Math.max(1, data.totalPages);
    if (query.page > lastPage) updateQuery({ page: lastPage }, { replace: true });
  }, [wanted.loading, data, query.page, updateQuery]);

  const totalPages = data?.totalPages ?? 0;
  const crewList = crews.data ?? [];
  const crewIsUnknown = query.crewId !== "" && !crewList.some((c) => c.id === query.crewId);

  const clearAll = () => {
    setText("");
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Tablón de la Guild</p>
        <h1 className="text-3xl font-bold">Se Busca</h1>
      </header>

      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <label className="field sm:col-span-2">
          <span>Buscar por nombre o epíteto</span>
          <input
            type="search"
            value={text}
            maxLength={100}
            placeholder="Ej: Ancla Roja"
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Estado</span>
          <select
            value={query.status}
            onChange={(e) => updateQuery({ status: pickOption(STATUSES, e.target.value) ?? "" })}
          >
            <option value="">Todos</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Tripulación</span>
          <select value={query.crewId} onChange={(e) => updateQuery({ crewId: e.target.value })}>
            <option value="">Todas</option>
            {crews.error && <option disabled>No se pudieron cargar</option>}
            {crewIsUnknown && <option value={query.crewId}>{query.crewId}</option>}
            {crewList.map((crew) => (
              <option key={crew.id} value={crew.id}>
                {crew.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Fruta del diablo</span>
          <select
            value={query.fruit}
            onChange={(e) => updateQuery({ fruit: pickOption(FRUITS, e.target.value) ?? "" })}
          >
            <option value="">Todas</option>
            {FRUITS.map((f) => (
              <option key={f} value={f}>
                {FRUIT_LABELS[f]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Ordenar por</span>
          <select
            value={query.sort}
            onChange={(e) => {
              const sort = pickOption(SORTS, e.target.value);
              if (sort) updateQuery({ sort });
            }}
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end justify-between gap-3 sm:col-span-2 lg:col-span-6">
          <label className="field">
            <span>Por página</span>
            <select
              value={query.size}
              onChange={(e) => {
                const size = PAGE_SIZES.find((s) => String(s) === e.target.value);
                if (size) updateQuery({ size });
              }}
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-ghost" onClick={clearAll}>
            Limpiar filtros
          </button>
        </div>
      </form>

      {/* Altura fija para el texto: no salta el layout mientras carga */}
      <p className="h-5 text-sm text-slate-400" aria-live="polite">
        {!wanted.loading && !wanted.error && data ? `${data.totalElements} carteles encontrados` : ""}
      </p>

      {/* min-h: loading, error y "sin resultados" ocupan el mismo espacio → el layout no se mueve */}
      <section className="min-h-[560px]" aria-busy={wanted.loading}>
        {wanted.loading ? (
          <SkeletonGrid />
        ) : wanted.error ? (
          <ErrorState error={wanted.error} onRetry={wanted.reload} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title="Sin resultados" hint="Prueba con otra búsqueda o quita algún filtro." />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.content.map((w) => (
              <li key={w.id}>
                <WantedCard wanted={w} search={location.search} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav aria-label="Paginación" className="flex flex-wrap items-center justify-center gap-2">
        <button
          className="btn-ghost"
          disabled={query.page <= 1}
          onClick={() => updateQuery({ page: 1 })}
          aria-label="Primera página"
        >
          «
        </button>
        <button
          className="btn-ghost"
          disabled={query.page <= 1}
          onClick={() => updateQuery({ page: query.page - 1 })}
        >
          Anterior
        </button>
        <span className="px-3 text-sm">
          Página {query.page} de {Math.max(1, totalPages)}
        </span>
        <button
          className="btn-ghost"
          disabled={query.page >= totalPages}
          onClick={() => updateQuery({ page: query.page + 1 })}
        >
          Siguiente
        </button>
        <button
          className="btn-ghost"
          disabled={query.page >= totalPages}
          onClick={() => updateQuery({ page: totalPages })}
          aria-label="Última página"
        >
          »
        </button>
      </nav>

      {/* Aquí se dibuja la ruta hija /wanted/:id (el detalle) encima del listado */}
      <Outlet />
    </div>
  );
}

function WantedCard({ wanted, search }: { wanted: WantedSummary; search: string }) {
  return (
    <Link
      // Conservamos la query (?page=2&status=...) para que el listado de fondo no cambie
      to={{ pathname: `/wanted/${encodeURIComponent(wanted.id)}`, search }}
      state={{ fromList: true }}
      className="card flex h-full flex-col gap-2 border-amber-200/10 bg-amber-950/20 p-4 transition hover:border-amber-400/60"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">Wanted</p>
        <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[wanted.status]}`}>
          {STATUS_LABELS[wanted.status]}
        </span>
      </div>
      <h2 className="text-lg font-bold leading-tight">{wanted.name}</h2>
      <p className="text-sm italic text-slate-400">“{wanted.epithet}”</p>
      <p className="font-mono text-xl font-bold text-amber-300">{formatBerries(wanted.bounty)}</p>
      <p className="text-sm text-slate-300">🏴‍☠️ {wanted.crew.name}</p>
      <p className="text-sm text-slate-400">
        🍎 {wanted.devilFruit ? wanted.devilFruit.name : FRUIT_LABELS.NONE}
      </p>
      <div className="mt-auto flex items-center justify-between text-xs text-slate-400">
        <span>📍 {wanted.lastSeenIsland}</span>
        <span aria-label={`Amenaza ${wanted.threatLevel} de 5`}>
          {"☠".repeat(wanted.threatLevel)}
        </span>
      </div>
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Cargando">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="card h-56 motion-safe:animate-pulse bg-white/5" />
      ))}
    </ul>
  );
}
