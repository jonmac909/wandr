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
  const checkIn = formatDate(base.checkIn);
  const checkOut = formatDate(base.checkOut);
  const dateRange = checkIn && checkOut ? `${checkIn} - ${checkOut}` : '';

  // Mock price (in real app, would come from accommodation data)
  const price = base.accommodation?.priceRange
    ? getPriceFromRange(base.accommodation.priceRange, base.nights)
    : null;

  return (
    <Card className="overflow-hidden hover:border-primary/30 transition-colors">
      <div className="flex">
        {/* Thumbnail */}
        <div className="w-16 h-16 flex-shrink-0 overflow-hidden">
          <img
            src={`https://source.unsplash.com/150x150/?${encodeURIComponent(photoQuery)},hotel,accommodation`}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <CardContent className="flex-1 p-2">
          <h4 className="font-semibold text-xs mb-0.5 line-clamp-1">{name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1">{dateRange}</p>

          <div className="flex items-center gap-1.5 mt-1">
            {price && (
              <span className="text-xs font-semibold">{price}</span>
            )}
            <Badge variant="outline" className="gap-0.5 text-[10px] px-1.5 py-0 text-green-600 border-green-200 bg-green-50">
              <Check className="w-2.5 h-2.5" />
              Paid
            </Badge>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
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
