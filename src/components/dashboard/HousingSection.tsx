'use client';

import { Calendar, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Base } from '@/types/itinerary';
import { getAccommodationImage } from '@/lib/dashboard/image-utils';

interface HousingSectionProps {
  bases?: Base[];
}

export function HousingSection({ bases }: HousingSectionProps) {
  if (!bases || bases.length === 0) {
    return null;
  }

  return (
    <Card className="flex-shrink-0 py-0">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Hotels</h3>
          <span className="text-sm text-primary cursor-pointer hover:underline">See all &gt;</span>
        </div>

        {/* Tourvisto-style large image cards */}
        <div className="grid grid-cols-3 gap-3">
          {bases.slice(0, 3).map((base) => {
            const name = base.accommodation?.name || base.location.split(',')[0];
            const location = base.location.split(',').slice(0, 2).join(',');
            const imageUrl = getAccommodationImage(name, 300, 200);

            return (
              <div key={base.id} className="group cursor-pointer">
                {/* Large rounded image */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted mb-2">
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {/* Text overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h4 className="font-semibold text-sm truncate">{name}</h4>
                    <p className="text-xs text-white/80 truncate">{location}</p>
                  </div>
                </div>
                {/* Stats below image */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{base.nights} nights</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>4.5</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
