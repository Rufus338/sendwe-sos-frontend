/** Client HTTP avec gestion du refresh token (section 15.1, 20). */
import { useAuthStore } from "../features/auth/authStore";

const API_BASE = "/api/v1";

type ApiErrorPayload = { error_code?: string; message?: string; detail?: string };

export class ApiError extends Error {
  status: number;
  errorCode?: string;
  constructor(status: number, message: string, errorCode?: string) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const auth = useAuthStore.getState();
  if (!auth.refreshToken) throw new ApiError(401, "Session expirée");
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: auth.refreshToken }),
  });
  if (!res.ok) {
    useAuthStore.getState().logout();
    throw new ApiError(401, "Session expirée, reconnectez-vous", "TOKEN_EXPIRED");
  }
  const data = await res.json();
  useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}
): Promise<T> {
  let url = `${API_BASE}${path}`;
  if (options.params) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(options.params)) {
      if (v !== undefined) search.set(k, String(v));
    }
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  const doFetch = async (token?: string): Promise<Response> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  };

  const auth = useAuthStore.getState();
  let res = await doFetch(auth.accessToken ?? undefined);

  // Retry une seule fois avec un access token rafraîchi
  if (res.status === 401 && auth.refreshToken && !path.startsWith("/auth/login")) {
    try {
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      res = await doFetch(newToken);
    } catch {
      refreshing = null;
      throw new ApiError(401, "Session expirée", "TOKEN_EXPIRED");
    }
  }

  if (!res.ok) {
    let payload: ApiErrorPayload = {};
    try {
      payload = await res.json();
    } catch {
      /* ignore */
    }
    const message = payload.message ?? payload.detail ?? `Erreur ${res.status}`;
    throw new ApiError(res.status, message, payload.error_code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
