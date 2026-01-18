import { NextRequest, NextResponse } from 'next/server';
import { supabaseStorage } from '@/lib/db/supabase';

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const PLACE_IMAGES_BUCKET = 'place-images';

// In-memory cache for very hot paths (cleared on deploy)
const photoCache = new Map<string, string>();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const photoRef = searchParams.get('ref'); // Google Places photo reference (e.g., places/xxx/photos/yyy)
  const maxWidth = searchParams.get('maxWidth') || '400';
  const maxHeight = searchParams.get('maxHeight') || '300';

  if (!photoRef) {
    return NextResponse.json({ error: 'Photo reference required' }, { status: 400 });
  }

  // Create a safe filename from the photo reference
  const safeFilename = photoRef.replace(/[^a-zA-Z0-9]/g, '_') + '.jpg';
  const storagePath = `photos/${safeFilename}`;

  // Check in-memory cache first (fastest)
  if (photoCache.has(safeFilename)) {
    const cachedUrl = photoCache.get(safeFilename)!;
    return NextResponse.redirect(cachedUrl, { status: 302 });
  }

  // Check Supabase storage
  const publicUrl = supabaseStorage.getPublicUrl(PLACE_IMAGES_BUCKET, storagePath);
  if (publicUrl) {
    // Try to check if it exists by attempting to fetch headers
    try {
      const checkResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (checkResponse.ok) {
        // Cache in memory for hot path
        photoCache.set(safeFilename, publicUrl);
        return NextResponse.redirect(publicUrl, { status: 302 });
      }
    } catch {
      // File doesn't exist, continue to fetch from Google
    }
  }

  // Not in cache, fetch from Google Places API
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
  }

  try {
    const googlePhotoUrl = `https://places.googleapis.com/v1/${photoRef}/media?maxHeightPx=${maxHeight}&maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;

    const photoResponse = await fetch(googlePhotoUrl);

    if (!photoResponse.ok) {
      console.error('Google Places photo API error:', photoResponse.status);
      return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 });
    }

    const imageBuffer = await photoResponse.arrayBuffer();
    const contentType = photoResponse.headers.get('content-type') || 'image/jpeg';

    // Upload to Supabase storage
    const uploadedUrl = await supabaseStorage.uploadImage(
      PLACE_IMAGES_BUCKET,
      storagePath,
      imageBuffer,
      contentType
    );

    if (uploadedUrl) {
      // Cache in memory
      photoCache.set(safeFilename, uploadedUrl);
      return NextResponse.redirect(uploadedUrl, { status: 302 });
    }

    // Fallback: return the image directly if Supabase upload fails
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error fetching/caching photo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
