import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Puente de mando" },
  { to: "/wanted", label: "Se Busca" },
  { to: "/news", label: "Noticias" },
  { to: "/sagas", label: "Sagas" },
];

export default function Layout() {
  const { session, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <span className="font-bold whitespace-nowrap">🧭 Log Pose</span>
          <nav className="flex flex-1 gap-1 overflow-x-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${isActive ? "bg-amber-400 text-slate-950" : "text-slate-300 hover:bg-white/10"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          {session && (
            <span className="hidden text-sm text-slate-400 sm:inline">
              {session.team.name} · {session.team.code}
            </span>
          )}
          <button className="btn-ghost text-sm" onClick={logout}>
            Salir
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
