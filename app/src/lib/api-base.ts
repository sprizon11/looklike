/**
 * API base URL for backend requests.
 * - Dev: set VITE_API_BASE_URL=http://localhost:8080 in app/.env
 * - Production (Render): leave unset — uses same origin (/api/...)
 */
export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (raw?.trim()) return raw.replace(/\/+$/, '')
  if (import.meta.env.PROD) return ''
  return ''
}

/** True when the app should load/save products & orders via the backend (not localStorage only). */
export function hasBackendApi(): boolean {
  if (import.meta.env.VITE_API_BASE_URL?.trim()) return true
  return import.meta.env.PROD
}
