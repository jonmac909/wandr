'use client';

import { Plane, Train, Bus, Car, Ship } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ExtractedTransport } from '@/lib/dashboard/transport-extractor';

interface TransportRowProps {
  transport: ExtractedTransport;
}

const TRANSPORT_ICONS = {
  flight: Plane,
  train: Train,
  bus: Bus,
  car: Car,
  ferry: Ship,
  other: Car,
};

const TRANSPORT_COLORS = {
  flight: 'bg-blue-100 text-blue-700',
  train: 'bg-orange-100 text-orange-700',
  bus: 'bg-green-100 text-green-700',
  car: 'bg-purple-100 text-purple-700',
  ferry: 'bg-cyan-100 text-cyan-700',
  other: 'bg-gray-100 text-gray-700',
};

export function TransportRow({ transport }: TransportRowProps) {
  const Icon = TRANSPORT_ICONS[transport.type] || Car;
  const colorClass = TRANSPORT_COLORS[transport.type] || TRANSPORT_COLORS.other;

  // Format duration
  const hours = Math.floor(transport.duration / 60);
  const minutes = transport.duration % 60;
  const durationStr = hours > 0
    ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
    : `${minutes}m`;

  // Format date
  const dateStr = new Date(transport.date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="flex items-center gap-3 py-2 first:pt-0 last:pb-0 hover:bg-muted/50 transition-colors rounded-lg">
      {/* Carrier icon and name */}
      <div className="flex items-center gap-3 w-28 flex-shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium truncate">
          {transport.carrier || transport.type.charAt(0).toUpperCase() + transport.type.slice(1)}
        </span>
      </div>

      {/* Departure */}
      <div className="text-center min-w-[70px]">
        <p className="text-lg font-bold">{transport.departureTime || '--:--'}</p>
        <p className="text-xs text-muted-foreground">{dateStr}</p>
        <p className="text-xs text-muted-foreground truncate">{transport.from || 'Origin'}</p>
      </div>

      {/* Duration line */}
      <div className="flex-1 flex items-center gap-2 px-2">
        <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
        <div className="text-xs text-muted-foreground text-center whitespace-nowrap">
          <div>{durationStr}</div>
          <div className="text-muted-foreground/70">no transfers</div>
        </div>
        <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
      </div>

      {/* Arrival */}
      <div className="text-center min-w-[70px]">
        <p className="text-lg font-bold">{transport.arrivalTime || '--:--'}</p>
        <p className="text-xs text-muted-foreground">{dateStr}</p>
        <p className="text-xs text-muted-foreground truncate">{transport.to || 'Destination'}</p>
      </div>

      {/* Status */}
      <Badge
        variant="outline"
        className={`flex-shrink-0 ${transport.isPaid
          ? "text-green-600 border-green-200 bg-green-50"
          : "text-amber-600 border-amber-200 bg-amber-50"
        }`}
      >
        {transport.isPaid ? 'Paid' : 'Payment on site'}
      </Badge>
    </div>
  );
}
