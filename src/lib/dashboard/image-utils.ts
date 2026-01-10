/**
 * Image utilities for dashboard components
 *
 * Uses custom placeholder API for reliable images with destination names
 * This ensures consistent, relevant placeholders for each destination
 */

/**
 * Generate a placeholder image URL based on destination
 * Uses our custom placeholder API that shows city names with themed colors
 */
export function getDestinationImage(destination: string, width: number, height: number): string {
  return `/api/placeholder/city/${encodeURIComponent(destination)}`;
}

/**
 * Generate a hotel/accommodation placeholder image
 */
export function getAccommodationImage(name: string, width: number, height: number): string {
  return `/api/placeholder/city/${encodeURIComponent(name)}`;
}

/**
 * Generate a generic travel placeholder
 */
export function getTravelImage(query: string, width: number, height: number): string {
  return `/api/placeholder/city/${encodeURIComponent(query || 'Travel')}`;
}
