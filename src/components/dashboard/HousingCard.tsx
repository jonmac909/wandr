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
    <div className="flex items-center gap-2 group">
      {/* Tiny square thumbnail */}
      <div className="relative w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-[11px] truncate">{name}</h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{base.nights} nights</span>
          <span className="inline-flex items-center gap-0.5 px-1 py-0 rounded-full text-[9px] font-medium bg-green-100 text-green-700">
            <Check className="w-2 h-2" />
            Paid
          </span>
        </div>
      </div>
    </div>
  );
}
