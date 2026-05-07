import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function doFetch(path: string, method: HttpMethod, headers: Record<string, string>, body?: unknown) {
  return fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

// Attempts to refresh the access token. Returns the new token or null on failure.
async function tryRefresh(): Promise<string | null> {
  const { refreshToken, updateTokens, clearAuth } = useAuthStore.getState();
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearAuth();
    if (typeof window !== 'undefined') window.location.replace('/login');
    return null;
  }

  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  updateTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function apiFetch<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown; token?: string } = {},
): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await doFetch(path, method, headers, body);

  // On 401, transparently refresh the token and retry once
  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    const newToken = await tryRefresh();
    if (newToken) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      res = await doFetch(path, method, retryHeaders, body);
    } else {
      throw new ApiError(401, 'Sesión expirada');
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Error desconocido' }));
    throw new ApiError(res.status, (data as { message?: string }).message ?? 'Error del servidor');
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
