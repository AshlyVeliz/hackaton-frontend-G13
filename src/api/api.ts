import axios from "axios";

const TOKEN_KEY = "logpose.token";

// El token vive en localStorage: sobrevive a un F5 y a cerrar/abrir la pestaña
// (el estado de React, en cambio, se borra al recargar).
export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Una sola instancia de Axios para toda la app.
// La URL base sale de .env (VITE_API_BASE_URL); no se escribe en el código.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,
});

// Request interceptor: se ejecuta ANTES de cada request y le pone el token.
// Sin esto tendríamos que escribir el header Authorization en cada llamada.
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AuthContext se registra aquí para enterarse cuando la sesión deja de ser válida.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

// Response interceptor: se ejecuta DESPUÉS de cada respuesta.
// Un 401 (token vencido o inválido) cierra la sesión y la app vuelve al login.
// En login/registro un 401 solo significa "credenciales incorrectas", así que ahí no se cierra nada.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const isAuthForm = url.includes("/auth/login") || url.includes("/auth/register");
      if (!isAuthForm) onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
