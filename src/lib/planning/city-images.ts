/**
 * City images - placeholder functions
 * Real images should be fetched from Google Places API via /api/city-image and /api/site-image
 * These sync functions return empty strings - components should fetch images async
 */

/**
 * DEPRECATED: Returns empty string
 * Use fetchCityImage() or /api/city-image endpoint instead
 */
export function getCityImage(_cityName: string, _country?: string): string {
  // Return empty - components should use async fetch to /api/city-image
  return '';
}

/**
 * DEPRECATED: Returns empty string
 * Use fetchSiteImage() or /api/site-image endpoint instead
 */
export function getSiteImage(_siteName: string, _city?: string): string {
  // Return empty - components should use async fetch to /api/site-image
  return '';
}

/**
 * Async function to fetch city image from Google Places
 */
export async function fetchCityImage(cityName: string, country?: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({ city: cityName });
    if (country) params.append('country', country);

    const response = await fetch(`/api/city-image?${params}`);
    if (!response.ok) return null;

    const data = await response.json();
    return data.imageUrl || null;
  } catch (error) {
    console.error(`[CityImages] Failed to fetch image for ${cityName}:`, error);
    return null;
  }
}

/**
 * Async function to fetch site/attraction image from Google Places
 */
export async function fetchSiteImage(siteName: string, city?: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({ site: siteName });
    if (city) params.append('city', city);

    const response = await fetch(`/api/site-image?${params}`);
    if (!response.ok) return null;

    const data = await response.json();
    return data.imageUrl || null;
  } catch (error) {
    console.error(`[CityImages] Failed to fetch image for ${siteName}:`, error);
    return null;
  }
}

// Empty maps for backwards compatibility (deprecated)
export const CITY_IMAGES: Record<string, string> = {};
export const SITE_IMAGES: Record<string, string> = {};
