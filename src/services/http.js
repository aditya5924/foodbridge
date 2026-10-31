/** Shared HTTP client. API responses are JSON; errors have {message, code, status, details}. */
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
let token = null;
let unauthorized = () => {};
export const setAccessToken = (value) => { token = value || null; };
export const onUnauthorized = (callback) => { unauthorized = callback; };
export class ApiError extends Error {
  constructor(message, status = 0, code = 'REQUEST_FAILED', details = null) {
    super(message); this.name = 'ApiError'; this.status = status; this.code = code; this.details = details;
  }
}
export async function http(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
  const requestHeaders = { Accept: 'application/json', ...(!multipart && body !== undefined ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization: `Bearer ${token}`} : {}), ...headers };
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {method, headers: requestHeaders, body: body === undefined ? undefined : multipart ? body : JSON.stringify(body), signal});
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError('Unable to reach the server. Check your connection.', 0, 'NETWORK_ERROR');
  }
  let payload = null;
  if (response.status !== 204) {
    const raw = await response.text();
    if (raw) { try { payload = JSON.parse(raw); } catch { throw new ApiError('Invalid server response.', response.status, 'INVALID_RESPONSE'); } }
  }
  if (response.status === 401) { setAccessToken(null); unauthorized(); }
  if (!response.ok) throw new ApiError(payload?.error?.message || payload?.message || `Request failed (${response.status}).`, response.status, payload?.error?.code || payload?.code || 'REQUEST_FAILED', payload?.error?.details || payload?.details);
  return payload;
}
