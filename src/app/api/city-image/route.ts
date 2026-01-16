import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

// Curated high-quality images for popular cities (fast loading)
const CURATED_IMAGES: Record<string, string> = {
  // Turkey
  'Istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
  'Cappadocia': 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&q=80',
  'Antalya': 'https://images.unsplash.com/photo-1581882897922-d03987cf13aa?w=600&q=80',
  'Ephesus': 'https://images.unsplash.com/photo-1748560594121-4a8e3e35e4f4?w=600&q=80',
  'Pamukkale': 'https://images.unsplash.com/photo-1728466698701-2eb2af4117d4?w=600&q=80',
  'Bodrum': 'https://images.unsplash.com/photo-1583062482795-d2bef78e9bc1?w=600&q=80',
  'Izmir': 'https://images.unsplash.com/photo-1651524055017-cef6327c11f4?w=600&q=80',
  'Ankara': 'https://images.unsplash.com/photo-1589561454226-796a8aa89b05?w=600&q=80',
  'Fethiye': 'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=600&q=80',
  'Kas': 'https://images.unsplash.com/photo-1683977817985-8493d2836311?w=600&q=80',
  'Trabzon': 'https://images.unsplash.com/photo-1565623833408-d77e39b88af6?w=600&q=80',
  'Bursa': 'https://images.unsplash.com/photo-1647122290702-d26706aa5903?w=600&q=80',
  'Konya': 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&q=80',
  'Dalyan': 'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=600&q=80',
  'Oludeniz': 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=600&q=80',
  'Marmaris': 'https://images.unsplash.com/photo-1593434858907-966d9ff489a4?w=600&q=80',
  'Alanya': 'https://images.unsplash.com/photo-1666202629936-a011710a2ab5?w=600&q=80',
  'Side': 'https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=600&q=80',
  // Spain
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'Seville': 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=600&q=80',
  'Granada': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80',
  'Valencia': 'https://images.unsplash.com/photo-1529686398651-b8112f4bb98c?w=600&q=80',
  'San Sebastian': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Bilbao': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Malaga': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=80',
  'Toledo': 'https://images.unsplash.com/photo-1559666126-84f389727b9a?w=600&q=80',
  'Cordoba': 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=600&q=80',
  'Ibiza': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'Ronda': 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=600&q=80',
  'Salamanca': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  'Girona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Segovia': 'https://images.unsplash.com/photo-1559666126-84f389727b9a?w=600&q=80',
  'Cadiz': 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=600&q=80',
  'Marbella': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=80',
  'Palma de Mallorca': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  // Italy
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Florence': 'https://images.unsplash.com/photo-1476362174823-3a23f4aa6d76?w=600&q=80',
  'Venice': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80',
  'Milan': 'https://images.unsplash.com/photo-1520440229-6469a149ac59?w=600&q=80',
  'Amalfi Coast': 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=600&q=80',
  // France
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Nice': 'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=600&q=80',
  'Lyon': 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600&q=80',
  // Japan
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
  'Osaka': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600&q=80',
  'Hiroshima': 'https://images.unsplash.com/photo-1587580786277-59a87083924a?w=600&q=80',
  'Nara': 'https://images.unsplash.com/photo-1542051851841-fd0ae7679d21?w=600&q=80',
  'Hakone': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
  'Kanazawa': 'https://images.unsplash.com/photo-1673598238152-6995e0939b4d?w=600&q=80',
  'Nikko': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Fukuoka': 'https://images.unsplash.com/photo-1543687890-30c2398b5a89?w=600&q=80',
  'Takayama': 'https://images.unsplash.com/photo-1519572686065-7f0788788a44?w=600&q=80',
  'Nagoya': 'https://images.unsplash.com/photo-1542051851841-fd0ae7679d21?w=600&q=80',
  'Kamakura': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Naoshima': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Kobe': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Miyajima': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  // Switzerland
  'Zurich': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80',
  'Lucerne': 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=600&q=80',
  'Interlaken': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=600&q=80',
  'Zermatt': 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=600&q=80',
  'Geneva': 'https://images.unsplash.com/photo-1573108037329-37aa135a142e?w=600&q=80',
  // Thailand
  'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80',
  'Chiang Mai': 'https://images.unsplash.com/photo-1524189791114-9781ece3d3ed?w=600&q=80',
  'Phuket': 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600&q=80',
  'Koh Samui': 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&q=80',
  'Ayutthaya': 'https://images.unsplash.com/photo-1520592298871-d6f059e6f423?w=600&q=80',
  'Pai': 'https://images.unsplash.com/photo-1542051851847-5f90071e7989?w=600&q=80',
  'Chiang Rai': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Koh Phi Phi': 'https://images.unsplash.com/photo-1520592298871-d6f059e6f423?w=600&q=80',
  'Koh Lanta': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Koh Tao': 'https://images.unsplash.com/photo-1520592298871-d6f059e6f423?w=600&q=80',
  'Hua Hin': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Koh Chang': 'https://images.unsplash.com/photo-1538734740536-b567c0379b4f?w=600&q=80',
  'Sukhothai': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Kanchanaburi': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  // Greece
  'Athens': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&q=80',
  'Santorini': 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&q=80',
  'Mykonos': 'https://images.unsplash.com/photo-1601581875039-e899893d520c?w=600&q=80',
  'Crete': 'https://images.unsplash.com/photo-1566392858113-015c7762dc89?w=600&q=80',
  'Rhodes': 'https://images.unsplash.com/photo-1615240967264-c48a62522d5d?w=600&q=80',
  'Corfu': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Meteora': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Delphi': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Thessaloniki': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Naxos': 'https://images.unsplash.com/photo-1520592298871-d6f059e6f423?w=600&q=80',
  'Paros': 'https://images.unsplash.com/photo-1520592298871-d6f059e6f423?w=600&q=80',
  'Zakynthos': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Hydra': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Milos': 'https://images.unsplash.com/photo-1520592298871-d6f059e6f423?w=600&q=80',
  'Nafplio': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  // Portugal
  'Lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=80',
  'Porto': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80',
  'Sintra': 'https://images.unsplash.com/photo-1582053438288-199ee561705f?w=600&q=80',
  'Algarve': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Madeira': 'https://images.unsplash.com/photo-1533105079780-92b9be482078?w=600&q=80',
  'Evora': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Coimbra': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Cascais': 'https://images.unsplash.com/photo-1533105079780-92b9be482078?w=600&q=80',
  'Lagos': 'https://images.unsplash.com/photo-1533105079780-92b9be482078?w=600&q=80',
  'Nazare': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'bidos': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Azores': 'https://images.unsplash.com/photo-1533105079780-92b9be482078?w=600&q=80',
  'Braga': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Aveiro': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Tavira': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  // Vietnam
  'Hanoi': 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=600&q=80',
  'Ho Chi Minh City': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',
  'Ha Long Bay': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80',
  'Hoi An': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
  'Da Nang': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
  'Sapa': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Hue': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
  'Nha Trang': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Phu Quoc': 'https://images.unsplash.com/photo-1533105079780-92b9be482078?w=600&q=80',
  'Ninh Binh': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Dalat': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Mui Ne': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Can Tho': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Phong Nha': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Quy Nhon': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  // Indonesia
  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df675ab4?w=600&q=80',
  'Jakarta': 'https://images.unsplash.com/photo-156862044356-f1d4c5b2dd3c?w=600&q=80',
  'Yogyakarta': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Ubud': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Lombok': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Komodo': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Raja Ampat': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Bandung': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Surabaya': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Gili Islands': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Labuan Bajo': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Sulawesi': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Sumatra': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Flores': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  'Malang': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80',
  // Hawaii
  'Honolulu': 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=600&q=80',
  'Waikiki': 'https://images.unsplash.com/photo-1571041804726-53f7a7f0039b?w=600&q=80',
  'Maui': 'https://images.unsplash.com/photo-1542259009477-d625272157b7?w=600&q=80',
  'Kauai': 'https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?w=600&q=80',
  'Big Island': 'https://images.unsplash.com/photo-1547483238-f400e65ccd56?w=600&q=80',
  'Oahu': 'https://images.unsplash.com/photo-1598135753163-6167c1a1ad65?w=600&q=80',
  'North Shore': 'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=600&q=80',
  'Lahaina': 'https://images.unsplash.com/photo-1542259009477-d625272157b7?w=600&q=80',
  'Kona': 'https://images.unsplash.com/photo-1547483238-f400e65ccd56?w=600&q=80',
  'Hanalei': 'https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?w=600&q=80',
};

// Cache for dynamically searched images
const imageCache = new Map<string, string>();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');
  const country = searchParams.get('country');

  if (!city) {
    return NextResponse.json({ error: 'City parameter required' }, { status: 400 });
  }

  // 1. Check curated images first
  if (CURATED_IMAGES[city]) {
    return NextResponse.json({ imageUrl: CURATED_IMAGES[city], source: 'curated' });
  }

  // 2. Check cache
  const cacheKey = `${city}-${country || ''}`;
  if (imageCache.has(cacheKey)) {
    return NextResponse.json({ imageUrl: imageCache.get(cacheKey), source: 'cache' });
  }

  // 3. Try partial match (case-insensitive) BEFORE Wikipedia for speed
  const lowerCity = city.toLowerCase();
  for (const [key, url] of Object.entries(CURATED_IMAGES)) {
    if (key.toLowerCase().includes(lowerCity) || lowerCity.includes(key.toLowerCase())) {
      imageCache.set(cacheKey, url);
      return NextResponse.json({ imageUrl: url, source: 'curated-partial' });
    }
  }

  // 4. Try to fetch from Wikipedia API (free, no API key needed)
  try {
    const searchTerm = country ? `${city}, ${country}` : city;
    const wikiResponse = await fetchWithTimeout(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
    );

    if (wikiResponse.ok) {
      const data = await wikiResponse.json();
      if (data.thumbnail?.source) {
        // Get higher resolution version
        const imageUrl = data.thumbnail.source.replace(/\/\d+px-/, '/600px-');
        imageCache.set(cacheKey, imageUrl);
        return NextResponse.json({ imageUrl, source: 'wikipedia' });
      }
      if (data.originalimage?.source) {
        imageCache.set(cacheKey, data.originalimage.source);
        return NextResponse.json({ imageUrl: data.originalimage.source, source: 'wikipedia' });
      }
    }
  } catch (error) {
    console.error('Wikipedia API error:', error);
  }

  // 5. Fallback: use a generic travel image
  const fallbackUrl = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80`;
  return NextResponse.json({ imageUrl: fallbackUrl, source: 'fallback' });
}
