'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { TripStats } from '@/hooks/useTripStats';

interface CountryBreakdownProps {
  countries: TripStats['countryBreakdown'];
  maxCountries?: number;
}

// Country code to flag emoji mapping
const FLAGS: Record<string, string> = {
  CA: '🇨🇦',
  US: '🇺🇸',
  ES: '🇪🇸',
  IT: '🇮🇹',
  VN: '🇻🇳',
  DE: '🇩🇪',
  NO: '🇳🇴',
  FR: '🇫🇷',
  GB: '🇬🇧',
  JP: '🇯🇵',
  TH: '🇹🇭',
  MX: '🇲🇽',
  AU: '🇦🇺',
  NZ: '🇳🇿',
  PT: '🇵🇹',
  GR: '🇬🇷',
  NL: '🇳🇱',
  BE: '🇧🇪',
  CH: '🇨🇭',
  AT: '🇦🇹',
  KR: '🇰🇷',
  SG: '🇸🇬',
  MY: '🇲🇾',
  ID: '🇮🇩',
  PH: '🇵🇭',
  IN: '🇮🇳',
  AE: '🇦🇪',
  EG: '🇪🇬',
  ZA: '🇿🇦',
  BR: '🇧🇷',
  AR: '🇦🇷',
};

export function CountryBreakdown({ countries, maxCountries = 5 }: CountryBreakdownProps) {
  if (!countries || countries.length === 0) {
    return null;
  }

  const displayCountries = countries.slice(0, maxCountries);

  return (
    <Card>
      <CardContent className="p-3">
        <div className="space-y-2">
          {displayCountries.map((country) => (
            <Link
              key={country.code}
              href={`/trips?country=${country.code}`}
              className="flex items-center justify-between py-1.5 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{FLAGS[country.code] || '🏳️'}</span>
                <span className="text-sm font-medium">{country.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{country.count}</span>
                <span className="text-xs text-primary flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Trips
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
