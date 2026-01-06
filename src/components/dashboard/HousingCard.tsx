'use client';

import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Base } from '@/types/itinerary';
import { getAccommodationImage } from '@/lib/dashboard/image-utils';

interface HousingCardProps {
  base: Base;
}

export function HousingCard({ base }: HousingCardProps) {
  const name = base.accommodation?.name || base.location.split(',')[0];
  const address = base.location;
  const imageUrl = getAccommodationImage(name, 160, 160);

  // Format dates
  const dateRange = formatDateRange(base.checkIn, base.checkOut);

  // Mock price (in real app, would come from accommodation data)
  const price = base.accommodation?.priceRange
    ? getPriceFromRange(base.accommodation.priceRange, base.nights)
    : null;

  return (
    <div className="flex gap-3 group">
      {/* Square Photo on LEFT */}
      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info on RIGHT */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h4 className="font-medium text-sm truncate">{name}</h4>
          <p className="text-xs text-muted-foreground truncate">{address}</p>
          <p className="text-xs text-muted-foreground">{dateRange}</p>
        </div>

        <div className="flex items-center gap-2">
          {price && (
            <span className="text-sm font-bold">{price}</span>
          )}
          <Badge variant="outline" className="gap-1 text-xs text-green-600 border-green-200 bg-green-50">
            <Check className="w-3 h-3" />
            Paid
          </Badge>
        </div>
      </div>
    </div>
  );
}

function formatDateRange(start: string, end: string): string {
  if (!start) return '';
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

  if (!endDate) {
    return startDate.toLocaleDateString('en-US', formatOptions);
  }

  // Same month and year - show as "18-20 July 2024"
  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    return `${startDate.getDate()}-${endDate.getDate()} ${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  }

  return `${startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-US', formatOptions)}`;
}

function getPriceFromRange(range: string, nights: number): string {
  const priceMap: Record<string, number> = {
    '$': 50,
    '$$': 120,
    '$$$': 250,
    '$$$$': 500,
  };
  const perNight = priceMap[range] || 100;
  const total = perNight * nights;
  return `€${total}`;
}
