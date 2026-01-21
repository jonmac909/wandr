import { NextResponse } from 'next/server';

// OSRM public API - free, no key needed
// Returns real walking/driving distance and time using OpenStreetMap road data

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromLat = searchParams.get('fromLat');
  const fromLng = searchParams.get('fromLng');
  const toLat = searchParams.get('toLat');
  const toLng = searchParams.get('toLng');
  const mode = searchParams.get('mode') || 'foot'; // foot, car, bike

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  try {
    // OSRM uses lng,lat order (opposite of Google)
    const profile = mode === 'car' ? 'driving' : mode === 'bike' ? 'cycling' : 'foot';
    const url = `https://router.project-osrm.org/route/v1/${profile}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Wandr Travel App' }
    });
    
    if (!res.ok) {
      throw new Error(`OSRM error: ${res.status}`);
    }
    
    const data = await res.json();
    
    if (data.code !== 'Ok' || !data.routes?.[0]) {
      // Fallback to Haversine if OSRM can't route (e.g., across water)
      const R = 6371000;
      const lat1 = parseFloat(fromLat) * Math.PI / 180;
      const lat2 = parseFloat(toLat) * Math.PI / 180;
      const dLat = (parseFloat(toLat) - parseFloat(fromLat)) * Math.PI / 180;
      const dLng = (parseFloat(toLng) - parseFloat(fromLng)) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const meters = Math.round(R * c);
      const minutes = Math.round(meters / 83); // ~5km/h walking
      
      return NextResponse.json({
        distance: meters,
        duration: minutes * 60,
        durationMinutes: minutes,
        distanceMiles: (meters / 1609.34).toFixed(2),
        source: 'haversine'
      });
    }
    
    const route = data.routes[0];
    const meters = Math.round(route.distance);
    const seconds = Math.round(route.duration);
    const minutes = Math.round(seconds / 60);
    
    return NextResponse.json({
      distance: meters,
      duration: seconds,
      durationMinutes: minutes,
      distanceMiles: (meters / 1609.34).toFixed(2),
      source: 'osrm'
    });
  } catch (error) {
    console.error('[RouteDistance] Error:', error);
    return NextResponse.json({ error: 'Failed to calculate route' }, { status: 500 });
  }
}
