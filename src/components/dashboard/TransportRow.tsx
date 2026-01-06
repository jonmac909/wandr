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
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      {/* Carrier icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Carrier name */}
      <div className="w-24 flex-shrink-0">
        <p className="font-medium text-sm truncate">
          {transport.carrier || transport.type.charAt(0).toUpperCase() + transport.type.slice(1)}
        </p>
      </div>

      {/* Departure */}
      <div className="text-center">
        <p className="text-lg font-bold">{transport.departureTime || '--:--'}</p>
        <p className="text-xs text-muted-foreground">{dateStr}</p>
        <p className="text-xs text-muted-foreground">{transport.from || 'Origin'}</p>
      </div>

      {/* Duration line */}
      <div className="flex-1 flex items-center gap-2 px-2">
        <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {durationStr}
          <br />
          <span className="text-muted-foreground/70">no transfers</span>
        </div>
        <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
      </div>

      {/* Arrival */}
      <div className="text-center">
        <p className="text-lg font-bold">{transport.arrivalTime || '--:--'}</p>
        <p className="text-xs text-muted-foreground">{dateStr}</p>
        <p className="text-xs text-muted-foreground">{transport.to || 'Destination'}</p>
      </div>

      {/* Status */}
      <Badge
        variant="outline"
        className={transport.isPaid
          ? "text-green-600 border-green-200 bg-green-50"
          : "text-amber-600 border-amber-200 bg-amber-50"
        }
      >
        {transport.isPaid ? 'Paid' : 'Payment on site'}
      </Badge>
    </div>
  );
}
