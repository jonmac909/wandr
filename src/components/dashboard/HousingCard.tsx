'use client';

import { Check } from 'lucide-react';
import type { Base } from '@/types/itinerary';
import { getAccommodationImage } from '@/lib/dashboard/image-utils';

interface HousingCardProps {
  base: Base;
}

export function HousingCard({ base }: HousingCardProps) {
  const name = base.accommodation?.name || base.location.split(',')[0];
  const imageUrl = getAccommodationImage(name, 120, 120);

  return (
    <div className="flex gap-2 group">
      {/* Square Photo with rounded corners */}
      <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Compact info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="font-medium text-xs truncate">{name}</h4>
        <p className="text-[10px] text-muted-foreground">{base.nights} nights</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Check className="w-3 h-3 text-green-600" />
          <span className="text-[10px] text-green-600 font-medium">Booked</span>
        </div>
      </div>
    </div>
  );
}
