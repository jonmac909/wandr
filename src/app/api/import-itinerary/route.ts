import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Time mappings
const TIME_MAP: Record<string, string> = {
  'early morning': '07:00',
  'morning': '09:00',
  'late morning': '11:00',
  'midday': '12:00',
  'lunch': '12:00',
  'lunchtime': '12:00',
  'early afternoon': '13:00',
  'afternoon': '14:00',
  'late afternoon': '16:00',
  'early evening': '17:00',
  'evening': '18:00',
  'late evening': '19:00',
  'night': '20:00',
  'late night': '21:00',
};

// Food/dish keywords
const FOOD_KEYWORDS = [
  'ramen', 'sushi', 'pho', 'khao soi', 'pad thai', 'poke', 'bbq', 'seafood',
  'takoyaki', 'okonomiyaki', 'kushikatsu', 'yakiniku', 'tonkatsu', 'tempura',
  'dim sum', 'dumplings', 'noodles', 'curry', 'satay', 'spring rolls',
  'cao lau', 'banh mi', 'banh xeo', 'white rose', 'shrimp', 'crab',
  'breakfast', 'brunch', 'lunch', 'dinner', 'supper', 'snack',
];

// ============ SKIP DETECTION ============

function shouldSkip(line: string): boolean {
  const l = line.toLowerCase();
  
  // Checkbox/booking items
  if (/^[□☐☑✓✗\[\]]\s/.test(line)) return true;
  if (/📅\s*book/i.test(line)) return true;
  if (/book\s*(ahead|now|this|these|via|\d)/i.test(l)) return true;
  
  // URLs and websites
  if (/\.(com|org|net|jp|vn|th|gov)\b/i.test(l)) return true;
  if (/https?:\/\//i.test(l)) return true;
  
  // Section headers
  if (/^\d+\s*nights?\s*(across|in)/i.test(l)) return true;
  if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d+\s*[-–—]\s*\d/i.test(l)) return true;
  if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d+\s*[-–—]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(l)) return true;
  
  // Booking/planning headers
  if (/^(booking\s*checklist|master\s*booking|trip\s*overview|transport\s*passes)/i.test(l)) return true;
  if (/^(book\s*now|smoke\s*season|monitor\s*air)/i.test(l)) return true;
  if (/sells?\s*out/i.test(l)) return true;
  if (/reserve\s*(online|ahead|early|time)/i.test(l)) return true;
  
  // Pure logistics - SKIP completely
  if (/^(check\s*into?|check\s*out)/i.test(l)) return true;
  if (/^(train|bus|taxi|uber|grab|flight|fly)\s*(to|from)/i.test(l)) return true;
  if (/(train|bus|flight)\s*to\s*\w+\s*(station|hotel|area)/i.test(l)) return true;
  if (/train\s*to\s*hotel/i.test(l)) return true;
  if (/clear\s*customs/i.test(l)) return true;
  if (/^transfer\s*to/i.test(l)) return true;
  if (/^depart\s*(home|for)/i.test(l)) return true;
  if (/^(long[- ]haul|cross\s*the)/i.test(l)) return true;
  if (/activate.*pass/i.test(l)) return true;
  if (/^return\s*(to|back)/i.test(l)) return true;
  if (/^head\s*to\s*(airport|hotel)/i.test(l)) return true;
  if (/flight\s*across/i.test(l)) return true;
  if (/^arrive\s*(at|in)\s*(narita|haneda|airport)/i.test(l)) return true;
  
  // In-transit day content
  if (/watch\s*movies/i.test(l)) return true;
  if (/prepare\s*for\s*adventure/i.test(l)) return true;
  if (/date\s*line/i.test(l)) return true;
  
  // Empty or just punctuation
  if (/^[\s•\-*□\[\]✓✗]+$/.test(line)) return true;
  if (line.length < 3) return true;
  
  return false;
}

// ============ CITY & DATE DETECTION ============

function detectCitySection(line: string): string | null {
  // "Tokyo — 2 nights" or "Chiang Mai — 4 nights"
  // Match: City name, then dash/emdash, then number, then "night(s)"
  const match = line.match(/^([A-Za-z][A-Za-z\s]+)\s*[-–—]+\s*(\d+)\s*nights?/i);
  if (match) {
    return match[1].trim();
  }
  // "Tokyo (Round 2) — 4 nights"
  const match2 = line.match(/^([A-Za-z][A-Za-z\s]+)\s*\([^)]+\)\s*[-–—]+\s*\d+\s*nights?/i);
  if (match2) {
    return match2[1].trim();
  }
  return null;
}

function detectDayHeader(line: string, startDate: string): { dayNumber: number; date: string } | null {
  // "Day 2 - Thu, Feb 12" format - capture day number, then month (Feb) and date (12)
  const withDate = line.match(/^day\s*(\d+)\s*[-–—]\s*\w+,?\s*(\w{3})\s+(\d{1,2})/i);
  if (withDate) {
    const dayNumber = parseInt(withDate[1], 10);
    const month = withDate[2]; // "Feb"
    const day = parseInt(withDate[3], 10); // "12"
    const date = parseMonthDay(month, day, startDate);
    return { dayNumber, date };
  }
  
  // "Day 1" simple format (no date)
  const simple = line.match(/^day\s*(\d+)\s*$/i);
  if (simple) {
    const dayNumber = parseInt(simple[1], 10);
    const date = addDays(startDate, dayNumber - 1);
    return { dayNumber, date };
  }
  
  return null;
}

// Check if line is a day theme/title (comes right after day header, should be skipped)
function isDayTheme(line: string): boolean {
  const l = line.toLowerCase();
  
  // Don't skip ARRIVE lines - those are valid content
  if (/^arrive\s/i.test(line)) return false;
  
  // "In Transit", "Arrive Tokyo & Recovery", "Harry Potter Studio Tour"
  if (/^in\s*transit$/i.test(line)) return true;
  if (/&\s*(recovery|nature|culture|exploration)/i.test(l)) return true;
  if (/studio\s*tour$/i.test(l)) return true;
  if (/day\s*trip$/i.test(l)) return true;
  if (/^(temples?|beach|leisure)\s*&/i.test(l)) return true;
  // Short title-like lines with & or multiple capital words (but not "Arrive X")
  if (/^[A-Z][a-z]+(\s+(&\s+)?[A-Z][a-z]+)+$/.test(line) && line.length < 40 && !line.includes('•')) return true;
  return false;
}

function parseMonthDay(monthStr: string, day: number, startDate: string): string {
  const months: Record<string, number> = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
  };
  const month = months[monthStr.toLowerCase().slice(0, 3)];
  if (month === undefined) return startDate;
  const year = parseInt(startDate.split('-')[0], 10);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// ============ CLASSIFICATION ============

function classifyLine(text: string): 'skip' | 'arrive' | 'explore' | 'meal' | 'vague' | 'place' {
  const l = text.toLowerCase();
  
  // SKIP - logistics and travel (but NOT if it contains meal info)
  if (/^pack\s*(up)?$/i.test(l)) return 'skip';
  if (/convenience\s*store/i.test(l)) return 'skip';
  if (/^travel\s*to\b/i.test(l)) return 'skip';
  if (/\bflight\b.*→/i.test(l)) return 'skip';
  if (/\bflight\s+(to|across)\b/i.test(l)) return 'skip';
  if (/^(morning|afternoon|evening)\s*flight/i.test(l)) return 'skip';
  if (/via\s*(bangkok|singapore|hong kong)/i.test(l)) return 'skip';
  // Train/bus logistics
  if (/^train\s+to\s+/i.test(l)) return 'skip';
  if (/^bus\s+to\s+/i.test(l)) return 'skip';
  if (/station\s+for\s+/i.test(l)) return 'skip';
  // Depart/arrive logistics
  if (/^depart\s+(home|for)/i.test(l)) return 'skip';
  if (/^(long[- ]?haul|cross\s+the)/i.test(l)) return 'skip';
  if (/rest\s+up,?\s+watch/i.test(l)) return 'skip';
  if (/date\s+line/i.test(l)) return 'skip';
  // "Return to X" without meal → skip; with meal → handled below as meal
  if (/^(return|head)\s*(to|back)/i.test(l) && !/dinner|lunch|breakfast/i.test(l)) return 'skip';
  // Light exploration = skip (not a real activity)
  if (/^light\s+exploration/i.test(l)) return 'skip';
  
  // ARRIVE - "Arrive X" patterns
  if (/^arrive\s/i.test(text)) return 'arrive';
  if (/^arrival\s/i.test(text)) return 'arrive';
  
  // EXPLORE - ONLY "Explore [Area/neighborhood]" patterns, NOT "Explore [things]"
  // Valid: "Explore Shibuya area", "Explore the old town", "Wander Nimman"
  // Invalid: "Explore Butterbeer, Hogwarts" (these are things, not areas)
  // If line starts with "Explore" but has commas, it's listing things - SKIP it
  if (/^explore\s+/i.test(l) && l.includes(',')) return 'skip';
  if (/^(explore|wander)\s+\w+\s*(area|neighborhood|district|quarter|town|village|streets?)?\s*$/i.test(text)) return 'explore';
  if (/^(first\s*wander|light\s*exploration)\s+/i.test(l)) return 'explore';
  if (/^stroll\s*through\s+/i.test(l)) return 'explore';
  
  // PLACE - "Full day at X" or "Day at X" patterns → treat as PLACE
  if (/^(full\s*day|half\s*day|day)\s*(at|in)\s+/i.test(l)) return 'place';
  
  // PLACE - specific attractions with keywords (check BEFORE meals)
  const placeKeywords = /\b(temple|shrine|wat|museum|palace|castle|park|mountain|falls|waterfall|market|bazaar|tower|bridge|memorial|statue|garden|pagoda|cave|island|bay|village|studios?|disneysea|disneyland|zoo|aquarium|sanctuary|ruins|unesco|heritage|walking\s*street|cooking\s*class|sky)\b/i;
  if (placeKeywords.test(l)) return 'place';
  
  // MEAL - has food keywords or is a meal time
  const hasFoodKeyword = FOOD_KEYWORDS.some(f => l.includes(f));
  if (hasFoodKeyword) return 'meal';
  if (/^(early\s*)?(breakfast|brunch|lunch|dinner)/i.test(l)) return 'meal';
  if (/,\s*dinner\s*(in|at|nearby)?/i.test(l)) return 'meal';
  
  // VAGUE - rest, leisure, suggestions
  if (/\b(rest|relax|sleep\s*(in|early)?|nap|lazy|chill)\b/i.test(l)) return 'vague';
  if (/\b(free\s*day|no\s*plans|no\s*agenda|leisure)/i.test(l)) return 'vague';
  if (/\b(beach\s*time|pool\s*time|spa\s*day|massage)\b/i.test(l)) return 'vague';
  if (/\b(first\s*(taste|swim)|evening\s*stroll)\b/i.test(l)) return 'vague';
  if (/\b(jet\s*lag|recovery)\b/i.test(l)) return 'vague';
  if (/\b(whatever|earned\s*it|you.ve\s*earned)\b/i.test(l)) return 'vague';
  if (/^(optional|if\s*(time|energy))/i.test(l)) return 'vague';
  
  // PLACE - proper nouns (capitalized words) - 2+ capitalized words
  const properNounPattern = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+/;
  if (properNounPattern.test(text) && text.length > 5) return 'place';
  
  // PLACE - specific named places
  if (/^(big\s*buddha|golden\s*bridge|diamond\s*head|pearl\s*harbor)/i.test(l)) return 'place';
  
  // Default to vague if we can't classify
  return 'vague';
}

// ============ CONTENT EXTRACTION ============

function extractContent(line: string): { time: string; text: string } {
  const text = line
    .replace(/^[\s•\-*\d.]+/, '')  // Remove bullets/numbers
    .replace(/📅[^:]*:?\s*/g, '')   // Remove booking emoji notes
    .replace(/\s*—\s*don't\s*miss.*$/i, '')  // Remove "— don't miss this!"
    .replace(/\s*\([^)]*optional[^)]*\)/gi, '')  // Remove "(optional)" notes
    .trim();
  
  // Extract time from prefix ONLY if followed by colon like "Morning:" or "Afternoon:"
  for (const [key, time] of Object.entries(TIME_MAP)) {
    const regex = new RegExp(`^${key}:\\s*`, 'i');
    if (regex.test(text)) {
      return { time, text: text.replace(regex, '').trim() };
    }
  }
  
  // Check for time words at start (like "Morning exploration") - extract time but keep text
  const lower = text.toLowerCase();
  for (const [key, time] of Object.entries(TIME_MAP)) {
    if (lower.startsWith(key)) {
      return { time, text };  // Keep full text like "Evening stroll"
    }
  }
  
  // Check for embedded time words
  for (const [key, time] of Object.entries(TIME_MAP)) {
    if (lower.includes(key)) {
      return { time, text };
    }
  }
  
  return { time: '09:00', text };
}

// Format note with proper prefix (returns null if should be skipped)
function formatNote(text: string, noteType: 'arrive' | 'explore' | 'meal' | 'vague'): string | null {
  // Capitalize first letter
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  
  if (noteType === 'meal') {
    // Extract just the food item
    let dish = text;
    // Remove "Return to X, " prefix if present
    dish = dish.replace(/^(return|head)\s*(to|back)\s*[^,]+,\s*/i, '');
    // Remove trailing location phrases
    dish = dish.replace(/\s*(nearby|in\s*the\s*area|somewhere\s*scenic|in\s*\w+)$/i, '');
    // Remove "dinner at", "lunch -", etc.
    dish = dish.replace(/^(early\s*)?(breakfast|brunch|lunch|dinner|supper)\s*(at|in|:|—|-)\s*/i, '');
    // Remove leading dash/hyphen
    dish = dish.replace(/^[-–—]\s*/, '');
    dish = dish.trim();
    // If only generic words left, return null to signal SKIP
    const genericWords = ['dinner', 'lunch', 'breakfast', 'brunch', 'supper', 'local spot', 'local cuisine', 'the area', 'area', 'nearby'];
    if (!dish || dish.length < 3 || genericWords.includes(dish.toLowerCase())) {
      return null; // Signal to skip this line
    }
    // Capitalize
    dish = capitalize(dish);
    return `Recommended dishes: ${dish}`;
  }
  
  if (noteType === 'vague') {
    // Keep full text but clean up - DON'T remove time words like "Evening"
    let suggestion = text;
    // Only remove trailing notes like "— don't miss this"
    suggestion = suggestion.replace(/\s*[-–—]\s*(don't|do not|must|highly).*$/gi, '');
    suggestion = capitalize(suggestion.trim());
    return `Suggestion: ${suggestion}`;
  }
  
  // arrive and explore - keep as is but capitalize
  return capitalize(text.trim());
}

// ============ GOOGLE PLACES ============

async function searchPlace(name: string, city?: string): Promise<{
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string | null;
} | null> {
  if (!GOOGLE_API_KEY) return null;
  
  try {
    // Clean up search query
    const searchName = name
      .replace(/\s*[-–—].*$/, '')  // Remove dash and description
      .replace(/\s*\([^)]+\)/g, '')  // Remove parenthetical notes
      .trim();
    
    const query = city ? `${searchName} ${city}` : searchName;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const place = data.results?.[0];
    if (!place) return null;
    
    let imageUrl: string | null = null;
    if (place.photos?.[0]?.photo_reference) {
      imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`;
    }
    
    return {
      name: place.name || searchName,
      address: place.formatted_address,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      imageUrl,
    };
  } catch {
    return null;
  }
}

// ============ CSV PARSER ============

async function parseCSV(text: string, startDate: string): Promise<{ days: Array<{ dayNumber: number; date: string; city?: string; activities: Array<{ id: string; name: string; time?: string; type: string; isNote: boolean; imageUrl?: string | null; rating?: number; reviewCount?: number; address?: string; lat?: number; lng?: number }> }> }> {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  // Skip header row if present
  const firstLine = lines[0]?.toLowerCase() || '';
  const startIdx = (firstLine.includes('date') && firstLine.includes('time')) ? 1 : 0;
  
  // Group activities by date
  const dayMap = new Map<string, Array<{ time: string; place: string }>>();
  
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    // Parse CSV - handle both comma and tab separated
    const parts = line.includes('\t') ? line.split('\t') : line.split(',');
    if (parts.length < 3) continue;
    
    const date = parts[0].trim();
    const time = parts[1].trim();
    const place = parts.slice(2).join(',').trim(); // Rejoin in case place name has commas
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    
    if (!dayMap.has(date)) {
      dayMap.set(date, []);
    }
    dayMap.get(date)!.push({ time, place });
  }
  
  // Convert to days array
  const sortedDates = [...dayMap.keys()].sort();
  const days = [];
  let activityIndex = 0;
  
  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const activities = dayMap.get(date)!;
    
    const dayActivities = [];
    for (const { time, place } of activities) {
      // Google lookup for the place
      const placeData = await searchPlace(place, undefined);
      
      dayActivities.push({
        id: `imported-${Date.now()}-${activityIndex++}`,
        name: placeData?.name || place,
        time,
        type: 'activity',
        isNote: false,
        imageUrl: placeData?.imageUrl || null,
        rating: placeData?.rating,
        reviewCount: placeData?.reviewCount,
        address: placeData?.address,
        lat: placeData?.lat,
        lng: placeData?.lng,
      });
    }
    
    days.push({
      dayNumber: i + 1,
      date,
      activities: dayActivities,
    });
  }
  
  return { days };
}

// Detect if text is CSV format
function isCSVFormat(text: string): boolean {
  const lines = text.split('\n').slice(0, 5);
  // Check if lines have date pattern at start and are comma/tab separated
  let csvLineCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Check for YYYY-MM-DD at start or "Date" header
    if (/^\d{4}-\d{2}-\d{2}[,\t]/.test(trimmed) || /^date[,\t]/i.test(trimmed)) {
      csvLineCount++;
    }
  }
  return csvLineCount >= 2;
}

// ============ MAIN PARSER ============

export async function POST(request: NextRequest) {
  try {
    const { text, startDate } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }
    
    const effectiveStartDate = startDate || new Date().toISOString().split('T')[0];
    
    // Check if it's CSV format
    if (isCSVFormat(text)) {
      const result = await parseCSV(text, effectiveStartDate);
      return NextResponse.json({
        ...result,
        totalDays: result.days.length,
        totalActivities: result.days.reduce((sum, d) => sum + d.activities.length, 0),
      });
    }
    
    const lines = text.split('\n');
    
    type Activity = {
      id: string;
      name: string;
      time?: string;
      type: string;
      isNote: boolean;
      noteType?: 'arrive' | 'explore' | 'meal' | 'vague';
      imageUrl?: string | null;
      rating?: number;
      reviewCount?: number;
      address?: string;
      lat?: number;
      lng?: number;
    };
    
    type Day = {
      dayNumber: number;
      date: string;
      city?: string;
      activities: Activity[];
    };
    
    const days: Day[] = [];
    let currentDay: Day | null = null;
    let currentCity: string | undefined = undefined;
    let activityIndex = 0;
    let timeSlot = 9; // Start at 9am, increment for each activity
    let vagueNotes: string[] = []; // Collect vague suggestions to combine later
    let mealNotes: string[] = []; // Collect meal recommendations to combine later
    
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      
      // Check for day header FIRST (before city section)
      const dayHeader = detectDayHeader(line, effectiveStartDate);
      if (dayHeader) {
        // Before starting new day, add combined notes to current day
        if (currentDay && (vagueNotes.length > 0 || mealNotes.length > 0)) {
          // Combine suggestions and meals into one top box
          const topNotes: string[] = [];
          if (vagueNotes.length > 0) topNotes.push(`Suggestion: ${vagueNotes.join(' · ')}`);
          if (mealNotes.length > 0) topNotes.push(mealNotes.join(' · '));
          
          currentDay.activities.unshift({
            id: `imported-${Date.now()}-${activityIndex++}`,
            name: topNotes.join(' · '),
            type: 'note',
            isNote: true,
            noteType: 'vague',
          });
          vagueNotes = [];
          mealNotes = [];
        }
        if (currentDay && currentDay.activities.length > 0) {
          days.push(currentDay);
        }
        currentDay = {
          dayNumber: dayHeader.dayNumber,
          date: dayHeader.date,
          city: currentCity,
          activities: [],
        };
        timeSlot = 9;
        continue;
      }
      
      // Check for city section header
      const citySection = detectCitySection(line);
      if (citySection) {
        currentCity = citySection;
        continue;
      }
      
      // Skip date range lines like "Feb 11-13"
      if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d+/i.test(line)) continue;
      
      // Skip irrelevant lines
      if (shouldSkip(line)) continue;
      
      // Skip day theme lines (e.g., "In Transit", "Arrive Tokyo & Recovery", "Harry Potter Studio Tour")
      if (isDayTheme(line)) continue;
      
      // If no current day yet, skip (we're in preamble)
      if (!currentDay) continue;
      
      // Extract and classify content
      const { time: extractedTime, text: cleanText } = extractContent(line);
      if (!cleanText || cleanText.length < 3) continue;
      
      // Only split by comma if it looks like separate activities (not a sentence with commas)
      // E.g., "Evening stroll, first taste of khao soi" → split
      // E.g., "Feed, walk with, and bathe elephants" → don't split (it's one activity)
      let items = [cleanText];
      if (cleanText.includes(',') && !cleanText.includes(' and ')) {
        const parts = cleanText.split(',').map(s => s.trim()).filter(s => s.length > 2);
        // Only split if each part starts with a capital letter (separate activities)
        const allCapitalized = parts.every(p => /^[A-Z]/.test(p) || /^(first|early|late)/.test(p.toLowerCase()));
        if (allCapitalized && parts.length <= 3) {
          items = parts;
        }
      }
      
      for (const item of items) {
        const classification = classifyLine(item);
        if (classification === 'skip') continue;
      
      // Determine time
      let time = extractedTime;
      if (time === '09:00' && classification !== 'vague') {
        // Auto-increment time for activities without explicit time
        time = `${String(timeSlot).padStart(2, '0')}:00`;
        timeSlot = Math.min(timeSlot + 1, 21); // Cap at 9pm
      }
      
        if (classification === 'place') {
          // Google lookup for places
          const placeData = await searchPlace(item, currentCity);
          
          currentDay.activities.push({
            id: `imported-${Date.now()}-${activityIndex++}`,
            name: placeData?.name || item,
            time,
            type: 'activity',
            isNote: false,
            imageUrl: placeData?.imageUrl || null,
            rating: placeData?.rating,
            reviewCount: placeData?.reviewCount,
            address: placeData?.address,
            lat: placeData?.lat,
            lng: placeData?.lng,
          });
        } else {
          // Note - format with proper prefix
          const formattedName = formatNote(item, classification);
          
          // If formatNote returns null, skip this line (e.g., "dinner" with no dish name)
          if (formattedName === null) continue;
          
          if (classification === 'vague') {
            // Collect vague notes to combine later (strip "Suggestion: " prefix for now)
            const suggestion = formattedName.replace(/^Suggestion:\s*/i, '');
            vagueNotes.push(suggestion);
          } else if (classification === 'meal') {
            // Collect meal notes to show at top (keep the full text)
            mealNotes.push(formattedName);
          } else {
            // arrive, explore go in timeline
            currentDay.activities.push({
              id: `imported-${Date.now()}-${activityIndex++}`,
              name: formattedName,
              time,
              type: 'note',
              isNote: true,
              noteType: classification,
            });
          }
        }
      } // end for items
    }
    
    // Add combined notes to last day
    if (currentDay && (vagueNotes.length > 0 || mealNotes.length > 0)) {
      const topNotes: string[] = [];
      if (vagueNotes.length > 0) topNotes.push(`Suggestion: ${vagueNotes.join(' · ')}`);
      if (mealNotes.length > 0) topNotes.push(mealNotes.join(' · '));
      
      currentDay.activities.unshift({
        id: `imported-${Date.now()}-${activityIndex++}`,
        name: topNotes.join(' · '),
        type: 'note',
        isNote: true,
        noteType: 'vague',
      });
    }
    
    // Push last day
    if (currentDay && currentDay.activities.length > 0) {
      days.push(currentDay);
    }
    
    const totalActivities = days.reduce((sum, d) => sum + d.activities.length, 0);
    
    return NextResponse.json({
      days,
      totalDays: days.length,
      totalActivities,
    });
    
  } catch (error) {
    console.error('Import itinerary error:', error);
    return NextResponse.json({ error: 'Failed to parse itinerary' }, { status: 500 });
  }
}
