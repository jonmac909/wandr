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
      {/* Square image */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted mb-1.5">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-xs truncate">{name}</h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{base.nights} nights</span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
            <Check className="w-2.5 h-2.5" />
            Paid
          </span>
        </div>
      </div>
    </div>
  );
}
