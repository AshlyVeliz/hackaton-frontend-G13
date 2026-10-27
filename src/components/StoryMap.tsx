import type { Palette, SagaStage } from "../types/api";

// Mapa del Grand Line dibujado en SVG con las coordenadas que manda la API.
// viewBox = "0 0 width height": las x/y de cada isla se usan tal cual.
export default function StoryMap({
  map,
  stages,
  active,
  palette,
  onSelect,
}: {
  map: { width: number; height: number };
  stages: SagaStage[];
  active: number;
  palette: Palette;
  onSelect: (index: number) => void;
}) {
  const unit = Math.max(map.width, map.height) / 100; // tamaño relativo al mapa
  const points = stages.map((s) => `${s.island.x},${s.island.y}`);
  const traveled = points.slice(0, active + 1).join(" "); // ruta recorrida hasta la etapa activa
  const ship = stages[active]?.island;
  const pad = unit * 6; // margen para que el barco y los nombres de los bordes no se corten

  // Los nombres cerca de los bordes se alinean hacia adentro del mapa.
  const anchorFor = (x: number) =>
    x < map.width * 0.15 ? "start" : x > map.width * 0.85 ? "end" : "middle";

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${map.width + pad * 2} ${map.height + pad * 2}`}
      className="story-theme block h-auto max-h-[26vh] w-full rounded-xl lg:max-h-none"
      role="img"
      aria-label={ship ? `Mapa del Grand Line. El barco está en ${ship.name}.` : "Mapa del Grand Line"}
      style={{ backgroundColor: palette.surface }}
    >
      {/* Ruta completa (punteada, tenue) */}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={palette.text}
        strokeOpacity={0.25}
        strokeWidth={unit * 0.35}
        strokeDasharray={`${unit} ${unit}`}
      />
      {/* Ruta recorrida: se dibuja a medida que se avanza */}
      <polyline
        points={traveled}
        fill="none"
        stroke={palette.primary}
        strokeWidth={unit * 0.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {stages.map((stage, i) => (
        <g key={stage.id} onClick={() => onSelect(i)} className="cursor-pointer">
          <circle
            cx={stage.island.x}
            cy={stage.island.y}
            r={i === active ? unit * 1.8 : unit * 1.2}
            fill={i <= active ? palette.accent : palette.background}
            stroke={palette.primary}
            strokeWidth={unit * 0.3}
          />
          <text
            x={stage.island.x}
            y={stage.island.y + unit * 3.8}
            textAnchor={anchorFor(stage.island.x)}
            fontSize={unit * 2.2}
            fontWeight={i === active ? 700 : 400}
            fill={palette.text}
          >
            {stage.island.name}
          </text>
        </g>
      ))}

      {/* El barco: se mueve con una transition de CSS (desactivada con reduced motion) */}
      {ship && (
        <g
          className="story-ship"
          style={{ transform: `translate(${ship.x}px, ${ship.y - unit * 2.6}px)` }}
          aria-hidden
        >
          <text textAnchor="middle" fontSize={unit * 4.5}>
            ⛵
          </text>
        </g>
      )}
    </svg>
  );
}
