/**
 * Image utilities for dashboard components
 *
 * Uses Lorem Picsum for reliable placeholder images with destination-based seeds
 * This ensures consistent images for the same destination
 */

/**
 * Generate a placeholder image URL based on destination
 * Uses Lorem Picsum with a seeded random based on the destination name
 * so the same destination always gets the same image
 */
export function getDestinationImage(destination: string, width: number, height: number): string {
  // Create a simple hash from the destination string for consistent seeding
  const seed = destination.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Use Lorem Picsum with seed for consistent photos
  // The seed ensures same destination = same photo
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * Generate a hotel/accommodation placeholder image
 */
export function getAccommodationImage(name: string, width: number, height: number): string {
  const seed = `hotel-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * Generate a generic travel placeholder
 */
export function getTravelImage(query: string, width: number, height: number): string {
  const seed = query.toLowerCase().replace(/[^a-z0-9]/g, '') || 'travel';
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}
