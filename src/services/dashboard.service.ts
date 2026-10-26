import apiClient from "../api/api";
import type { DashboardSummary, LogPose } from "../types/api";

export async function getDashboardSummary(signal?: AbortSignal) {
  const { data } = await apiClient.get<DashboardSummary>("/dashboard/summary", { signal });
  return data;
}

export async function getLogPose(signal?: AbortSignal) {
  const { data } = await apiClient.get<LogPose>("/log-pose", { signal });
  return data;
}
