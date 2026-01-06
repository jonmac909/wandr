'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { Base } from '@/types/itinerary';
import { HousingCard } from './HousingCard';

interface HousingSectionProps {
  bases?: Base[];
}

export function HousingSection({ bases }: HousingSectionProps) {
  if (!bases || bases.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3 text-sm">Accommodation</h3>
        <div className="grid grid-cols-2 gap-4">
          {bases.map((base) => (
            <HousingCard key={base.id} base={base} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
