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
    <Card className="h-full py-0">
      <CardContent className="p-2 h-full">
        <h3 className="text-sm font-semibold mb-2">Transport</h3>
        <div className="space-y-0.5">
          {transport.map((t) => (
            <TransportRow key={t.id} transport={t} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
