// TSP Optimizer - Global TSP + Slicing algorithm (Roamy-style)

export interface Location {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
}

export interface Day {
  dayNumber: number;
  locationIds: string[];
}

export interface OptimizationResult {
  days: Day[];
  orderedLocations: Location[];
  metadata: {
    algorithm: string;
    totalLocations: number;
    locationsPerDay: number;
    feasibility: 'comfortable' | 'packed' | 'very_packed';
    totalDistance: number; // meters
  };
}

// Haversine distance in meters
export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Nearest neighbor TSP solver
// Starts from the first location and greedily picks the nearest unvisited location
export function solveTSP(locations: Location[]): Location[] {
  if (locations.length <= 1) return locations;

  const ordered: Location[] = [locations[0]];
  const remaining = new Set(locations.slice(1));

  while (remaining.size > 0) {
    const current = ordered[ordered.length - 1];
    let nearest: Location | null = null;
    let nearestDist = Infinity;

    for (const loc of remaining) {
      const dist = haversine(current.coordinates, loc.coordinates);
      if (dist < nearestDist) {
        nearest = loc;
        nearestDist = dist;
      }
    }

    if (nearest) {
      ordered.push(nearest);
      remaining.delete(nearest);
    }
  }

  return ordered;
}

// 2-opt improvement for TSP solution
// Tries to improve the route by reversing segments
export function improve2Opt(locations: Location[], maxIterations: number = 100): Location[] {
  if (locations.length <= 3) return locations;

  let route = [...locations];
  let improved = true;
  let iterations = 0;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < route.length - 2; i++) {
      for (let j = i + 2; j < route.length; j++) {
        // Calculate current distance
        const d1 = haversine(route[i].coordinates, route[i + 1].coordinates);
        const d2 = j + 1 < route.length
          ? haversine(route[j].coordinates, route[j + 1].coordinates)
          : 0;

        // Calculate new distance if we reverse the segment
        const d3 = haversine(route[i].coordinates, route[j].coordinates);
        const d4 = j + 1 < route.length
          ? haversine(route[i + 1].coordinates, route[j + 1].coordinates)
          : 0;

        // If improvement found, reverse the segment
        if (d3 + d4 < d1 + d2) {
          const newRoute = [
            ...route.slice(0, i + 1),
            ...route.slice(i + 1, j + 1).reverse(),
            ...route.slice(j + 1),
          ];
          route = newRoute;
          improved = true;
        }
      }
    }
  }

  return route;
}

// Slice ordered locations into days
// Distributes locations as evenly as possible across days
export function sliceIntoDays(orderedLocations: Location[], numberOfDays: number): Day[] {
  if (orderedLocations.length === 0 || numberOfDays <= 0) return [];

  const days: Day[] = [];
  const totalLocations = orderedLocations.length;
  const basePerDay = Math.floor(totalLocations / numberOfDays);
  const extraLocations = totalLocations % numberOfDays;

  let currentIndex = 0;

  for (let d = 0; d < numberOfDays; d++) {
    // First 'extraLocations' days get one extra location
    const locationsThisDay = basePerDay + (d < extraLocations ? 1 : 0);

    if (currentIndex < totalLocations) {
      const dayLocations = orderedLocations.slice(currentIndex, currentIndex + locationsThisDay);
      days.push({
        dayNumber: d + 1,
        locationIds: dayLocations.map((l) => l.id),
      });
      currentIndex += locationsThisDay;
    }
  }

  return days;
}

// Calculate total route distance
export function calculateTotalDistance(locations: Location[]): number {
  let total = 0;
  for (let i = 0; i < locations.length - 1; i++) {
    total += haversine(locations[i].coordinates, locations[i + 1].coordinates);
  }
  return Math.round(total);
}

// Main optimization function
export function optimizeTrip(
  locations: Location[],
  numberOfDays: number,
  startLocation?: { lat: number; lng: number }
): OptimizationResult {
  if (locations.length === 0) {
    return {
      days: [],
      orderedLocations: [],
      metadata: {
        algorithm: 'Global TSP + Slicing',
        totalLocations: 0,
        locationsPerDay: 0,
        feasibility: 'comfortable',
        totalDistance: 0,
      },
    };
  }

  // If start location provided, find nearest location to start from
  const sortedLocations = [...locations];
  if (startLocation) {
    sortedLocations.sort(
      (a, b) =>
        haversine(startLocation, a.coordinates) - haversine(startLocation, b.coordinates)
    );
  }

  // Run nearest-neighbor TSP
  let ordered = solveTSP(sortedLocations);

  // Improve with 2-opt (optional, for better routes)
  ordered = improve2Opt(ordered);

  // Slice into days
  const days = sliceIntoDays(ordered, numberOfDays);

  // Calculate metrics
  const totalDistance = calculateTotalDistance(ordered);
  const locationsPerDay = Math.ceil(locations.length / numberOfDays);

  let feasibility: 'comfortable' | 'packed' | 'very_packed';
  if (locationsPerDay <= 4) {
    feasibility = 'comfortable';
  } else if (locationsPerDay <= 6) {
    feasibility = 'packed';
  } else {
    feasibility = 'very_packed';
  }

  return {
    days,
    orderedLocations: ordered,
    metadata: {
      algorithm: 'Global TSP + Slicing',
      totalLocations: locations.length,
      locationsPerDay,
      feasibility,
      totalDistance,
    },
  };
}
