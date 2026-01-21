import { NextResponse } from 'next/server';

// REST Countries API - FREE, no key needed
// Returns currency, language, timezone, flag for a country

// In-memory cache (persists across requests in same worker instance)
const cache: Record<string, { data: CountryInfo; timestamp: number }> = {};
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days (country info rarely changes)

interface CountryInfo {
  name: string;
  officialName: string;
  capital: string;
  region: string;
  subregion: string;
  population: number;
  currencies: { code: string; name: string; symbol: string }[];
  languages: string[];
  timezones: string[];
  flag: string; // emoji
  flagUrl: string; // SVG URL
  callingCode: string;
  drivingSide: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  if (!country) {
    return NextResponse.json({ error: 'country param required' }, { status: 400 });
  }

  // Check cache
  const cacheKey = country.toLowerCase();
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    return NextResponse.json(cache[cacheKey].data);
  }

  try {
    // Search by name (handles partial matches like "Thai" -> "Thailand")
    const res = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fields=name,capital,region,subregion,population,currencies,languages,timezones,flag,flags,idd,car`,
      { headers: { 'User-Agent': 'Wandr Travel App' } }
    );

    if (!res.ok) {
      // Try by country code
      const codeRes = await fetch(
        `https://restcountries.com/v3.1/alpha/${encodeURIComponent(country)}?fields=name,capital,region,subregion,population,currencies,languages,timezones,flag,flags,idd,car`,
        { headers: { 'User-Agent': 'Wandr Travel App' } }
      );
      
      if (!codeRes.ok) {
        return NextResponse.json({ error: 'Country not found' }, { status: 404 });
      }
      
      const data = await codeRes.json();
      const result = formatCountryData(Array.isArray(data) ? data[0] : data);
      cache[cacheKey] = { data: result, timestamp: Date.now() };
      return NextResponse.json(result);
    }

    const data = await res.json();
    // Take first match (most relevant)
    const countryData = Array.isArray(data) ? data[0] : data;
    const result = formatCountryData(countryData);
    
    cache[cacheKey] = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error) {
    console.error('[CountryInfo] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch country info' }, { status: 500 });
  }
}

function formatCountryData(data: Record<string, unknown>): CountryInfo {
  const currencies = data.currencies as Record<string, { name: string; symbol: string }> | undefined;
  const languages = data.languages as Record<string, string> | undefined;
  const name = data.name as { common: string; official: string } | undefined;
  const idd = data.idd as { root: string; suffixes: string[] } | undefined;
  const car = data.car as { side: string } | undefined;
  const flags = data.flags as { svg: string } | undefined;

  return {
    name: name?.common || 'Unknown',
    officialName: name?.official || 'Unknown',
    capital: Array.isArray(data.capital) ? data.capital[0] : 'Unknown',
    region: (data.region as string) || 'Unknown',
    subregion: (data.subregion as string) || '',
    population: (data.population as number) || 0,
    currencies: currencies
      ? Object.entries(currencies).map(([code, info]) => ({
          code,
          name: info.name,
          symbol: info.symbol || code,
        }))
      : [],
    languages: languages ? Object.values(languages) : [],
    timezones: (data.timezones as string[]) || [],
    flag: (data.flag as string) || '🏳️',
    flagUrl: flags?.svg || '',
    callingCode: idd ? `${idd.root}${idd.suffixes?.[0] || ''}` : '',
    drivingSide: car?.side || 'right',
  };
}
