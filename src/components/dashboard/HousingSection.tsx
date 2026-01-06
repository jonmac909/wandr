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
        <h3 className="font-semibold mb-3 text-sm">Housing</h3>
        <div className="space-y-3">
          {bases.map((base) => (
            <HousingCard key={base.id} base={base} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
