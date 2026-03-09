const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    if (response.status === 401 && options.token) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('clientId');
      localStorage.removeItem('isProfessional');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('clientId');
      sessionStorage.removeItem('isProfessional');
      window.location.href = '/login';
      throw new Error('Invalid or expired token.');
    }

    let message = 'API request failed';
    try {
      const data = (await response.json()) as { error?: string; message?: string };
      message = data.error || data.message || message;
    } catch {
      // Ignore JSON parse errors for empty responses.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function apiGet<T>(path: string, token?: string | null): Promise<T> {
  return request<T>(path, { token });
}

export function apiPost<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  return request<T>(path, { method: 'POST', body, token });
}

export function apiPut<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  return request<T>(path, { method: 'PUT', body, token });
}

export function apiDelete<T>(path: string, token?: string | null): Promise<T> {
  return request<T>(path, { method: 'DELETE', token });
}

export function apiPatch<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  return request<T>(path, { method: 'PATCH', body, token });
}
