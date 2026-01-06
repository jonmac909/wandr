// Country utilities for mapping names to codes and flags

// Common country name to ISO code mapping
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  // Asia
  'thailand': 'TH',
  'japan': 'JP',
  'china': 'CN',
  'south korea': 'KR',
  'korea': 'KR',
  'vietnam': 'VN',
  'indonesia': 'ID',
  'malaysia': 'MY',
  'singapore': 'SG',
  'philippines': 'PH',
  'india': 'IN',
  'taiwan': 'TW',
  'hong kong': 'HK',
  'cambodia': 'KH',
  'laos': 'LA',
  'myanmar': 'MM',
  'nepal': 'NP',
  'sri lanka': 'LK',
  'maldives': 'MV',

  // Europe
  'france': 'FR',
  'germany': 'DE',
  'italy': 'IT',
  'spain': 'ES',
  'portugal': 'PT',
  'united kingdom': 'GB',
  'uk': 'GB',
  'england': 'GB',
  'scotland': 'GB',
  'wales': 'GB',
  'ireland': 'IE',
  'netherlands': 'NL',
  'belgium': 'BE',
  'switzerland': 'CH',
  'austria': 'AT',
  'greece': 'GR',
  'croatia': 'HR',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'poland': 'PL',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'iceland': 'IS',
  'hungary': 'HU',
  'romania': 'RO',
  'turkey': 'TR',

  // Americas
  'united states': 'US',
  'usa': 'US',
  'us': 'US',
  'canada': 'CA',
  'mexico': 'MX',
  'brazil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'peru': 'PE',
  'colombia': 'CO',
  'costa rica': 'CR',
  'cuba': 'CU',
  'ecuador': 'EC',
  'panama': 'PA',

  // Oceania
  'australia': 'AU',
  'new zealand': 'NZ',
  'fiji': 'FJ',

  // Africa
  'south africa': 'ZA',
  'egypt': 'EG',
  'morocco': 'MA',
  'kenya': 'KE',
  'tanzania': 'TZ',
  'ethiopia': 'ET',
  'nigeria': 'NG',

  // Middle East
  'united arab emirates': 'AE',
  'uae': 'AE',
  'dubai': 'AE',
  'qatar': 'QA',
  'saudi arabia': 'SA',
  'israel': 'IL',
  'jordan': 'JO',
  'lebanon': 'LB',
};

// ISO code to flag emoji (using regional indicator symbols)
function codeToFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Country code to name mapping
const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  'TH': 'Thailand',
  'JP': 'Japan',
  'CN': 'China',
  'KR': 'South Korea',
  'VN': 'Vietnam',
  'ID': 'Indonesia',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'PH': 'Philippines',
  'IN': 'India',
  'TW': 'Taiwan',
  'HK': 'Hong Kong',
  'KH': 'Cambodia',
  'LA': 'Laos',
  'MM': 'Myanmar',
  'NP': 'Nepal',
  'LK': 'Sri Lanka',
  'MV': 'Maldives',
  'FR': 'France',
  'DE': 'Germany',
  'IT': 'Italy',
  'ES': 'Spain',
  'PT': 'Portugal',
  'GB': 'United Kingdom',
  'IE': 'Ireland',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'GR': 'Greece',
  'HR': 'Croatia',
  'CZ': 'Czech Republic',
  'PL': 'Poland',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'IS': 'Iceland',
  'HU': 'Hungary',
  'RO': 'Romania',
  'TR': 'Turkey',
  'US': 'United States',
  'CA': 'Canada',
  'MX': 'Mexico',
  'BR': 'Brazil',
  'AR': 'Argentina',
  'CL': 'Chile',
  'PE': 'Peru',
  'CO': 'Colombia',
  'CR': 'Costa Rica',
  'CU': 'Cuba',
  'EC': 'Ecuador',
  'PA': 'Panama',
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'FJ': 'Fiji',
  'ZA': 'South Africa',
  'EG': 'Egypt',
  'MA': 'Morocco',
  'KE': 'Kenya',
  'TZ': 'Tanzania',
  'ET': 'Ethiopia',
  'NG': 'Nigeria',
  'AE': 'UAE',
  'QA': 'Qatar',
  'SA': 'Saudi Arabia',
  'IL': 'Israel',
  'JO': 'Jordan',
  'LB': 'Lebanon',
};

/**
 * Get ISO country code from country name
 */
export function getCountryCode(countryName: string): string | null {
  if (!countryName) return null;
  const normalized = countryName.toLowerCase().trim();
  return COUNTRY_NAME_TO_CODE[normalized] || null;
}

/**
 * Get flag emoji from country name or code
 */
export function getCountryFlag(countryNameOrCode: string): string {
  if (!countryNameOrCode) return '';

  // If it's already a 2-letter code
  if (countryNameOrCode.length === 2) {
    return codeToFlag(countryNameOrCode.toUpperCase());
  }

  // Otherwise look up the code from name
  const code = getCountryCode(countryNameOrCode);
  return code ? codeToFlag(code) : '';
}

/**
 * Get country name from ISO code
 */
export function getCountryName(code: string): string {
  return COUNTRY_CODE_TO_NAME[code.toUpperCase()] || code;
}

/**
 * Extract country from a location string like "Bangkok, Thailand" or "Rome, Italy"
 */
export function extractCountryFromLocation(location: string): string | null {
  if (!location) return null;
  const parts = location.split(',');
  if (parts.length < 2) return null;
  return parts[parts.length - 1].trim();
}

/**
 * Get country info from location string
 */
export interface CountryInfo {
  name: string;
  code: string;
  flag: string;
}

export function getCountryInfo(location: string): CountryInfo | null {
  const countryName = extractCountryFromLocation(location);
  if (!countryName) return null;

  const code = getCountryCode(countryName);
  if (!code) {
    // Return with just the name if we can't find the code
    return {
      name: countryName,
      code: '',
      flag: '',
    };
  }

  return {
    name: getCountryName(code),
    code,
    flag: getCountryFlag(code),
  };
}
