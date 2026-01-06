'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { ExtractedTransport } from '@/lib/dashboard/transport-extractor';
import { TransportRow } from './TransportRow';

interface TransportSectionProps {
  transport: ExtractedTransport[];
}

export function TransportSection({ transport }: TransportSectionProps) {
  if (!transport || transport.length === 0) {
    return null;
  }

  return (
    <Card className="flex-shrink-0">
      <CardContent className="p-4 pb-3">
        <h3 className="font-semibold mb-2 text-sm">Transport</h3>
        <div className="space-y-1">
          {transport.map((t) => (
            <TransportRow key={t.id} transport={t} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
