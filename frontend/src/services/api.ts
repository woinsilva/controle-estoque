import { notify } from './notifications';

function resolveApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:3001`;
}

const API_BASE_URL = resolveApiBaseUrl();

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

type ApiErrorResponse = {
  error?: string;
  message?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
};

function formatApiError(data: ApiErrorResponse): string {
  const messages: string[] = [];

  if (data.error) {
    messages.push(data.error);
  } else if (data.message) {
    messages.push(data.message);
  }

  const formErrors = data.details?.formErrors || [];
  for (const formError of formErrors) {
    if (formError && !messages.includes(formError)) {
      messages.push(formError);
    }
  }

  const fieldErrors = data.details?.fieldErrors || {};
  for (const [field, errors] of Object.entries(fieldErrors)) {
    for (const fieldError of errors) {
      const message = `${field}: ${fieldError}`;
      if (fieldError && !messages.includes(message)) {
        messages.push(message);
      }
    }
  }

  return messages.filter(Boolean).join(' | ') || 'API request failed';
}

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
      notify({
        severity: 'error',
        summary: 'Sessao expirada',
        detail: 'Invalid or expired token.'
      });
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
      const data = (await response.json()) as ApiErrorResponse;
      message = formatApiError(data);
    } catch {
      // Ignore JSON parse errors for empty responses.
    }

    notify({
      severity: 'error',
      summary: 'Erro',
      detail: message
    });

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
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
