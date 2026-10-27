import apiClient from "../api/api";
import type { NewsDetail, NewsFeed, NewsPriority, NewsStatus, NewsType, NewsVerdict } from "../types/api";

export type NewsFeedParams = {
  cursor?: string; // undefined = primera carga
  limit: number;
  type?: NewsType;
  priority?: NewsPriority;
  status?: NewsStatus;
};

// Paginación por cursor: cada respuesta trae `nextCursor`, que se manda en la siguiente request.
export async function getNewsFeed(params: NewsFeedParams, signal?: AbortSignal) {
  const { data } = await apiClient.get<NewsFeed>("/news/feed", { params, signal });
  return data;
}

export async function getNewsById(id: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<NewsDetail>(`/news/${encodeURIComponent(id)}`, { signal });
  return data;
}

// Solo un RUMOR se puede verificar. La respuesta es la noticia ya actualizada.
export async function updateNewsStatus(id: string, status: NewsVerdict) {
  const { data } = await apiClient.patch<NewsDetail>(`/news/${encodeURIComponent(id)}/status`, {
    status,
  });
  return data;
}
