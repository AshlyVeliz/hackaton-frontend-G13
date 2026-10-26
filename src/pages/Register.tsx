import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { toApiError } from "../api/errors";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "./Login";

type Field = "teamName" | "email" | "password";
type FieldErrors = Partial<Record<Field, string>>;

function isField(value: string): value is Field {
  return value === "teamName" || value === "email" || value === "password";
}

export default function Register() {
  const { register } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ teamName: "", email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");

  const updateField = (field: Field, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined })); // al corregir, se limpia su error
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setFieldErrors({});
    setGeneralError("");
    try {
      await register(form.teamName.trim(), form.email.trim(), form.password);
      // Registro OK → ya hay sesión → PublicOnlyRoute nos manda a la app.
    } catch (err) {
      const apiError = toApiError(err);
      // Cada error del servidor se muestra junto al campo que corresponde.
      if (apiError.code === "EMAIL_ALREADY_REGISTERED") {
        setFieldErrors({ email: apiError.message });
      } else if (apiError.code === "TEAM_NAME_TAKEN") {
        setFieldErrors({ teamName: apiError.message });
      } else if (apiError.code === "VALIDATION_ERROR" && apiError.details.length > 0) {
        const errors: FieldErrors = {};
        for (const detail of apiError.details) {
          if (isField(detail.field)) errors[detail.field] = detail.message;
          else setGeneralError(detail.message);
        }
        setFieldErrors(errors);
      } else {
        setGeneralError(apiError.message);
      }
      setStatus("error");
    }
  };

  return (
    <AuthShell title="Nueva tripulación" subtitle="Registra a tu equipo de cazarrecompensas">
      {/* noValidate: dejamos que el servidor valide y mostramos sus errores en cada campo */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Nombre de la tripulación"
          value={form.teamName}
          error={fieldErrors.teamName}
          autoComplete="organization"
          onChange={(v) => updateField("teamName", v)}
        />
        <TextField
          label="Email"
          type="email"
          value={form.email}
          error={fieldErrors.email}
          autoComplete="email"
          onChange={(v) => updateField("email", v)}
        />
        <TextField
          label="Contraseña (mínimo 8 caracteres)"
          type="password"
          value={form.password}
          error={fieldErrors.password}
          autoComplete="new-password"
          onChange={(v) => updateField("password", v)}
        />

        {generalError && (
          <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300" role="alert">
            {generalError}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={status === "loading"}>
          {status === "loading" ? "Registrando…" : "Registrar y zarpar"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        ¿Ya tienen cuenta?{" "}
        <Link to="/login" state={location.state} className="link">
          Iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}

function TextField({
  label,
  value,
  error,
  type = "text",
  autoComplete,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <small className="text-red-300">{error}</small>}
    </label>
  );
}
