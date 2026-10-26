import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { setUnauthorizedHandler, tokenStorage } from "../api/api";
import { toApiError, type ApiError } from "../api/errors";
import * as authService from "../services/auth.service";
import type { Team, User } from "../types/api";

// checking      → hay token guardado y lo estamos validando con /auth/me
// authenticated → sesión válida
// anonymous     → sin sesión
// error         → no se pudo validar (servidor caído); se muestra reintento, no el login
type AuthStatus = "checking" | "authenticated" | "anonymous" | "error";

type Session = {
  user: User;
  team: Team;
  expiresAt: string;
};

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  checkError: ApiError | null;
  login: (email: string, password: string) => Promise<void>;
  register: (teamName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  retryCheck: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Si al cargar la app ya hay token, empezamos en "checking" (no en el login).
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStorage.get() ? "checking" : "anonymous",
  );
  const [session, setSession] = useState<Session | null>(null);
  const [checkError, setCheckError] = useState<ApiError | null>(null);
  const [checkAttempt, setCheckAttempt] = useState(0);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setSession(null);
    setStatus("anonymous");
  }, []);

  const startSession = useCallback((token: string, data: Session) => {
    tokenStorage.set(token);
    setSession({ user: data.user, team: data.team, expiresAt: data.expiresAt });
    setStatus("authenticated");
  }, []);

  // Restaurar sesión: al recargar, validamos el token guardado con GET /auth/me.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    const controller = new AbortController();
    setStatus("checking");
    authService
      .getMe(controller.signal)
      .then((me) => {
        setSession(me);
        setStatus("authenticated");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const apiError = toApiError(err);
        if (apiError.status === 401) {
          logout(); // token vencido o inválido → al login
        } else {
          setCheckError(apiError);
          setStatus("error");
        }
      });
    return () => controller.abort();
  }, [checkAttempt, logout]);

  // Si cualquier request responde 401, el interceptor de api.ts llama a logout.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Cuando llega la hora de expiresAt, cerramos la sesión aunque no se haga ninguna request.
  useEffect(() => {
    if (!session) return;
    const msLeft = new Date(session.expiresAt).getTime() - Date.now();
    if (msLeft <= 0) {
      logout();
      return;
    }
    if (msLeft > 2_147_483_647) return; // setTimeout no acepta más de ~24 días
    const timer = window.setTimeout(logout, msLeft);
    return () => window.clearTimeout(timer);
  }, [session, logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authService.login(email, password);
      startSession(data.token, data);
    },
    [startSession],
  );

  const register = useCallback(
    async (teamName: string, email: string, password: string) => {
      const data = await authService.register(teamName, email, password);
      startSession(data.token, data);
    },
    [startSession],
  );

  const retryCheck = useCallback(() => {
    setCheckError(null);
    setCheckAttempt((n) => n + 1);
  }, []);

  return (
    <AuthContext.Provider
      value={{ status, session, checkError, login, register, logout, retryCheck }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
