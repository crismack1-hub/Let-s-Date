const DEFAULT_API_URL = "http://localhost:4000";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && /:(5173|4173)$/.test(window.location.origin)
    ? DEFAULT_API_URL
    : typeof window !== "undefined"
      ? window.location.origin
      : DEFAULT_API_URL);

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
