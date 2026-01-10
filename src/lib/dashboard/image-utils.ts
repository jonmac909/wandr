/**
 * Image utilities for dashboard components
 *
 * Uses Lorem Picsum for reliable placeholder images
 * Seed-based URLs ensure consistent images per destination
 */

/**
 * Generate a seeded image URL based on destination
 * Same destination always gets the same image
 */
export function getDestinationImage(destination: string, width: number, height: number): string {
  const seed = destination.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * Generate a hotel/accommodation image
 */
export function getAccommodationImage(name: string, width: number, height: number): string {
  const seed = `hotel${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * Generate a generic travel image
 */
export function getTravelImage(query: string, width: number, height: number): string {
  const seed = (query || 'travel').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}
