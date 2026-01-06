'use client';

import { Check } from 'lucide-react';
import type { Base } from '@/types/itinerary';
import { getAccommodationImage } from '@/lib/dashboard/image-utils';

interface HousingCardProps {
  base: Base;
}

export function HousingCard({ base }: HousingCardProps) {
  const name = base.accommodation?.name || base.location.split(',')[0];
  const location = base.location;
  const imageUrl = getAccommodationImage(name, 200, 120);

  // Format price if available
  const price = base.accommodation?.priceRange || null;

  return (
    <div className="flex flex-col group">
      {/* Landscape image */}
      <div className="relative w-full h-24 rounded-lg overflow-hidden bg-muted mb-2">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm truncate">{name}</h4>
        <p className="text-xs text-muted-foreground truncate">{location}</p>
        <p className="text-xs text-muted-foreground mt-1">{base.nights} nights</p>

        {/* Price and status */}
        <div className="flex items-center gap-2 mt-2">
          {price && <span className="text-sm font-medium">{price}</span>}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <Check className="w-3 h-3" />
            Paid
          </span>
        </div>
      </div>
    </div>
  );
}
