// Google Polyline Encoding/Decoding
// Reference: https://developers.google.com/maps/documentation/utilities/polylinealgorithm

// Encode a signed number for polyline
function encodeSignedNumber(num: number): string {
  let n = num << 1;
  if (num < 0) {
    n = ~n;
  }
  return encodeNumber(n);
}

// Encode an unsigned number for polyline
function encodeNumber(num: number): string {
  let n = num;
  let encoded = '';
  while (n >= 0x20) {
    encoded += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
    n >>= 5;
  }
  encoded += String.fromCharCode(n + 63);
  return encoded;
}

// Encode coordinates to Google polyline format
// Input: Array of [lat, lng] tuples
export function encodePolyline(coordinates: [number, number][]): string {
  if (coordinates.length === 0) return '';

  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const [lat, lng] of coordinates) {
    const latInt = Math.round(lat * 1e5);
    const lngInt = Math.round(lng * 1e5);

    encoded += encodeSignedNumber(latInt - prevLat);
    encoded += encodeSignedNumber(lngInt - prevLng);

    prevLat = latInt;
    prevLng = lngInt;
  }

  return encoded;
}

// Decode Google polyline to coordinates
// Output: Array of [lat, lng] tuples
export function decodePolyline(encoded: string): [number, number][] {
  if (!encoded || encoded.length === 0) return [];

  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    // Decode longitude
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

// Simplify polyline by removing points that are too close together
// Useful for reducing data size while maintaining visual accuracy
export function simplifyPolyline(
  coordinates: [number, number][],
  tolerance: number = 0.00001 // ~1 meter
): [number, number][] {
  if (coordinates.length <= 2) return coordinates;

  const simplified: [number, number][] = [coordinates[0]];
  let lastPoint = coordinates[0];

  for (let i = 1; i < coordinates.length - 1; i++) {
    const point = coordinates[i];
    const distance = Math.sqrt(
      Math.pow(point[0] - lastPoint[0], 2) + Math.pow(point[1] - lastPoint[1], 2)
    );

    if (distance >= tolerance) {
      simplified.push(point);
      lastPoint = point;
    }
  }

  // Always include the last point
  simplified.push(coordinates[coordinates.length - 1]);

  return simplified;
}

// Convert polyline to Leaflet-compatible format [lat, lng][]
export function polylineToLeaflet(encoded: string): [number, number][] {
  return decodePolyline(encoded);
}
