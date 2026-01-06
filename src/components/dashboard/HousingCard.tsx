'use client';

import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Base } from '@/types/itinerary';

interface HousingCardProps {
  base: Base;
}

export function HousingCard({ base }: HousingCardProps) {
  const name = base.accommodation?.name || base.location.split(',')[0];
  const address = base.location;
  const photoQuery = base.location.split(',')[0]?.trim().toLowerCase() || 'hotel';

  // Format dates
  const dateRange = formatDateRange(base.checkIn, base.checkOut);

  // Mock price (in real app, would come from accommodation data)
  const price = base.accommodation?.priceRange
    ? getPriceFromRange(base.accommodation.priceRange, base.nights)
    : null;

  return (
    <Card className="overflow-hidden hover:border-primary/30 transition-colors group">
      {/* Large Photo on top */}
      <div className="relative w-full h-28 overflow-hidden">
        <img
          src={`https://source.unsplash.com/400x300/?${encodeURIComponent(photoQuery)},hotel,accommodation`}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info below */}
      <CardContent className="p-3">
        <h4 className="font-semibold text-sm mb-1 line-clamp-1">{name}</h4>
        <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{address}</p>
        <p className="text-xs text-muted-foreground mb-2">{dateRange}</p>

        <div className="flex items-center justify-between">
          {price && (
            <span className="text-sm font-bold">{price}</span>
          )}
          <Badge variant="outline" className="gap-1 text-xs text-green-600 border-green-200 bg-green-50">
            <Check className="w-3 h-3" />
            Paid
          </Badge>
        </div>
      </CardContent>
    </Card>
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
