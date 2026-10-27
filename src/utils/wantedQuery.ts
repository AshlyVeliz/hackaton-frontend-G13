import type { WantedApiParams } from "../services/wanted.service";
import type { FruitFilter, WantedSort, WantedStatus } from "../types/api";

// Valores permitidos por la API (copiados de Swagger).
export const PAGE_SIZES = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const SORTS: readonly WantedSort[] = ["bounty,desc", "name,asc", "updatedAt,desc"];
export const STATUSES: readonly WantedStatus[] = ["AT_LARGE", "CAPTURED", "MISSING"];
export const FRUITS: readonly FruitFilter[] = ["PARAMECIA", "ZOAN", "LOGIA", "NONE"];

// Todo lo que el usuario eligió en /wanted. Vive en la URL, no en useState.
export type WantedQuery = {
  page: number; // en la URL empieza en 1 (más natural para personas)
  size: PageSize;
  sort: WantedSort;
  status: WantedStatus | "";
  fruit: FruitFilter | "";
  crewId: string;
  q: string;
};

export const DEFAULT_QUERY: WantedQuery = {
  page: 1,
  size: 20,
  sort: "bounty,desc",
  status: "",
  fruit: "",
  crewId: "",
  q: "",
};

// Devuelve el valor solo si está en la lista de permitidos.
export function pickOption<T extends string>(options: readonly T[], value: string | null) {
  return options.find((option) => option === value);
}

// URL → objeto válido. Cualquier valor inválido (?size=999, ?page=abc, ?status=PATATA)
// se reemplaza por el valor por defecto en vez de romper la vista.
export function parseWantedQuery(params: URLSearchParams): WantedQuery {
  const page = Number(params.get("page"));
  const size = Number(params.get("size"));
  const crewId = (params.get("crewId") ?? "").trim();

  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_QUERY.page,
    size: PAGE_SIZES.find((option) => option === size) ?? DEFAULT_QUERY.size,
    sort: pickOption(SORTS, params.get("sort")) ?? DEFAULT_QUERY.sort,
    status: pickOption(STATUSES, params.get("status")) ?? "",
    fruit: pickOption(FRUITS, params.get("fruit")) ?? "",
    crewId: crewId.length <= 200 ? crewId : "",
    q: (params.get("q") ?? "").trim().slice(0, 100),
  };
}

// Objeto → URL. Solo se escriben los valores distintos al default, siempre en el mismo orden.
export function toSearchParams(query: WantedQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.crewId) params.set("crewId", query.crewId);
  if (query.fruit) params.set("fruit", query.fruit);
  if (query.sort !== DEFAULT_QUERY.sort) params.set("sort", query.sort);
  if (query.size !== DEFAULT_QUERY.size) params.set("size", String(query.size));
  if (query.page !== DEFAULT_QUERY.page) params.set("page", String(query.page));
  return params;
}

// Objeto → params de la API. La API cuenta las páginas desde 0, por eso page - 1.
export function toApiParams(query: WantedQuery): WantedApiParams {
  return {
    page: query.page - 1,
    size: query.size,
    sort: query.sort,
    status: query.status || undefined,
    crewId: query.crewId || undefined,
    fruit: query.fruit || undefined,
    q: query.q || undefined,
  };
}
