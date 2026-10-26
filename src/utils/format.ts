const numberFormat = new Intl.NumberFormat("es-PE");

export function formatBerries(amount: number) {
  return `฿ ${numberFormat.format(amount)}`;
}

export function formatNumber(value: number) {
  return numberFormat.format(value);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

export const STATUS_LABELS = {
  AT_LARGE: "Prófugo",
  CAPTURED: "Capturado",
  MISSING: "Desaparecido",
} as const;

export const FRUIT_LABELS = {
  PARAMECIA: "Paramecia",
  ZOAN: "Zoan",
  LOGIA: "Logia",
  NONE: "Sin fruta",
} as const;
