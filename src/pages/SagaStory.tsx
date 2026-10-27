import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import ScrollProgress from "../components/ScrollProgress";
import { EmptyState, ErrorState, LoadingBlock } from "../components/StateViews";
import StoryMap from "../components/StoryMap";
import { useFetch } from "../hooks/useFetch";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { getSagaStory } from "../services/sagas.service";
import type { SagaStory as SagaStoryData } from "../types/api";
import { formatNumber } from "../utils/format";

// Franja horizontal (a ~66% de la altura de la pantalla) que decide cuál etapa está activa:
// la etapa que cruza esa línea es la activa. Más abajo del centro para que en mobile
// no quede tapada por el mapa fijo de arriba.
const ACTIVE_BAND = "-66% 0px -33% 0px";

// location.state es unknown: lo validamos antes de leer el título que mandó /sagas.
function getPreview(state: unknown): { id: string; title: string } | null {
  if (typeof state !== "object" || state === null || !("saga" in state)) return null;
  const saga = state.saga;
  if (
    typeof saga === "object" &&
    saga !== null &&
    "id" in saga &&
    "title" in saga &&
    typeof saga.id === "string" &&
    typeof saga.title === "string"
  ) {
    return { id: saga.id, title: saga.title };
  }
  return null;
}

export default function SagaStory() {
  const { id = "" } = useParams();
  const location = useLocation();
  const preview = getPreview(location.state);
  const story = useFetch((signal) => getSagaStory(id, signal), [id]);

  if (story.data) return <StoryView key={story.data.saga.id} story={story.data} />;

  return (
    <div className="flex flex-col gap-6">
      <Link to="/sagas" viewTransition className="link w-fit">
        ← Sagas
      </Link>
      {preview && (
        <h1 className="text-4xl font-bold" style={{ viewTransitionName: `saga-${preview.id}` }}>
          {preview.title}
        </h1>
      )}
      {story.loading ? (
        <LoadingBlock label="Descifrando el Poneglyph…" />
      ) : story.error?.status === 404 ? (
        <EmptyState title="Saga no encontrada" hint="Vuelve al resumen y elige otra saga." />
      ) : (
        story.error && <ErrorState error={story.error} onRetry={story.reload} />
      )}
    </div>
  );
}

function StoryView({ story }: { story: SagaStoryData }) {
  const { saga, map, stages } = story;
  const [searchParams, setSearchParams] = useSearchParams();
  const reducedMotion = usePrefersReducedMotion();
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // La URL indica la etapa activa (?stage=slug). Al abrir esa URL se empieza en esa etapa.
  const [initial] = useState(() => {
    const index = stages.findIndex((s) => s.slug === searchParams.get("stage"));
    return { index: Math.max(0, index), fromUrl: index >= 0 };
  });
  const [active, setActive] = useState(initial.index);
  const activeRef = useRef(active);
  // Mientras hacemos scroll por código (teclado/botones), ignoramos las etapas intermedias.
  const scrollTargetRef = useRef<number | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // 1. Abrir una URL con ?stage=... lleva directo a esa etapa (antes de pintar la pantalla).
  useLayoutEffect(() => {
    if (initial.fromUrl) {
      sectionRefs.current[initial.index]?.scrollIntoView({ block: "start" });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [initial]);

  // 2. Narrativa activada por scroll: un IntersectionObserver mira qué etapa cruza la franja.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute("data-index"));
          if (scrollTargetRef.current !== null) {
            if (index !== scrollTargetRef.current) continue;
            scrollTargetRef.current = null; // llegamos a la etapa elegida
          }
          setActive(index);
        }
      },
      { rootMargin: ACTIVE_BAND },
    );
    sectionRefs.current.forEach((section) => section && observer.observe(section));
    return () => observer.disconnect();
  }, [stages.length]);

  // 3. La URL siempre dice cuál es la etapa activa. replace: true para no llenar el historial.
  const activeSlug = stages[active]?.slug;
  useEffect(() => {
    if (!activeSlug || searchParams.get("stage") === activeSlug) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("stage", activeSlug);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }, [activeSlug, searchParams, setSearchParams]);

  // 4. Ir a una etapa (teclado, botones o clic en una isla).
  const goTo = useCallback(
    (index: number) => {
      const target = Math.min(Math.max(index, 0), stages.length - 1);
      const section = sectionRefs.current[target];
      if (!section) return;
      scrollTargetRef.current = target;
      window.setTimeout(() => {
        if (scrollTargetRef.current === target) scrollTargetRef.current = null;
      }, 1500);
      activeRef.current = target;
      setActive(target);
      // Sin animación si el usuario pidió reducir movimiento.
      section.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      // El foco va a la etapa: lectores de pantalla y Tab siguen desde ahí (no se pierde contenido).
      section.focus({ preventScroll: true });
    },
    [stages.length, reducedMotion],
  );

  // 5. Navegación por teclado: ← y → cambian de etapa. ↑ ↓ y espacio siguen haciendo scroll normal,
  //    así se puede leer una etapa larga completa sin saltarse texto.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(activeRef.current + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(activeRef.current - 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goTo]);

  const stage = stages[active];
  if (!stage) {
    return <EmptyState title="Esta saga aún no tiene etapas" />;
  }

  // 6. Colores de la etapa activa como variables CSS: todo el diseño cambia con la etapa.
  const { palette } = stage;
  const themeVars: CSSProperties & Record<`--${string}`, string> = {
    "--story-bg": palette.background,
    "--story-surface": palette.surface,
    "--story-primary": palette.primary,
    "--story-accent": palette.accent,
    "--story-text": palette.text,
    backgroundColor: palette.background,
    color: palette.text,
  };
  const progress = ((active + 1) / stages.length) * 100;

  return (
    <div className="story-theme -mx-4 -my-6 min-h-screen px-4 py-6 lg:px-8" style={themeVars}>
      <ScrollProgress color={palette.primary} hidden={reducedMotion} />

      <header className="mx-auto flex max-w-3xl flex-col gap-3 py-10 text-center">
        <Link to="/sagas" viewTransition className="w-fit text-sm font-semibold hover:underline" style={{ color: palette.primary }}>
          ← Sagas
        </Link>
        <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: palette.accent }}>
          Saga {saga.order} · {saga.firstIsland} → {saga.lastIsland}
        </p>
        <h1 className="text-4xl font-black lg:text-5xl" style={{ viewTransitionName: `saga-${saga.id}` }}>
          {saga.title}
        </h1>
        <p className="text-lg italic opacity-80">{saga.subtitle}</p>
        <p className="leading-relaxed opacity-90">{saga.intro}</p>
        <p className="text-sm opacity-70">
          {saga.stageCount} etapas · {formatNumber(saga.totalDistanceNm)} millas náuticas
        </p>
        <p className="mt-4 text-sm opacity-70">Haz scroll para zarpar ↓ · o usa las flechas ← →</p>
      </header>

      {/* flex en mobile (el panel queda pegado arriba), grid de 2 columnas en desktop */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
        {/* Panel persistente: mapa + progreso + métricas de la etapa activa */}
        <aside
          className="sticky top-14 z-20 -mx-4 flex flex-col gap-3 px-4 py-3 lg:order-last lg:top-20 lg:mx-0 lg:self-start lg:rounded-2xl lg:p-5"
          style={{ backgroundColor: palette.background }}
          aria-label="Mapa y métricas de la etapa activa"
        >
          <StoryMap map={map} stages={stages} active={active} palette={palette} onSelect={goTo} />

          <div aria-live="polite">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                Etapa {active + 1} de {stages.length} · {stage.island.name}
              </span>
              <span className="opacity-70">{Math.round(progress)}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full" style={{ backgroundColor: palette.surface }}>
              <div
                className="h-2 rounded-full motion-safe:transition-[width] motion-safe:duration-500"
                style={{ width: `${progress}%`, backgroundColor: palette.primary }}
              />
            </div>
          </div>

          {/* Las métricas salen directamente de stages[active]: siempre son las de la etapa activa */}
          <dl className="grid grid-cols-4 gap-2 lg:grid-cols-2">
            {stage.metrics.map((metric) => (
              <div
                key={`${stage.id}-${metric.key}`}
                className="metric-in rounded-lg p-2 lg:p-3"
                style={{ backgroundColor: palette.surface }}
              >
                <dt className="truncate text-[10px] uppercase tracking-wider opacity-70 lg:text-xs">
                  {metric.label}
                </dt>
                <dd className="text-sm font-bold lg:text-xl" style={{ color: palette.primary }}>
                  {formatNumber(metric.value)} <span className="text-xs font-normal">{metric.unit}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center justify-between gap-2">
            <button
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
              style={{ borderColor: palette.primary }}
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
            >
              ← Anterior
            </button>
            <button
              className="rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
              style={{ backgroundColor: palette.primary, color: palette.background }}
              onClick={() => goTo(active + 1)}
              disabled={active === stages.length - 1}
            >
              Siguiente →
            </button>
          </div>

          {/* Índice de etapas (desktop): también navegable con Tab + Enter */}
          <ol className="hidden flex-col gap-1 lg:flex">
            {stages.map((s, i) => (
              <li key={s.id}>
                <button
                  className={`w-full rounded-md px-2 py-1 text-left text-sm ${i === active ? "font-bold" : "opacity-70 hover:opacity-100"}`}
                  style={i === active ? { backgroundColor: palette.surface } : undefined}
                  aria-current={i === active ? "step" : undefined}
                  onClick={() => goTo(i)}
                >
                  {s.order}. {s.title}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        {/* Narrativa por etapas */}
        <div>
          {stages.map((s, i) => (
            <section
              key={s.id}
              ref={(el) => {
                sectionRefs.current[i] = el;
              }}
              data-index={i}
              id={`etapa-${s.slug}`}
              tabIndex={-1}
              aria-labelledby={`titulo-${s.id}`}
              className={`stage-dim flex min-h-[75vh] scroll-mt-[calc(26vh+15rem)] flex-col justify-center py-12 outline-none lg:scroll-mt-24 ${i === active ? "opacity-100" : "opacity-45"}`}
            >
              <div className="stage-reveal flex flex-col gap-4">
                <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: s.palette.accent }}>
                  Etapa {s.order} · 📍 {s.island.name}
                </p>
                <h2 id={`titulo-${s.id}`} className="text-3xl font-bold">
                  {s.title}
                </h2>
                {s.narrative.map((paragraph, k) => (
                  <p key={k} className="text-lg leading-relaxed opacity-90">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
          {/* Espacio final para que la última etapa pueda llegar a la franja activa */}
          <div className="h-[40vh]" aria-hidden />
        </div>
      </div>
    </div>
  );
}
