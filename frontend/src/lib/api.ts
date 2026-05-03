/**
 * Unified HTTP client for the СТРОИК backend.
 *
 * Helpers:
 *   apiGet, apiPost, apiPatch, apiPut, apiDelete — JSON methods
 *   apiPostForm — multipart/form-data (FormData)
 */

export const API_URL: string =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  'http://127.0.0.1:8000';

export const TOKEN_STORAGE_KEY = 'stroik_token';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
};

export const setStoredToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(TOKEN_STORAGE_KEY, token); } catch { /* ignore */ }
};

export const clearStoredToken = (): void => {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(TOKEN_STORAGE_KEY); } catch { /* ignore */ }
};

export interface ApiOptions extends Omit<RequestInit, 'body' | 'method'> {
  skipAuth?: boolean;
  json?: unknown;
  body?: BodyInit;
  method?: string;
}

const buildUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_URL.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
};

const buildHeaders = (init: ApiOptions): Headers => {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (init.json !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!init.skipAuth) {
    const token = getStoredToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return headers;
};

export async function apiFetch<T = unknown>(path: string, init: ApiOptions = {}): Promise<T> {
  const url = buildUrl(path);
  const headers = buildHeaders(init);
  const body =
    init.json !== undefined ? JSON.stringify(init.json) : (init.body as BodyInit | undefined);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      body,
      method: init.method || (init.json !== undefined ? 'POST' : 'GET'),
    });
  } catch (networkError) {
    const message = networkError instanceof Error ? networkError.message : 'Network error';
    throw new ApiError(0, `Сеть недоступна: ${message}`);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let payload: unknown;
  try { payload = text ? JSON.parse(text) : undefined; } catch { payload = text; }

  if (!res.ok) {
    const detail =
      (payload as { detail?: string } | undefined)?.detail || `HTTP ${res.status}`;
    throw new ApiError(res.status, detail, payload);
  }

  return payload as T;
}

export const apiGet = <T = unknown>(path: string, init: ApiOptions = {}) =>
  apiFetch<T>(path, { ...init, method: 'GET' });

export const apiPost = <T = unknown>(path: string, json?: unknown, init: ApiOptions = {}) =>
  apiFetch<T>(path, { ...init, method: 'POST', json });

export const apiPatch = <T = unknown>(path: string, json?: unknown, init: ApiOptions = {}) =>
  apiFetch<T>(path, { ...init, method: 'PATCH', json });

export const apiPut = <T = unknown>(path: string, json?: unknown, init: ApiOptions = {}) =>
  apiFetch<T>(path, { ...init, method: 'PUT', json });

export const apiDelete = <T = unknown>(path: string, init: ApiOptions = {}) =>
  apiFetch<T>(path, { ...init, method: 'DELETE' });

/**
 * POST with FormData body.
 * Do NOT set Content-Type — browser must set it with the multipart boundary.
 */
export const apiPostForm = <T = unknown>(path: string, formData: FormData, init: ApiOptions = {}) => {
  const token = getStoredToken();
  const headers = new Headers(init.headers || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  return apiFetch<T>(path, { ...init, method: 'POST', body: formData, headers, skipAuth: true });
};
