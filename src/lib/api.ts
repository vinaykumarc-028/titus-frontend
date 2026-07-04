/**
 * Centralised API helper — always sends the auth token stored by AuthContext.
 * Usage: import { api } from '../lib/api';
 *        const data = await api.get('/jobs/');
 *        const data = await api.post('/jobs/', { subject: '...' });
 */

const TOKEN_KEY = 'titus_auth_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const baseURL = import.meta.env.VITE_API_URL || '';
  const res = await fetch(`${baseURL}/api/v1${path}`, {
    method,
    headers,
    body: isFormData
      ? (body as FormData)
      : body !== undefined
      ? JSON.stringify(body)
      : undefined,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {/* ignore */}
    throw new Error(detail);
  }

  // Some endpoints return no body (204)
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}

export const api = {
  get:    <T>(path: string)                    => request<T>('GET', path),
  post:   <T>(path: string, body?: unknown)    => request<T>('POST', path, body),
  put:    <T>(path: string, body?: unknown)    => request<T>('PUT', path, body),
  delete: <T>(path: string)                    => request<T>('DELETE', path),
  upload: <T>(path: string, form: FormData)    => request<T>('POST', path, form, true),
};
