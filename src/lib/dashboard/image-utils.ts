/**
 * Image utilities for dashboard components
 * Uses Google Places API via /api/city-image endpoint
 */

/**
 * Get a placeholder image URL for a destination
 * Components should use async fetch to /api/city-image for real images
 */
export function getDestinationImage(destination: string, _width?: number, _height?: number): string {
  // Return placeholder - components should fetch real image from API
  return `/api/placeholder/city/${encodeURIComponent(destination)}`;
}

/**
 * Get a placeholder image for accommodation
 */
export function getAccommodationImage(name: string, _width?: number, _height?: number): string {
  return `/api/placeholder/city/${encodeURIComponent(name)}`;
}

/**
 * Get a generic travel placeholder image
 */
export function getTravelImage(query: string, _width?: number, _height?: number): string {
  return `/api/placeholder/city/${encodeURIComponent(query || 'travel')}`;
}

/**
 * Async function to fetch real city image from Google Places
 */
export async function fetchDestinationImage(destination: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/city-image?city=${encodeURIComponent(destination)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.imageUrl || null;
  } catch {
    return null;
  }
}
