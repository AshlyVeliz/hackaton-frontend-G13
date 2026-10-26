import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SessionSplash from "./SessionSplash";

// Lee el destino que guardó PrivateRoute en location.state.from.
// location.state es `unknown`, por eso se valida antes de usarlo.
export function getRedirectTarget(state: unknown): string {
  if (typeof state === "object" && state !== null && "from" in state) {
    const from = state.from;
    if (typeof from === "object" && from !== null && "pathname" in from) {
      const { pathname, search, hash } = from as { pathname: string; search?: string; hash?: string };
      return `${pathname}${search ?? ""}${hash ?? ""}`;
    }
  }
  return "/dashboard";
}

// Envuelve /login y /register: si ya hay sesión, no tiene sentido mostrarlos.
// Además, apenas el login/registro sale bien, el status pasa a "authenticated"
// y este componente redirige a donde el usuario quería ir.
export default function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "checking" || status === "error") return <SessionSplash />;
  if (status === "authenticated") {
    return <Navigate to={getRedirectTarget(location.state)} replace />;
  }
  return <Outlet />;
}
