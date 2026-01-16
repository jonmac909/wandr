import { NextRequest, NextResponse } from 'next/server';

// Search terms for better Unsplash results
const CITY_SEARCH_TERMS: Record<string, string> = {
  // Turkey
  'Istanbul': 'istanbul,mosque,bosphorus',
  'Cappadocia': 'cappadocia,balloon,turkey',
  'Antalya': 'antalya,beach,turkey',
  'Bodrum': 'bodrum,aegean,coast',
  'Ephesus': 'ephesus,ruins,ancient',
  'Pamukkale': 'pamukkale,travertine,turkey',
  // Spain
  'Barcelona': 'barcelona,sagrada,gaudi',
  'Madrid': 'madrid,spain,plaza',
  'Seville': 'seville,spain,alcazar',
  'Granada': 'granada,alhambra,spain',
  'Valencia': 'valencia,spain,architecture',
  'San Sebastian': 'san+sebastian,basque,beach',
  // Italy
  'Rome': 'rome,colosseum,italy',
  'Florence': 'florence,duomo,italy',
  'Venice': 'venice,canal,gondola',
  'Amalfi Coast': 'amalfi,positano,coast',
  'Milan': 'milan,duomo,italy',
  // Switzerland
  'Zurich': 'zurich,switzerland,lake',
  'Lucerne': 'lucerne,switzerland,chapel',
  'Interlaken': 'interlaken,alps,switzerland',
  'Zermatt': 'zermatt,matterhorn,alps',
  'Geneva': 'geneva,switzerland,lake',
  // France
  'Paris': 'paris,eiffel,france',
  'Nice': 'nice,riviera,france',
  'Lyon': 'lyon,france,city',
  // Generic activities/categories
  'Walking Tour': 'walking,tour,city',
  'Food Tour': 'food,market,culinary',
  'Museum Visit': 'museum,art,gallery',
  'Historical Site': 'historical,monument,heritage',
  'Local Market': 'market,bazaar,local',
  'Sunset Viewpoint': 'sunset,viewpoint,scenic',
  'Cooking Class': 'cooking,class,kitchen',
  'Art Gallery': 'art,gallery,museum',
  'Nature Hike': 'hiking,nature,trail',
  'Boutique Hotel': 'boutique,hotel,luxury',
  'Design Hotel': 'design,hotel,modern',
  'Historic Inn': 'historic,inn,traditional',
  'Modern Resort': 'resort,pool,modern',
  'Local Bistro': 'bistro,restaurant,dining',
  'Rooftop Bar': 'rooftop,bar,cocktail',
  'Street Food': 'street,food,market',
  'Fine Dining': 'fine,dining,restaurant',
  'Artisan Coffee': 'coffee,cafe,artisan',
  'Cozy Cafe': 'cozy,cafe,coffee',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const searchName = decodeURIComponent(name);

  // Redirect to Pexels fallback image (this endpoint is deprecated, use /api/city-image instead)
  const pexelsFallback = 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600';

  return NextResponse.redirect(pexelsFallback, {
    status: 302,
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
