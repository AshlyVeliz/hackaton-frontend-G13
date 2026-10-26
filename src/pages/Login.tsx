import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { toApiError } from "../api/errors";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Un solo estado en vez de varios booleanos: nunca puede estar "cargando" y "con error" a la vez.
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // evita que el form recargue la página
    setStatus("loading");
    try {
      await login(email.trim(), password);
      // No hace falta navigate: PublicOnlyRoute ve la sesión y redirige a donde quería ir.
    } catch (err) {
      const apiError = toApiError(err);
      setErrorMessage(
        apiError.code === "INVALID_CREDENTIALS" ? "Email o contraseña incorrectos." : apiError.message,
      );
      setStatus("error");
    }
  };

  return (
    <AuthShell title="Zarpar" subtitle="Inicia sesión con la cuenta de tu tripulación">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {status === "error" && (
          <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300" role="alert">
            {errorMessage}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={status === "loading"}>
          {status === "loading" ? "Zarpando…" : "Entrar"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        ¿Tripulación nueva?{" "}
        {/* Pasamos el state para no perder el "from" si se registra en vez de loguearse */}
        <Link to="/register" state={location.state} className="link">
          Registrarla
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="text-5xl" aria-hidden>
            🧭
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-amber-300">Log Pose Console</p>
          <h1 className="mt-1 text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
