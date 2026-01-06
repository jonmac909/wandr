'use client';

import { MapPin, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BucketListItem {
  id: string;
  destination: string;
  country: string;
  emoji?: string;
}

interface BucketListProps {
  items?: BucketListItem[];
  maxItems?: number;
}

// Default bucket list items if none provided
const DEFAULT_ITEMS: BucketListItem[] = [
  { id: '1', destination: 'Kyoto', country: 'Japan', emoji: '🇯🇵' },
  { id: '2', destination: 'Santorini', country: 'Greece', emoji: '🇬🇷' },
  { id: '3', destination: 'Machu Picchu', country: 'Peru', emoji: '🇵🇪' },
  { id: '4', destination: 'Iceland', country: 'Iceland', emoji: '🇮🇸' },
];

export function BucketList({ items = DEFAULT_ITEMS, maxItems = 4 }: BucketListProps) {
  const displayItems = items.slice(0, maxItems);

  return (
    <Card className="flex-1">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Bucket List</h3>
          <button className="text-xs text-primary hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
        <div className="space-y-2">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            >
              <span className="text-base">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.destination}</p>
                <p className="text-[10px] text-muted-foreground">{item.country}</p>
              </div>
              <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
