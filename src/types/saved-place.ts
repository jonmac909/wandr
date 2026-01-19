// Saved place for Explore feature - user's collection of discovered places

export interface SavedPlace {
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'cafe' | 'activity' | 'nightlife' | 'hotel';

  // Location
  city: string;
  neighborhood?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };

  // Details (optional, may be sparse for user-added)
  description?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: '$' | '$$' | '$$$' | '$$$$' | string;
  tags?: string[];

  // Source tracking
  source: 'browse' | 'link' | 'manual' | 'google';
  sourceUrl?: string;  // Original TikTok/Instagram/blog URL

  // Meta
  savedAt: string;     // ISO date
  notes?: string;      // User notes
}

// For displaying in lists/cards
export type PlaceCategory = SavedPlace['type'] | 'all';

// Place from AI recommendations (before being saved)
export interface BrowsePlace {
  id: string;
  name: string;
  type: SavedPlace['type'];
  city: string;
  neighborhood?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  description?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  tags?: string[];
  // Whether user has saved this place
  isSaved?: boolean;
}
