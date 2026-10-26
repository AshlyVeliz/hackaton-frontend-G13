import { useEffect, useState, type DependencyList } from "react";
import { toApiError, type ApiError } from "../api/errors";

type FetchState<T> = {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
};

// Hook propio (no librería) para pedir datos con loading, error y reintento.
// Se vuelve a pedir cada vez que cambia algo en `deps` o se llama a reload().
export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<FetchState<T>>({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Cada request tiene su AbortController. Si cambian los deps antes de que responda,
    // el cleanup la cancela: una respuesta vieja nunca pisa a la nueva.
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcher(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setState({ data: null, error: toApiError(err), loading: false });
        }
      });

    return () => controller.abort();
  }, [...deps, attempt]);

  return { ...state, reload: () => setAttempt((n) => n + 1) };
}
