import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SessionSplash from "./SessionSplash";

export default function PrivateRoute() {
  const { status } = useAuth();
  const location = useLocation();

  // Mientras se valida el token mostramos una pantalla de carga, NO el login.
  if (status === "checking" || status === "error") {
    return <SessionSplash />;
  }

  if (status === "anonymous") {
    // Guardamos a dónde quería ir (ruta + query) para volver ahí después del login.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />; // sesión válida → renderiza la ruta hija
}
