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
    <section>
      <h3 className="font-semibold mb-3">Housing</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {bases.map((base) => (
          <HousingCard key={base.id} base={base} />
        ))}
      </div>
    </section>
  );
}
