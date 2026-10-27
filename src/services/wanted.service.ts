import apiClient from "../api/api";
import type {
  Crew,
  FruitFilter,
  WantedDetail,
  WantedPage,
  WantedSort,
  WantedStatus,
} from "../types/api";

// Parámetros que acepta GET /wanted. Los opcionales que van `undefined` Axios no los manda.
export type WantedApiParams = {
  page: number; // desde 0
  size: number;
  sort: WantedSort;
  status?: WantedStatus;
  crewId?: string;
  fruit?: FruitFilter;
  q?: string;
};

// La búsqueda, los filtros y la paginación los resuelve el BACKEND.
// Nosotros solo mandamos los params y Axios arma la URL: /wanted?page=0&size=20&q=luffy
export async function getWanted(params: WantedApiParams, signal?: AbortSignal) {
  const { data } = await apiClient.get<WantedPage>("/wanted", { params, signal });
  return data;
}

export async function getWantedById(id: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<WantedDetail>(`/wanted/${encodeURIComponent(id)}`, {
    signal,
  });
  return data;
}

export async function getCrews(signal?: AbortSignal) {
  const { data } = await apiClient.get<Crew[]>("/crews", { signal });
  return data;
}
