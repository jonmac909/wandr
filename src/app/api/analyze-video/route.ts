import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const RAILWAY_API_URL = 'https://wandr-production.up.railway.app';

// Gemini prompt for location extraction  
const LOCATION_EXTRACTION_PROMPT = `You are extracting specific place names from a TikTok about travel/food/places.

IMPORTANT: Extract places from BOTH:
1. The video caption/description text I provide below (look for place names, restaurants, attractions)
2. Any text visible in the images (overlays, signage, landmarks)

Common caption patterns to look for:
- Bullet points: "• Place Name - description"
- Numbered lists: "1. Place Name"
- Location mentions: "at Place Name" or "visit Place Name"

For each location found, provide:
- name: Exact place name (e.g. "Rainy's cooking class", "Sticky Waterfalls", "Wat Phra Singh")
- type: restaurant/hotel/cafe/bar/beach/attraction/shop/activity
- city: City (infer from context, hashtags, or content)
- country: Country (infer from context)
- description: Brief description from the content
- tips: Array of tips if mentioned

Return ONLY a valid JSON array:
[{"name":"...","type":"...","city":"...","country":"...","description":"...","tips":[]}]

Return [] only if truly no places are mentioned.`;

// Extract places from caption text (fallback when Gemini fails)
function extractPlacesFromCaption(caption: string): Array<{
  name: string;
  type: string;
  city: string;
  country: string;
  description: string;
  tips: string[];
}> {
  const places: Array<{ name: string; type: string; city: string; country: string; description: string; tips: string[] }> = [];
  
  // Pattern 1: Bullet points "• Place Name - description"
  const bulletMatches = caption.matchAll(/•\s*([A-Za-z][A-Za-z\s'\u2018\u2019&]{2,40})(?:\s*[-–—]|[🥘💧🐐🏮🛕💅✨🌴🍜🎉])/g);
  for (const match of bulletMatches) {
    const name = match[1].trim();
    if (name.length >= 3 && !/^(the|a|an|beauty|temple|food|restaurant)$/i.test(name)) {
      places.push({ name, type: 'attraction', city: '', country: '', description: '', tips: [] });
    }
  }
  
  // Pattern 2: "Name (Michelin info) 📍" format
  if (caption.includes('📍')) {
    const segments = caption.split('📍');
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const match = i === 0
        ? seg.match(/([A-Z][A-Za-z\s'\u2018\u2019&]{2,40})\s*\([^)]*(?:Michelin|Star|Guide)[^)]*\)\s*$/i)
        : seg.match(/(?:Thailand|Singapore|Japan)\s+([A-Z][A-Za-z\s'\u2018\u2019&]{2,40})\s*\([^)]*(?:Michelin|Star|Guide)[^)]*\)\s*$/i);
      if (match) {
        places.push({ name: match[1].trim(), type: 'restaurant', city: '', country: '', description: '', tips: [] });
      }
    }
  }
  
  // Detect city from hashtags or content
  const cityMatch = caption.match(/#?(chiangmai|bangkok|phuket|tokyo|kyoto|singapore|bali)/i);
  const city = cityMatch ? cityMatch[1] : '';
  const country = city ? 'Thailand' : ''; // Simplified
  
  // Update city/country for all places
  for (const place of places) {
    place.city = city;
    place.country = country;
  }
  
  console.log('[Caption] Extracted', places.length, 'places:', places.map(p => p.name));
  return places;
}

// Resolve TikTok short URL to full URL
async function resolveTikTokUrl(url: string): Promise<{ fullUrl: string; isPhoto: boolean }> {
  if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
    console.log('[TikTok] Resolving short URL:', url);
    const response = await fetch(url, { 
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    const fullUrl = response.url;
    console.log('[TikTok] Resolved to:', fullUrl);
    const isPhoto = fullUrl.includes('/photo/');
    return { fullUrl, isPhoto };
  }
  return { fullUrl: url, isPhoto: url.includes('/photo/') };
}

// Get TikTok info via oEmbed (caption + thumbnail)
async function getTikTokOEmbed(url: string): Promise<{ caption: string; thumbnail: string; isPhoto: boolean } | null> {
  try {
    const { fullUrl, isPhoto } = await resolveTikTokUrl(url);
    // For oEmbed, use /video/ URL even for photo posts
    const oembedTargetUrl = isPhoto ? fullUrl.replace('/photo/', '/video/') : fullUrl;
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(oembedTargetUrl)}`;
    console.log('[TikTok] Calling oEmbed...');
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        caption: data.title || '',
        thumbnail: data.thumbnail_url || '',
        isPhoto,
      };
    }
  } catch (e) {
    console.error('[TikTok] oEmbed failed:', e);
  }
  return null;
}

// Extract frames using Railway service (has yt-dlp installed)
async function extractFramesViaRailway(url: string): Promise<{
  frames: string[];
  ocrText: string[];
} | null> {
  try {
    console.log('[Railway] Extracting frames from:', url);
    const response = await fetch(`${RAILWAY_API_URL}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        interval_seconds: 1,
        max_frames: 30,
      }),
    });
    
    if (!response.ok) {
      console.error('[Railway] Extract failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    if (!data.success) {
      console.error('[Railway] Extract error:', data.error);
      return null;
    }
    
    console.log('[Railway] Got', data.frames?.length || 0, 'frames');
    return {
      frames: (data.frames || []).map((f: { base64: string }) => f.base64),
      ocrText: data.all_text || [],
    };
  } catch (error) {
    console.error('[Railway] Error:', error);
    return null;
  }
}

// Analyze frames with Google Gemini
async function analyzeFramesWithGemini(
  frames: string[], 
  caption: string
): Promise<Array<{
  name: string;
  type: string;
  city: string;
  country: string;
  description: string;
  tips: string[];
}>> {
  if (!GOOGLE_AI_API_KEY) {
    console.error('[Gemini] GOOGLE_AI_API_KEY not configured');
    return [];
  }
  
  if (frames.length === 0) {
    console.error('[Gemini] No frames to analyze');
    return [];
  }
  
  try {
    console.log('[Gemini] Analyzing', frames.length, 'frames with Gemini 1.5 Flash...');
    console.log('[Gemini] First frame size:', frames[0]?.length || 0, 'chars');
    
    const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Build content with frames as images
    const content: Array<{ inlineData: { mimeType: string; data: string } } | string> = [];
    
    // Add prompt with caption context FIRST
    const prompt = caption 
      ? `${LOCATION_EXTRACTION_PROMPT}\n\nVideo caption/description for additional context:\n"${caption}"\n\nNow analyze the following images:`
      : `${LOCATION_EXTRACTION_PROMPT}\n\nAnalyze the following images:`;
    content.push(prompt);
    
    // Add up to 10 frames
    const selectedFrames = frames.slice(0, 10);
    for (const frame of selectedFrames) {
      content.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: frame,
        },
      });
    }
    
    console.log('[Gemini] Sending request with', content.length, 'parts...');
    const result = await model.generateContent(content);
    const responseText = result.response.text();
    console.log('[Gemini] Raw response:', responseText);
    
    // Parse JSON from response
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.includes('```json')) {
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.replace(/```\s*/g, '');
    }
    
    jsonText = jsonText.trim();
    console.log('[Gemini] JSON to parse:', jsonText);
    
    if (!jsonText || jsonText === '[]') {
      console.log('[Gemini] Empty response or no locations');
      return [];
    }
    
    const locations = JSON.parse(jsonText);
    console.log('[Gemini] Extracted', locations.length, 'locations:', locations);
    return Array.isArray(locations) ? locations : [];
  } catch (error) {
    console.error('[Gemini] Analysis failed:', error);
    return [];
  }
}

// Look up place via Google Places API
async function lookupPlace(
  name: string, 
  city: string, 
  country: string,
  geminiData: { description: string; tips: string[]; type: string }
): Promise<{
  id: string;
  name: string;
  description: string;
  descriptionSource: string;
  notes: Array<{ platform: string; text: string; addedAt: string }>;
  coordinates: { lat: number; lng: number };
  address: string;
  city: string;
  country: string;
  category: string;
  rating?: number;
  website?: string;
  imageUrl?: string;
} | null> {
  if (!GOOGLE_API_KEY) return null;
  
  try {
    const query = `${name} ${city} ${country}`;
    console.log('[Places] Searching for:', query);
    
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?` +
      `input=${encodeURIComponent(query)}&inputtype=textquery` +
      `&fields=place_id,name,formatted_address,geometry&key=${GOOGLE_API_KEY}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.candidates?.length) {
      console.log('[Places] No results for:', query);
      return null;
    }
    
    const placeId = searchData.candidates[0].place_id;
    
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${placeId}&fields=place_id,name,formatted_address,geometry,rating,photos,types` +
      `&key=${GOOGLE_API_KEY}`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    
    if (!detailsData.result) return null;
    
    const place = detailsData.result;
    
    let imageUrl: string | undefined;
    if (place.photos?.[0]) {
      imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`;
    }
    
    const addressParts = (place.formatted_address || '').split(',');
    const extractedCity = addressParts.length >= 2 ? addressParts[addressParts.length - 2].trim() : city;
    
    let category = geminiData.type || 'attraction';
    const types = place.types || [];
    if (types.includes('restaurant') || types.includes('food')) category = 'restaurant';
    else if (types.includes('cafe')) category = 'cafe';
    else if (types.includes('bar') || types.includes('night_club')) category = 'nightlife';
    else if (types.includes('lodging')) category = 'hotel';
    
    const notes = (geminiData.tips || []).map(tip => ({
      platform: 'gemini_analyzer',
      text: tip,
      addedAt: new Date().toISOString(),
    }));
    
    return {
      id: placeId,
      name: place.name,
      description: geminiData.description,
      descriptionSource: 'gemini_analyzer',
      notes,
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      address: place.formatted_address,
      city: extractedCity,
      country,
      category,
      rating: place.rating,
      imageUrl,
    };
  } catch (error) {
    console.error('[Places] Lookup failed:', error);
    return null;
  }
}

// Download image and convert to base64
async function downloadImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }
    
    if (!url.includes('tiktok.com')) {
      return NextResponse.json({ success: false, error: 'Please provide a TikTok URL' }, { status: 400 });
    }
    
    // Step 1: Get TikTok info via oEmbed
    console.log('[Analyze] Step 1: Getting TikTok info...');
    const oembedData = await getTikTokOEmbed(url);
    if (!oembedData) {
      return NextResponse.json({
        success: false,
        error: 'Could not fetch TikTok info. The post may be private or deleted.',
        locations: [],
      });
    }
    
    const { caption, thumbnail, isPhoto } = oembedData;
    console.log('[Analyze] Caption:', caption?.substring(0, 100));
    console.log('[Analyze] Is photo post:', isPhoto);
    
    let frames: string[] = [];
    
    if (isPhoto) {
      // Photo post: use thumbnail
      console.log('[Analyze] Photo post - using thumbnail...');
      if (thumbnail) {
        const thumbBase64 = await downloadImageAsBase64(thumbnail);
        if (thumbBase64) {
          frames = [thumbBase64];
        }
      }
    } else {
      // Video post: extract frames via Railway
      console.log('[Analyze] Step 2: Extracting frames via Railway...');
      const extractResult = await extractFramesViaRailway(url);
      if (extractResult && extractResult.frames.length > 0) {
        frames = extractResult.frames;
      } else if (thumbnail) {
        // Fallback to thumbnail if Railway fails
        console.log('[Analyze] Railway failed, falling back to thumbnail...');
        const thumbBase64 = await downloadImageAsBase64(thumbnail);
        if (thumbBase64) {
          frames = [thumbBase64];
        }
      }
    }
    
    if (frames.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract frames. The video may be private or unavailable.',
        locations: [],
      });
    }
    
    // Step 3: Analyze with Gemini
    console.log('[Analyze] Step 3: Analyzing', frames.length, 'frames with Gemini...');
    let geminiLocations = await analyzeFramesWithGemini(frames, caption);
    
    // Fallback: If Gemini found nothing but we have a caption, try parsing it
    if (geminiLocations.length === 0 && caption) {
      console.log('[Analyze] Gemini found nothing, trying caption-based extraction...');
      geminiLocations = extractPlacesFromCaption(caption);
    }
    
    if (geminiLocations.length === 0) {
      return NextResponse.json({
        success: true,
        parseMode: 'complete',
        message: 'No specific locations found in video.',
        locations: [],
      });
    }
    
    // Step 4: Match to Google Places
    console.log('[Analyze] Step 4: Matching to Google Places...');
    const locations = [];
    
    for (const loc of geminiLocations) {
      const place = await lookupPlace(loc.name, loc.city, loc.country, {
        description: loc.description,
        tips: loc.tips || [],
        type: loc.type,
      });
      if (place) {
        locations.push(place);
      }
    }
    
    console.log('[Analyze] Found', locations.length, 'verified locations');
    
    return NextResponse.json({
      success: true,
      parseMode: 'complete',
      sourceUrl: url,
      caption,
      isPhoto,
      locations,
    });
    
  } catch (error) {
    console.error('[Analyze] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to analyze video',
      locations: [],
    }, { status: 500 });
  }
}
