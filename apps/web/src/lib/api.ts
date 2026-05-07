const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown; token?: string } = {},
): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Error desconocido' }));
    if (res.status === 401) {
      const msg = (data as { message?: string }).message ?? 'No autorizado';
      throw new ApiError(401, msg);
    }
    throw new ApiError(res.status, (data as { message?: string }).message ?? 'Error del servidor');
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
