import axios from "axios";

// La API responde todos los errores con el mismo formato:
// { status, code, message, traceId, details? }
export type FieldError = {
  field: string;
  message: string;
};

export type ApiError = {
  status: number;
  code: string;
  message: string;
  details: FieldError[];
  // Solo en 409 NEWS_ALREADY_VERIFIED: el estado actual de la noticia (se valida antes de usarlo)
  current?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFieldError(value: unknown): value is FieldError {
  return isRecord(value) && typeof value.field === "string" && typeof value.message === "string";
}

// Convierte cualquier error (de Axios, de red, etc.) en un ApiError tipado. Así no usamos `any`.
export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    const body: unknown = err.response?.data;
    if (isRecord(body) && typeof body.code === "string" && typeof body.message === "string") {
      const details = Array.isArray(body.details) ? body.details.filter(isFieldError) : [];
      return { status, code: body.code, message: body.message, details, current: body.current };
    }
    if (status === 0) {
      return {
        status,
        code: "NETWORK_ERROR",
        message: "No se pudo conectar con el servidor.",
        details: [],
      };
    }
  }
  return { status: 0, code: "UNKNOWN", message: "Ocurrió un error inesperado.", details: [] };
}
