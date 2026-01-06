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
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      {/* Carrier icon */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Route info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-medium truncate">{transport.from || 'Origin'}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium truncate">{transport.to || 'Dest'}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{dateStr}</span>
          <span>·</span>
          <span>{durationStr}</span>
        </div>
      </div>

      {/* Status */}
      <Badge
        variant="outline"
        className={`flex-shrink-0 text-[10px] px-1.5 py-0 ${transport.isPaid
          ? "text-green-600 border-green-200 bg-green-50"
          : "text-amber-600 border-amber-200 bg-amber-50"
        }`}
      >
        {transport.isPaid ? 'Paid' : 'Pending'}
      </Badge>
    </div>
  );
}
