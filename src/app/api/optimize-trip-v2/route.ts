import { NextResponse } from 'next/server';
import { optimizeTrip, type Location } from '@/lib/planning/tsp-optimizer';

// POST /api/optimize-trip-v2
// Optimizes a trip using Global TSP + Slicing algorithm
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { input } = body;

    if (!input) {
      return NextResponse.json(
        { error: 'Missing input object' },
        { status: 400 }
      );
    }

    const {
      destination,
      destinationCoordinates,
      locations,
      numberOfDays,
    } = input;

    // Validate required fields
    if (!locations || !Array.isArray(locations)) {
      return NextResponse.json(
        { error: 'Missing or invalid locations array' },
        { status: 400 }
      );
    }

    if (!numberOfDays || numberOfDays < 1) {
      return NextResponse.json(
        { error: 'Missing or invalid numberOfDays' },
        { status: 400 }
      );
    }

    // Validate location objects
    const validLocations: Location[] = locations.filter(
      (loc: Location) =>
        loc.id &&
        loc.name &&
        loc.coordinates &&
        typeof loc.coordinates.lat === 'number' &&
        typeof loc.coordinates.lng === 'number'
    );

    if (validLocations.length === 0) {
      return NextResponse.json(
        { error: 'No valid locations provided' },
        { status: 400 }
      );
    }

    console.log(`[OptimizeTrip] Optimizing ${validLocations.length} locations for ${numberOfDays} days`);

    // Run TSP optimization
    const result = optimizeTrip(
      validLocations,
      numberOfDays,
      destinationCoordinates
    );

    console.log(`[OptimizeTrip] Result: ${result.days.length} days, ${result.metadata.totalDistance}m total`);

    return NextResponse.json({
      success: true,
      destination,
      days: result.days,
      orderedLocations: result.orderedLocations,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('[OptimizeTrip] Error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize trip' },
      { status: 500 }
    );
  }
}
