/**
 * Fetch wrapper with timeout support
 */

export const API_TIMEOUTS = {
  GOOGLE_PLACES: 15000,  // 15s for Google Places
  DEFAULT: 30000,        // 30s default
} as const;

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUTS.DEFAULT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
