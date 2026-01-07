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
    <Card className="flex-shrink-0 py-0">
      <CardContent className="p-2">
        <h3 className="font-medium mb-2 text-xs text-muted-foreground">Accommodation</h3>
        <div className="grid grid-cols-2 gap-3">
          {bases.map((base) => (
            <HousingCard key={base.id} base={base} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
