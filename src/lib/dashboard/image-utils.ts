/**
 * Image utilities for dashboard components
 *
 * Uses Pexels for high-quality travel images
 * Hash-based selection ensures consistent but varied images per destination
 */

// Curated Pexels travel images for variety
const TRAVEL_IMAGES = [
  'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg',
  'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg',
  'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg',
  'https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg',
  'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg',
  'https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg',
  'https://images.pexels.com/photos/2104152/pexels-photo-2104152.jpeg',
  'https://images.pexels.com/photos/2440061/pexels-photo-2440061.jpeg',
  'https://images.pexels.com/photos/2559941/pexels-photo-2559941.jpeg',
  'https://images.pexels.com/photos/2389474/pexels-photo-2389474.jpeg',
  'https://images.pexels.com/photos/2245436/pexels-photo-2245436.jpeg',
  'https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg',
];

const HOTEL_IMAGES = [
  'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg',
  'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg',
  'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
  'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg',
  'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
  'https://images.pexels.com/photos/2507010/pexels-photo-2507010.jpeg',
  'https://images.pexels.com/photos/2869215/pexels-photo-2869215.jpeg',
  'https://images.pexels.com/photos/2096983/pexels-photo-2096983.jpeg',
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
