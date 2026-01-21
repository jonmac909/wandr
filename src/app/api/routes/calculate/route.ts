import { NextResponse } from 'next/server';

// Route interface matching Roamy spec
export interface Route {
  fromLocationId: string;
  toLocationId: string;
  polyline: string; // Google encoded polyline format
  distance: number; // meters
  travelTime: number; // seconds
  transportType: 'automobile' | 'walking';
}

interface LocationInput {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
}

// Calculate route between two points using OSRM
async function calculateOSRMRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  transportType: 'automobile' | 'walking'
): Promise<{ polyline: string; distance: number; duration: number } | null> {
  try {
    const profile = transportType === 'walking' ? 'foot' : 'driving';
    const url = `https://router.project-osrm.org/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=polyline`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Wandr Travel App' },
    });

    if (!response.ok) {
      console.error(`[Routes] OSRM error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes?.[0]) {
      return null;
    }

    const route = data.routes[0];
    return {
      polyline: route.geometry,
      distance: Math.round(route.distance),
      duration: Math.round(route.duration),
    };
  } catch (error) {
    console.error('[Routes] OSRM fetch error:', error);
    return null;
  }
}

// Fallback: create a simple straight-line "route" using Haversine
function createFallbackRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  transportType: 'automobile' | 'walking'
): { polyline: string; distance: number; duration: number } {
  // Haversine distance
  const R = 6371000;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

  // Estimated duration (walking: 5km/h, driving: 50km/h average)
  const speedMs = transportType === 'walking' ? 1.4 : 13.9;
  const duration = Math.round(distance / speedMs);

  // Simple 2-point polyline encoding (just start and end)
  const encodeNumber = (num: number): string => {
    let n = num << 1;
    if (num < 0) n = ~n;
    let encoded = '';
    while (n >= 0x20) {
      encoded += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
      n >>= 5;
    }
    encoded += String.fromCharCode(n + 63);
    return encoded;
  };

  const lat1Int = Math.round(from.lat * 1e5);
  const lng1Int = Math.round(from.lng * 1e5);
  const lat2Int = Math.round(to.lat * 1e5);
  const lng2Int = Math.round(to.lng * 1e5);

  const polyline =
    encodeNumber(lat1Int) +
    encodeNumber(lng1Int) +
    encodeNumber(lat2Int - lat1Int) +
    encodeNumber(lng2Int - lng1Int);

  return { polyline, distance, duration };
}

// POST /api/routes/calculate
// Calculates routes between consecutive locations
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { locations, transportType = 'automobile' } = body;

    if (!locations || !Array.isArray(locations) || locations.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 locations to calculate routes' },
        { status: 400 }
      );
    }

    const validTransport = transportType === 'walking' ? 'walking' : 'automobile';

    console.log(`[Routes] Calculating ${locations.length - 1} routes (${validTransport})`);

    const routes: Route[] = [];

    // Calculate route between consecutive locations
    for (let i = 0; i < locations.length - 1; i++) {
      const from = locations[i] as LocationInput;
      const to = locations[i + 1] as LocationInput;

      if (!from.coordinates || !to.coordinates) {
        console.warn(`[Routes] Missing coordinates for ${from.id} or ${to.id}`);
        continue;
      }

      // Try OSRM first
      let routeData = await calculateOSRMRoute(
        from.coordinates,
        to.coordinates,
        validTransport
      );

      // Fallback to straight line if OSRM fails
      if (!routeData) {
        console.log(`[Routes] OSRM failed for ${from.name} → ${to.name}, using fallback`);
        routeData = createFallbackRoute(
          from.coordinates,
          to.coordinates,
          validTransport
        );
      }

      routes.push({
        fromLocationId: from.id,
        toLocationId: to.id,
        polyline: routeData.polyline,
        distance: routeData.distance,
        travelTime: routeData.duration,
        transportType: validTransport,
      });
    }

    // Calculate totals
    const totalDistance = routes.reduce((sum, r) => sum + r.distance, 0);
    const totalTime = routes.reduce((sum, r) => sum + r.travelTime, 0);

    return NextResponse.json({
      success: true,
      routes,
      summary: {
        totalRoutes: routes.length,
        totalDistance, // meters
        totalDistanceKm: (totalDistance / 1000).toFixed(1),
        totalTime, // seconds
        totalTimeMinutes: Math.round(totalTime / 60),
        transportType: validTransport,
      },
    });
  } catch (error) {
    console.error('[Routes] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate routes' },
      { status: 500 }
    );
  }
}
