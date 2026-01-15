import type { TripDNA } from '@/types/trip-dna';
import { addDaysToIso } from '@/lib/dates';

export type TransportMode = 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'other';

export interface CityAllocation {
  city: string;
  nights: number;
  startDay: number;
  endDay: number;
  startDate?: string;
  endDate?: string;
  transportToNext?: TransportMode;
}

// ============ RECOMMENDED NIGHTS PER CITY ============

const RECOMMENDED_NIGHTS: Record<string, number> = {
  // Japan
  Tokyo: 4, Kyoto: 3, Osaka: 2, Hakone: 2, Nara: 1, Hiroshima: 2, Fukuoka: 2, Nikko: 1,
  // Thailand
  Bangkok: 3, 'Chiang Mai': 3, 'Chiang Rai': 2, Phuket: 4, Krabi: 3,
  'Koh Samui': 4, 'Koh Phangan': 3, 'Koh Tao': 3, 'Koh Lanta': 3, 'Koh Phi Phi': 2,
  Sukhothai: 1, Ayutthaya: 1, Pai: 2, 'Hua Hin': 2, Kanchanaburi: 2,
  // Vietnam
  Hanoi: 3, 'Ho Chi Minh City': 3, 'Da Nang': 2, 'Hoi An': 3, Hue: 2,
  'Nha Trang': 3, 'Ha Long Bay': 2, 'Ninh Binh': 2, Sapa: 2,
  // Hawaii
  Honolulu: 4, Maui: 4, Kauai: 3, 'Big Island': 3,
  // Spain
  Barcelona: 4, Madrid: 3, Seville: 3, Valencia: 2, Granada: 2,
  'San Sebastian': 2, Bilbao: 2, Malaga: 2, Toledo: 1, Cordoba: 1,
  // Portugal
  Lisbon: 4, Porto: 3, Lagos: 3, Sintra: 1, Cascais: 1, Faro: 2,
  // France
  Paris: 4, Nice: 3, Lyon: 2, Marseille: 2,
  // Italy
  Rome: 4, Florence: 3, Venice: 2, Milan: 2, Naples: 2, Amalfi: 3,
  // Greece
  Athens: 3, Santorini: 3, Mykonos: 3,
  // Turkey
  Istanbul: 4, Cappadocia: 3, Antalya: 4,
};

const DEFAULT_NIGHTS = 2;

export { RECOMMENDED_NIGHTS, DEFAULT_NIGHTS };

// ============ DAY ALLOCATION ============

export function allocateDays(
  cities: string[],
  totalDays: number,
  tripDna: TripDNA | null | undefined,
  startDate?: string
): CityAllocation[] {
  if (cities.length === 0 || totalDays <= 0) return [];

  if (totalDays < cities.length) {
    const limitedCities = cities.slice(0, totalDays);
    return limitedCities.map((city, index) => {
      const startDay = index + 1;
      const endDay = startDay;
      const allocation: CityAllocation = {
        city,
        nights: 1,
        startDay,
        endDay,
      };

      if (startDate) {
        allocation.startDate = addDaysToIso(startDate, startDay - 1);
        allocation.endDate = addDaysToIso(startDate, endDay);
      }

      return allocation;
    });
  }

  const paceMultiplier = getPaceMultiplier(tripDna?.vibeAndPace?.tripPace || 'balanced');

  const baseAllocations = cities.map((city) => {
    const baseNights = RECOMMENDED_NIGHTS[city] || DEFAULT_NIGHTS;
    return {
      city,
      nights: Math.round(baseNights * paceMultiplier),
    };
  });

  const totalBaseNights = baseAllocations.reduce((sum, a) => sum + a.nights, 0);
  const scaleFactor = totalDays / totalBaseNights;
  const allocations = baseAllocations.map((a) => ({
    city: a.city,
    nights: Math.max(1, Math.round(a.nights * scaleFactor)),
  }));

  let currentTotal = allocations.reduce((sum, a) => sum + a.nights, 0);

  while (currentTotal !== totalDays) {
    if (currentTotal < totalDays) {
      const sortedByRecommended = [...allocations].sort(
        (a, b) => (RECOMMENDED_NIGHTS[b.city] || DEFAULT_NIGHTS) - (RECOMMENDED_NIGHTS[a.city] || DEFAULT_NIGHTS)
      );
      for (const alloc of sortedByRecommended) {
        if (currentTotal >= totalDays) break;
        alloc.nights += 1;
        currentTotal += 1;
      }
    } else {
      const sortedByRecommended = [...allocations].sort(
        (a, b) => (RECOMMENDED_NIGHTS[a.city] || DEFAULT_NIGHTS) - (RECOMMENDED_NIGHTS[b.city] || DEFAULT_NIGHTS)
      );
      for (const alloc of sortedByRecommended) {
        if (currentTotal <= totalDays) break;
        if (alloc.nights > 1) {
          alloc.nights -= 1;
          currentTotal -= 1;
        }
      }
    }
  }

  let currentDay = 1;

  return allocations.map((alloc) => {
    const startDayNum = currentDay;
    const endDayNum = currentDay + alloc.nights - 1;
    currentDay = endDayNum + 1;

    const allocation: CityAllocation = {
      city: alloc.city,
      nights: alloc.nights,
      startDay: startDayNum,
      endDay: endDayNum,
    };

    if (startDate) {
      allocation.startDate = addDaysToIso(startDate, startDayNum - 1);
      allocation.endDate = addDaysToIso(startDate, endDayNum);
    }

    return allocation;
  });
}

function getPaceMultiplier(pace: 'relaxed' | 'balanced' | 'fast'): number {
  switch (pace) {
    case 'relaxed':
      return 1.3;
    case 'fast':
      return 0.7;
    case 'balanced':
    default:
      return 1.0;
  }
}
