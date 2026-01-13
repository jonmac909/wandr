// Comprehensive city to country code mapping
// This covers major cities and travel destinations worldwide

const CITY_TO_COUNTRY: Record<string, string> = {
  // Japan
  'tokyo': 'JP', 'osaka': 'JP', 'kyoto': 'JP', 'nagoya': 'JP', 'sapporo': 'JP',
  'fukuoka': 'JP', 'okinawa': 'JP', 'hiroshima': 'JP', 'nara': 'JP', 'hakone': 'JP',
  'nikko': 'JP', 'kanazawa': 'JP', 'kobe': 'JP', 'yokohama': 'JP', 'kamakura': 'JP',
  'narita': 'JP', 'shibuya': 'JP', 'shinjuku': 'JP', 'ginza': 'JP', 'akihabara': 'JP',
  'sendai': 'JP', 'nagasaki': 'JP', 'kumamoto': 'JP', 'matsumoto': 'JP', 'takayama': 'JP',
  'beppu': 'JP', 'miyajima': 'JP', 'fuji': 'JP', 'mt fuji': 'JP', 'kawaguchiko': 'JP',
  'izu': 'JP', 'atami': 'JP', 'karuizawa': 'JP', 'shirakawa': 'JP', 'ishigaki': 'JP',
  'miyako': 'JP', 'naha': 'JP', 'hakodate': 'JP', 'otaru': 'JP', 'niseko': 'JP',

  // Thailand
  'bangkok': 'TH', 'chiang mai': 'TH', 'phuket': 'TH', 'koh samui': 'TH',
  'krabi': 'TH', 'pattaya': 'TH', 'koh yao': 'TH', 'koh lanta': 'TH',
  'koh phi phi': 'TH', 'koh tao': 'TH', 'koh phangan': 'TH', 'chiang rai': 'TH',
  'ayutthaya': 'TH', 'sukhothai': 'TH', 'hua hin': 'TH', 'kanchanaburi': 'TH',
  'pai': 'TH', 'railay': 'TH', 'ao nang': 'TH', 'khao lak': 'TH', 'koh chang': 'TH',

  // Vietnam
  'hanoi': 'VN', 'ho chi minh': 'VN', 'saigon': 'VN', 'da nang': 'VN',
  'hoi an': 'VN', 'nha trang': 'VN', 'phu quoc': 'VN', 'hue': 'VN',
  'sapa': 'VN', 'ha long': 'VN', 'halong': 'VN', 'dalat': 'VN', 'mui ne': 'VN',
  'can tho': 'VN', 'ninh binh': 'VN', 'phong nha': 'VN', 'quy nhon': 'VN',

  // Indonesia
  'bali': 'ID', 'jakarta': 'ID', 'yogyakarta': 'ID', 'ubud': 'ID', 'seminyak': 'ID',
  'kuta': 'ID', 'canggu': 'ID', 'sanur': 'ID', 'nusa dua': 'ID', 'uluwatu': 'ID',
  'lombok': 'ID', 'gili': 'ID', 'komodo': 'ID', 'flores': 'ID', 'raja ampat': 'ID',
  'surabaya': 'ID', 'bandung': 'ID', 'medan': 'ID', 'makassar': 'ID',

  // Malaysia
  'kuala lumpur': 'MY', 'penang': 'MY', 'langkawi': 'MY', 'kota kinabalu': 'MY',
  'malacca': 'MY', 'melaka': 'MY', 'ipoh': 'MY', 'cameron highlands': 'MY',
  'george town': 'MY', 'johor bahru': 'MY', 'kuching': 'MY', 'perhentian': 'MY',

  // Singapore
  'singapore': 'SG',

  // Philippines
  'manila': 'PH', 'cebu': 'PH', 'boracay': 'PH', 'palawan': 'PH', 'el nido': 'PH',
  'puerto princesa': 'PH', 'siargao': 'PH', 'bohol': 'PH', 'davao': 'PH', 'coron': 'PH',

  // Cambodia
  'siem reap': 'KH', 'phnom penh': 'KH', 'sihanoukville': 'KH', 'battambang': 'KH',
  'kampot': 'KH', 'kep': 'KH', 'angkor': 'KH',

  // Laos
  'vientiane': 'LA', 'luang prabang': 'LA', 'vang vieng': 'LA', 'pakse': 'LA',

  // Myanmar
  'yangon': 'MM', 'bagan': 'MM', 'mandalay': 'MM', 'inle': 'MM', 'ngapali': 'MM',

  // South Korea
  'seoul': 'KR', 'busan': 'KR', 'jeju': 'KR', 'incheon': 'KR', 'gyeongju': 'KR',
  'sokcho': 'KR', 'gangnam': 'KR', 'myeongdong': 'KR', 'hongdae': 'KR',

  // Taiwan
  'taipei': 'TW', 'kaohsiung': 'TW', 'taichung': 'TW', 'tainan': 'TW',
  'hualien': 'TW', 'jiufen': 'TW', 'taroko': 'TW', 'kenting': 'TW', 'sun moon lake': 'TW',

  // Hong Kong & Macau
  'hong kong': 'HK', 'kowloon': 'HK', 'macau': 'MO', 'macao': 'MO',

  // China
  'beijing': 'CN', 'shanghai': 'CN', 'guangzhou': 'CN', 'shenzhen': 'CN',
  'chengdu': 'CN', 'xi\'an': 'CN', 'xian': 'CN', 'hangzhou': 'CN', 'guilin': 'CN',
  'suzhou': 'CN', 'nanjing': 'CN', 'chongqing': 'CN', 'kunming': 'CN',
  'lijiang': 'CN', 'zhangjiajie': 'CN', 'harbin': 'CN', 'qingdao': 'CN',

  // India
  'delhi': 'IN', 'new delhi': 'IN', 'mumbai': 'IN', 'bangalore': 'IN', 'bengaluru': 'IN',
  'goa': 'IN', 'jaipur': 'IN', 'agra': 'IN', 'varanasi': 'IN', 'udaipur': 'IN',
  'kerala': 'IN', 'kochi': 'IN', 'chennai': 'IN', 'kolkata': 'IN', 'hyderabad': 'IN',
  'rishikesh': 'IN', 'dharamsala': 'IN', 'manali': 'IN', 'shimla': 'IN', 'amritsar': 'IN',
  'jodhpur': 'IN', 'pushkar': 'IN', 'hampi': 'IN', 'mysore': 'IN', 'pondicherry': 'IN',

  // Nepal
  'kathmandu': 'NP', 'pokhara': 'NP', 'chitwan': 'NP', 'lumbini': 'NP', 'nagarkot': 'NP',

  // Sri Lanka
  'colombo': 'LK', 'kandy': 'LK', 'galle': 'LK', 'ella': 'LK', 'sigiriya': 'LK',
  'nuwara eliya': 'LK', 'mirissa': 'LK', 'unawatuna': 'LK', 'arugam bay': 'LK',

  // Maldives
  'male': 'MV', 'maldives': 'MV',

  // Middle East
  'dubai': 'AE', 'abu dhabi': 'AE', 'doha': 'QA', 'muscat': 'OM', 'amman': 'JO',
  'petra': 'JO', 'beirut': 'LB', 'tel aviv': 'IL', 'jerusalem': 'IL', 'riyadh': 'SA',
  'jeddah': 'SA', 'istanbul': 'TR', 'cappadocia': 'TR', 'antalya': 'TR', 'bodrum': 'TR',
  'izmir': 'TR', 'pamukkale': 'TR', 'fethiye': 'TR', 'ephesus': 'TR',

  // Europe - UK & Ireland
  'london': 'GB', 'edinburgh': 'GB', 'manchester': 'GB', 'liverpool': 'GB',
  'birmingham': 'GB', 'bristol': 'GB', 'oxford': 'GB', 'cambridge': 'GB',
  'bath': 'GB', 'york': 'GB', 'brighton': 'GB', 'glasgow': 'GB', 'belfast': 'GB',
  'dublin': 'IE', 'galway': 'IE', 'cork': 'IE', 'killarney': 'IE',

  // Europe - France
  'paris': 'FR', 'nice': 'FR', 'lyon': 'FR', 'marseille': 'FR', 'bordeaux': 'FR',
  'strasbourg': 'FR', 'toulouse': 'FR', 'nantes': 'FR', 'montpellier': 'FR',
  'cannes': 'FR', 'monaco': 'MC', 'avignon': 'FR', 'aix-en-provence': 'FR',
  'chamonix': 'FR', 'annecy': 'FR', 'versailles': 'FR', 'normandy': 'FR', 'provence': 'FR',

  // Europe - Italy
  'rome': 'IT', 'florence': 'IT', 'venice': 'IT', 'milan': 'IT', 'naples': 'IT',
  'amalfi': 'IT', 'positano': 'IT', 'cinque terre': 'IT', 'pisa': 'IT', 'siena': 'IT',
  'bologna': 'IT', 'verona': 'IT', 'turin': 'IT', 'genoa': 'IT', 'palermo': 'IT',
  'sicily': 'IT', 'sardinia': 'IT', 'capri': 'IT', 'sorrento': 'IT', 'como': 'IT',
  'ravello': 'IT', 'pompeii': 'IT', 'san gimignano': 'IT', 'lucca': 'IT', 'assisi': 'IT',

  // Europe - Spain
  'barcelona': 'ES', 'madrid': 'ES', 'seville': 'ES', 'valencia': 'ES', 'granada': 'ES',
  'bilbao': 'ES', 'malaga': 'ES', 'san sebastian': 'ES', 'ibiza': 'ES', 'mallorca': 'ES',
  'cordoba': 'ES', 'toledo': 'ES', 'salamanca': 'ES', 'cadiz': 'ES', 'tenerife': 'ES',

  // Europe - Portugal
  'lisbon': 'PT', 'porto': 'PT', 'faro': 'PT', 'sintra': 'PT', 'cascais': 'PT',
  'lagos': 'PT', 'madeira': 'PT', 'azores': 'PT', 'coimbra': 'PT', 'evora': 'PT',

  // Europe - Germany
  'berlin': 'DE', 'munich': 'DE', 'frankfurt': 'DE', 'hamburg': 'DE', 'cologne': 'DE',
  'dusseldorf': 'DE', 'stuttgart': 'DE', 'dresden': 'DE', 'heidelberg': 'DE',
  'nuremberg': 'DE', 'rothenburg': 'DE', 'neuschwanstein': 'DE', 'baden-baden': 'DE',

  // Europe - Netherlands & Belgium
  'amsterdam': 'NL', 'rotterdam': 'NL', 'the hague': 'NL', 'utrecht': 'NL',
  'brussels': 'BE', 'bruges': 'BE', 'ghent': 'BE', 'antwerp': 'BE',

  // Europe - Switzerland & Austria
  'zurich': 'CH', 'geneva': 'CH', 'bern': 'CH', 'lucerne': 'CH', 'interlaken': 'CH',
  'zermatt': 'CH', 'basel': 'CH', 'grindelwald': 'CH', 'st moritz': 'CH',
  'vienna': 'AT', 'salzburg': 'AT', 'innsbruck': 'AT', 'hallstatt': 'AT',

  // Europe - Nordics
  'copenhagen': 'DK', 'stockholm': 'SE', 'oslo': 'NO', 'helsinki': 'FI',
  'reykjavik': 'IS', 'bergen': 'NO', 'gothenburg': 'SE', 'malmo': 'SE',
  'tromso': 'NO', 'rovaniemi': 'FI', 'lofoten': 'NO', 'lapland': 'FI',

  // Europe - Eastern
  'prague': 'CZ', 'budapest': 'HU', 'warsaw': 'PL', 'krakow': 'PL', 'gdansk': 'PL',
  'bucharest': 'RO', 'sofia': 'BG', 'belgrade': 'RS', 'zagreb': 'HR',
  'dubrovnik': 'HR', 'split': 'HR', 'ljubljana': 'SI', 'bled': 'SI', 'bratislava': 'SK',
  'tallinn': 'EE', 'riga': 'LV', 'vilnius': 'LT', 'kyiv': 'UA', 'lviv': 'UA',

  // Europe - Greece
  'athens': 'GR', 'santorini': 'GR', 'mykonos': 'GR', 'crete': 'GR', 'rhodes': 'GR',
  'corfu': 'GR', 'zakynthos': 'GR', 'thessaloniki': 'GR', 'meteora': 'GR', 'delphi': 'GR',

  // USA
  'new york': 'US', 'nyc': 'US', 'manhattan': 'US', 'brooklyn': 'US',
  'los angeles': 'US', 'la': 'US', 'hollywood': 'US', 'san francisco': 'US',
  'san diego': 'US', 'las vegas': 'US', 'miami': 'US', 'chicago': 'US',
  'boston': 'US', 'washington dc': 'US', 'seattle': 'US', 'portland': 'US',
  'denver': 'US', 'austin': 'US', 'new orleans': 'US', 'nashville': 'US',
  'atlanta': 'US', 'philadelphia': 'US', 'phoenix': 'US', 'houston': 'US',
  'dallas': 'US', 'orlando': 'US', 'honolulu': 'US', 'hawaii': 'US', 'maui': 'US',
  'oahu': 'US', 'waikiki': 'US', 'kona': 'US', 'kauai': 'US', 'hilo': 'US',
  'yosemite': 'US', 'yellowstone': 'US', 'grand canyon': 'US', 'zion': 'US',
  'napa': 'US', 'aspen': 'US', 'palm springs': 'US', 'savannah': 'US', 'charleston': 'US',
  'santa fe': 'US', 'sedona': 'US', 'key west': 'US', 'moab': 'US', 'jackson hole': 'US',

  // Canada
  'vancouver': 'CA', 'toronto': 'CA', 'montreal': 'CA', 'calgary': 'CA',
  'ottawa': 'CA', 'quebec city': 'CA', 'victoria': 'CA', 'whistler': 'CA',
  'banff': 'CA', 'jasper': 'CA', 'niagara falls': 'CA', 'halifax': 'CA',
  'kelowna': 'CA', 'edmonton': 'CA', 'winnipeg': 'CA', 'tofino': 'CA',

  // Mexico & Central America
  'mexico city': 'MX', 'cancun': 'MX', 'playa del carmen': 'MX', 'tulum': 'MX',
  'puerto vallarta': 'MX', 'cabo': 'MX', 'oaxaca': 'MX', 'guadalajara': 'MX',
  'san miguel de allende': 'MX', 'merida': 'MX', 'cozumel': 'MX',
  'san jose': 'CR', 'monteverde': 'CR', 'arenal': 'CR', 'manuel antonio': 'CR',
  'panama city': 'PA', 'boquete': 'PA', 'bocas del toro': 'PA',
  'antigua': 'GT', 'guatemala city': 'GT', 'lake atitlan': 'GT',
  'belize city': 'BZ', 'san pedro': 'BZ', 'caye caulker': 'BZ',

  // South America
  'lima': 'PE', 'cusco': 'PE', 'machu picchu': 'PE', 'arequipa': 'PE', 'sacred valley': 'PE',
  'buenos aires': 'AR', 'mendoza': 'AR', 'bariloche': 'AR', 'patagonia': 'AR', 'iguazu': 'AR',
  'rio de janeiro': 'BR', 'rio': 'BR', 'sao paulo': 'BR', 'salvador': 'BR', 'florianopolis': 'BR',
  'santiago': 'CL', 'valparaiso': 'CL', 'atacama': 'CL', 'torres del paine': 'CL',
  'bogota': 'CO', 'cartagena': 'CO', 'medellin': 'CO', 'cali': 'CO',
  'quito': 'EC', 'galapagos': 'EC', 'cuenca': 'EC', 'banos': 'EC',
  'la paz': 'BO', 'uyuni': 'BO', 'sucre': 'BO',
  'montevideo': 'UY', 'punta del este': 'UY',

  // Caribbean
  'havana': 'CU', 'varadero': 'CU', 'trinidad': 'CU',
  'punta cana': 'DO', 'santo domingo': 'DO',
  'san juan': 'PR', 'nassau': 'BS', 'jamaica': 'JM', 'montego bay': 'JM',
  'barbados': 'BB', 'aruba': 'AW', 'curacao': 'CW', 'st lucia': 'LC',
  'st maarten': 'SX', 'turks and caicos': 'TC', 'virgin islands': 'VI',

  // Australia & New Zealand
  'sydney': 'AU', 'melbourne': 'AU', 'brisbane': 'AU', 'perth': 'AU', 'adelaide': 'AU',
  'gold coast': 'AU', 'cairns': 'AU', 'hobart': 'AU', 'darwin': 'AU', 'canberra': 'AU',
  'great barrier reef': 'AU', 'uluru': 'AU', 'whitsundays': 'AU', 'byron bay': 'AU',
  'auckland': 'NZ', 'wellington': 'NZ', 'queenstown': 'NZ', 'christchurch': 'NZ',
  'rotorua': 'NZ', 'milford sound': 'NZ', 'hobbiton': 'NZ', 'taupo': 'NZ',

  // Pacific Islands
  'fiji': 'FJ', 'tahiti': 'PF', 'bora bora': 'PF', 'moorea': 'PF',
  'samoa': 'WS', 'tonga': 'TO', 'vanuatu': 'VU', 'new caledonia': 'NC', 'palau': 'PW',

  // Africa
  'cape town': 'ZA', 'johannesburg': 'ZA', 'durban': 'ZA', 'kruger': 'ZA', 'garden route': 'ZA',
  'cairo': 'EG', 'luxor': 'EG', 'aswan': 'EG', 'sharm el sheikh': 'EG', 'hurghada': 'EG',
  'marrakech': 'MA', 'fes': 'MA', 'casablanca': 'MA', 'chefchaouen': 'MA', 'essaouira': 'MA',
  'nairobi': 'KE', 'masai mara': 'KE', 'mombasa': 'KE', 'lamu': 'KE',
  'dar es salaam': 'TZ', 'zanzibar': 'TZ', 'serengeti': 'TZ', 'kilimanjaro': 'TZ', 'arusha': 'TZ',
  'victoria falls': 'ZW', 'livingstone': 'ZM', 'addis ababa': 'ET', 'lalibela': 'ET',
  'accra': 'GH', 'lagos nigeria': 'NG', 'dakar': 'SN', 'tunis': 'TN', 'algiers': 'DZ',
  'kigali': 'RW', 'kampala': 'UG', 'windhoek': 'NA', 'etosha': 'NA', 'sossusvlei': 'NA',
  'mauritius': 'MU', 'seychelles': 'SC', 'reunion': 'RE', 'madagascar': 'MG',
};

/**
 * Get country code for a city name
 */
export function getCountryForCity(city: string): string | null {
  if (!city) return null;
  const normalized = city.toLowerCase().trim();
  return CITY_TO_COUNTRY[normalized] || null;
}

/**
 * Get flag emoji for a city
 */
export function getFlagForCity(city: string): string {
  const code = getCountryForCity(city);
  if (!code) return '';

  // Convert country code to flag emoji
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Common country names to codes - used for both direct lookups and "City, Country" format
const COUNTRY_TO_CODE: Record<string, string> = {
  'japan': 'JP', 'thailand': 'TH', 'vietnam': 'VN', 'indonesia': 'ID',
  'malaysia': 'MY', 'singapore': 'SG', 'philippines': 'PH', 'cambodia': 'KH',
  'laos': 'LA', 'myanmar': 'MM', 'south korea': 'KR', 'korea': 'KR',
  'taiwan': 'TW', 'china': 'CN', 'india': 'IN', 'nepal': 'NP',
  'sri lanka': 'LK', 'maldives': 'MV', 'usa': 'US', 'united states': 'US',
  'canada': 'CA', 'mexico': 'MX', 'uk': 'GB', 'united kingdom': 'GB',
  'england': 'GB', 'france': 'FR', 'italy': 'IT', 'spain': 'ES',
  'portugal': 'PT', 'germany': 'DE', 'netherlands': 'NL', 'belgium': 'BE',
  'switzerland': 'CH', 'austria': 'AT', 'greece': 'GR', 'croatia': 'HR',
  'australia': 'AU', 'new zealand': 'NZ', 'uae': 'AE', 'turkey': 'TR',
  // US States commonly listed as destinations
  'hawaii': 'US', 'alaska': 'US', 'california': 'US', 'florida': 'US',
  'new york': 'US', 'texas': 'US', 'arizona': 'US', 'nevada': 'US',
};

/**
 * Convert country code to flag emoji
 */
function codeToFlag(code: string): string {
  const codePoints = code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Country code to country name mapping
const CODE_TO_COUNTRY: Record<string, string> = {
  'JP': 'Japan', 'TH': 'Thailand', 'VN': 'Vietnam', 'ID': 'Indonesia',
  'MY': 'Malaysia', 'SG': 'Singapore', 'PH': 'Philippines', 'KH': 'Cambodia',
  'LA': 'Laos', 'MM': 'Myanmar', 'KR': 'South Korea', 'TW': 'Taiwan',
  'HK': 'Hong Kong', 'MO': 'Macau', 'CN': 'China', 'IN': 'India',
  'NP': 'Nepal', 'LK': 'Sri Lanka', 'MV': 'Maldives',
  'AE': 'UAE', 'QA': 'Qatar', 'OM': 'Oman', 'JO': 'Jordan', 'LB': 'Lebanon',
  'IL': 'Israel', 'SA': 'Saudi Arabia', 'TR': 'Turkey',
  'GB': 'United Kingdom', 'IE': 'Ireland', 'FR': 'France', 'MC': 'Monaco',
  'IT': 'Italy', 'ES': 'Spain', 'PT': 'Portugal', 'DE': 'Germany',
  'NL': 'Netherlands', 'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria',
  'DK': 'Denmark', 'SE': 'Sweden', 'NO': 'Norway', 'FI': 'Finland', 'IS': 'Iceland',
  'CZ': 'Czech Republic', 'HU': 'Hungary', 'PL': 'Poland', 'RO': 'Romania',
  'BG': 'Bulgaria', 'RS': 'Serbia', 'HR': 'Croatia', 'SI': 'Slovenia',
  'SK': 'Slovakia', 'EE': 'Estonia', 'LV': 'Latvia', 'LT': 'Lithuania',
  'UA': 'Ukraine', 'GR': 'Greece',
  'US': 'United States', 'CA': 'Canada', 'MX': 'Mexico',
  'CR': 'Costa Rica', 'PA': 'Panama', 'GT': 'Guatemala', 'BZ': 'Belize',
  'PE': 'Peru', 'AR': 'Argentina', 'BR': 'Brazil', 'CL': 'Chile',
  'CO': 'Colombia', 'EC': 'Ecuador', 'BO': 'Bolivia', 'UY': 'Uruguay',
  'CU': 'Cuba', 'DO': 'Dominican Republic', 'PR': 'Puerto Rico',
  'BS': 'Bahamas', 'JM': 'Jamaica', 'BB': 'Barbados', 'AW': 'Aruba',
  'CW': 'Curacao', 'LC': 'St Lucia', 'SX': 'St Maarten', 'TC': 'Turks and Caicos',
  'AU': 'Australia', 'NZ': 'New Zealand',
  'FJ': 'Fiji', 'PF': 'French Polynesia', 'WS': 'Samoa', 'TO': 'Tonga',
  'VU': 'Vanuatu', 'NC': 'New Caledonia', 'PW': 'Palau',
  'ZA': 'South Africa', 'EG': 'Egypt', 'MA': 'Morocco', 'KE': 'Kenya',
  'TZ': 'Tanzania', 'ZW': 'Zimbabwe', 'ZM': 'Zambia', 'ET': 'Ethiopia',
  'GH': 'Ghana', 'NG': 'Nigeria', 'SN': 'Senegal', 'TN': 'Tunisia',
  'DZ': 'Algeria', 'RW': 'Rwanda', 'UG': 'Uganda', 'NA': 'Namibia',
  'MU': 'Mauritius', 'SC': 'Seychelles', 'RE': 'Reunion', 'MG': 'Madagascar',
};

/**
 * Get country name from country code
 */
export function getCountryName(code: string): string {
  return CODE_TO_COUNTRY[code] || code;
}

/**
 * Get country code and name for a city
 */
export function getCountryInfoForCity(city: string): { code: string; name: string; flag: string } | null {
  const code = getCountryForCity(city);
  if (!code) return null;
  return {
    code,
    name: getCountryName(code),
    flag: codeToFlag(code),
  };
}

/**
 * Try to get flag from location string (handles "City, Country" format and standalone country names)
 */
export function getFlagForLocation(location: string): string {
  if (!location) return '';
  const trimmed = location.trim().toLowerCase();

  // First check if it's a country name directly (e.g., "Thailand", "Japan", "Hawaii")
  const countryCode = COUNTRY_TO_CODE[trimmed];
  if (countryCode) return codeToFlag(countryCode);

  // Then try the city part
  const city = location.split(',')[0].trim();
  const cityFlag = getFlagForCity(city);
  if (cityFlag) return cityFlag;

  // Then try the country part if present (e.g., "Tokyo, Japan")
  const parts = location.split(',');
  if (parts.length > 1) {
    const country = parts[parts.length - 1].trim().toLowerCase();
    const code = COUNTRY_TO_CODE[country];
    if (code) return codeToFlag(code);
  }

  return '';
}
