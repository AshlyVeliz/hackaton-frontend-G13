import type { NewsPriority, NewsStatus, NewsType } from "../types/api";
import { pickOption } from "./wantedQuery";

export const NEWS_TYPES: readonly NewsType[] = [
  "BOUNTY_UPDATE",
  "BATTLE",
  "MARINE_OPERATION",
  "WORLD_GOVERNMENT",
  "DISCOVERY",
];
export const NEWS_PRIORITIES: readonly NewsPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const NEWS_STATUSES: readonly NewsStatus[] = ["RUMOR", "CONFIRMED", "DEBUNKED"];

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  BOUNTY_UPDATE: "Recompensas",
  BATTLE: "Batalla",
  MARINE_OPERATION: "Operación Marine",
  WORLD_GOVERNMENT: "Gobierno Mundial",
  DISCOVERY: "Descubrimiento",
};

export const NEWS_PRIORITY_LABELS: Record<NewsPriority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export const NEWS_STATUS_LABELS: Record<NewsStatus, string> = {
  RUMOR: "Rumor",
  CONFIRMED: "Confirmada",
  DEBUNKED: "Desmentida",
};

export type NewsFilters = {
  type: NewsType | "";
  priority: NewsPriority | "";
  status: NewsStatus | "";
};

// URL → filtros válidos (un valor inválido se ignora en vez de romper la vista).
export function parseNewsFilters(params: URLSearchParams): NewsFilters {
  return {
    type: pickOption(NEWS_TYPES, params.get("type")) ?? "",
    priority: pickOption(NEWS_PRIORITIES, params.get("priority")) ?? "",
    status: pickOption(NEWS_STATUSES, params.get("status")) ?? "",
  };
}

// Filtros → URL, siempre en el mismo orden.
export function toNewsSearchParams(filters: NewsFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.status) params.set("status", filters.status);
  return params;
}
