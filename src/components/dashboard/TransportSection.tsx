'use client';

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
    <section>
      <h3 className="font-semibold mb-3">Transport</h3>
      <div className="bg-card rounded-lg border divide-y">
        {transport.map((t) => (
          <TransportRow key={t.id} transport={t} />
        ))}
      </div>
    </section>
  );
}
