import { NextRequest, NextResponse } from 'next/server';
import { supabaseStorage } from '@/lib/db/supabase';

// Use server-side env var, fallback to NEXT_PUBLIC_ for backwards compatibility
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const PLACE_IMAGES_BUCKET = 'place-images';

// In-memory cache for very hot paths (cleared on deploy)
const photoCache = new Map<string, string>();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const photoRef = searchParams.get('ref'); // Google Places photo reference (e.g., places/xxx/photos/yyy)
  const maxWidth = searchParams.get('maxWidth') || '600';
  const maxHeight = searchParams.get('maxHeight') || '400';

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

  // Check Supabase storage cache
  const publicUrl = supabaseStorage.getPublicUrl(PLACE_IMAGES_BUCKET, storagePath);
  if (publicUrl) {
    try {
      const checkResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (checkResponse.ok) {
        photoCache.set(safeFilename, publicUrl);
        return NextResponse.redirect(publicUrl, { status: 302 });
      }
    } catch {
      // File doesn't exist, continue to fetch from Google
    }
  }

  // Fetch from Google Places API
  if (!GOOGLE_API_KEY) {
    console.error('[places/photo] Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
    return NextResponse.json({
      error: 'Google Maps API key not configured',
      hint: 'Set GOOGLE_MAPS_API_KEY in Cloudflare environment variables'
    }, { status: 500 });
  }

  try {
    const googlePhotoUrl = `https://places.googleapis.com/v1/${photoRef}/media?maxHeightPx=${maxHeight}&maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;

    const photoResponse = await fetch(googlePhotoUrl);

    if (!photoResponse.ok) {
      const errorText = await photoResponse.text();
      console.error(`[places/photo] Google API error: ${photoResponse.status} - ${errorText}`);
      return NextResponse.json({
        error: 'Failed to fetch photo from Google Places',
        status: photoResponse.status,
        apiKeyConfigured: !!GOOGLE_API_KEY,
        photoRef: photoRef.substring(0, 50) + '...',
      }, { status: photoResponse.status });
    }

    const imageBuffer = await photoResponse.arrayBuffer();
    const contentType = photoResponse.headers.get('content-type') || 'image/jpeg';

    // Upload to Supabase storage for caching
    const uploadedUrl = await supabaseStorage.uploadImage(
      PLACE_IMAGES_BUCKET,
      storagePath,
      imageBuffer,
      contentType
    );

    if (uploadedUrl) {
      photoCache.set(safeFilename, uploadedUrl);
      return NextResponse.redirect(uploadedUrl, { status: 302 });
    }

    // Return the image directly if Supabase upload fails
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching photo from Google Places:', error);
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 });
  }
}
