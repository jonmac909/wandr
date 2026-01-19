/**
 * Image utilities for dashboard components
 *
 * Uses Pexels for high-quality travel images
 * Hash-based selection ensures consistent but varied images per destination
 */

// Curated Pexels travel images for variety
const TRAVEL_IMAGES = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];

const HOTEL_IMAGES = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];

// Simple hash function for consistent selection
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Generate a seeded image URL based on destination
 * Same destination always gets the same image
 */
export function getDestinationImage(destination: string, width: number, height: number): string {
  const hash = hashString(destination.toLowerCase());
  const image = TRAVEL_IMAGES[hash % TRAVEL_IMAGES.length];
  return `${image}?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`;
}

/**
 * Generate a hotel/accommodation image
 */
export function getAccommodationImage(name: string, width: number, height: number): string {
  const hash = hashString(name.toLowerCase());
  const image = HOTEL_IMAGES[hash % HOTEL_IMAGES.length];
  return `${image}?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`;
}

/**
 * Generate a generic travel image
 */
export function getTravelImage(query: string, width: number, height: number): string {
  const hash = hashString((query || 'travel').toLowerCase());
  const image = TRAVEL_IMAGES[hash % TRAVEL_IMAGES.length];
  return `${image}?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`;
}
