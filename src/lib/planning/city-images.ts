/**
 * City images using Unsplash Source API for dynamic, relevant images
 * Uses search-based URLs so ANY city will get appropriate images
 */

/**
 * Generate a dynamic Unsplash image URL for any city
 * Uses Unsplash Source API which searches and returns relevant images
 */
export function getCityImage(cityName: string, country?: string): string {
  // Encode the search query
  const searchQuery = country
    ? `${cityName},${country},travel`
    : `${cityName},travel,city`;

  const encoded = encodeURIComponent(searchQuery);

  // Use Unsplash Source API - returns a random image matching the search
  // Adding a signature based on city name ensures same city = same image (caching)
  const signature = cityName.toLowerCase().replace(/[^a-z]/g, '');

  return `https://source.unsplash.com/600x400/?${encoded}&sig=${signature}`;
}

/**
 * Get the image URL for a top site/attraction
 */
export function getSiteImage(siteName: string): string {
  const encoded = encodeURIComponent(`${siteName},landmark,travel`);
  const signature = siteName.toLowerCase().replace(/[^a-z]/g, '');

  return `https://source.unsplash.com/600x400/?${encoded}&sig=${signature}`;
}

// For backwards compatibility - export empty object
export const CITY_IMAGES: Record<string, string> = {};
export const SITE_IMAGES: Record<string, string> = {};
