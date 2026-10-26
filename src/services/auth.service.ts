import apiClient from "../api/api";
import type { LoginResponse, MeResponse } from "../types/api";

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", { email, password });
  return data;
}

export async function register(teamName: string, email: string, password: string) {
  const { data } = await apiClient.post<LoginResponse>("/auth/register", {
    teamName,
    email,
    password,
  });
  return data;
}

// Valida el token guardado y devuelve quién es el usuario (se usa para restaurar la sesión).
export async function getMe(signal?: AbortSignal) {
  const { data } = await apiClient.get<MeResponse>("/auth/me", { signal });
  return data;
}
