const DEFAULT_API_URL = "http://localhost:4000";
const PRODUCTION_API_URL = "https://lets-date-backend.onrender.com";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  (import.meta.env.PROD ? PRODUCTION_API_URL : DEFAULT_API_URL);

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
