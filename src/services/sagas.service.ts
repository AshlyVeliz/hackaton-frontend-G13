import apiClient from "../api/api";
import type { SagaStory, SagaSummary } from "../types/api";

export async function getSagas(signal?: AbortSignal) {
  const { data } = await apiClient.get<SagaSummary[]>("/sagas", { signal });
  return data;
}

// La saga con sus etapas: narrativa, isla (posición en el mapa), paleta y métricas.
export async function getSagaStory(id: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<SagaStory>(`/sagas/${encodeURIComponent(id)}/story`, {
    signal,
  });
  return data;
}
