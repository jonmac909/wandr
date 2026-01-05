// CSV Parser for Notion trip exports
import {
  Itinerary,
  Activity,
  ActivityCategory,
  ReservationStatus,
  TransportMode,
  Attachment,
  DayPlan,
  TimeBlock,
  Base,
  Movement,
  createEmptyItinerary,
} from '@/types/itinerary';

// Raw CSV row from Notion export (original format)
export interface NotionTripRow {
  Date: string;
  Day: string;
  City: string;
  Activity: string;
  Transport: string;
  'Accommodation Address': string;
  Cost: string;
  Reservation: string;
  'Time of Day': string;
  Notes: string;
  'Files & media': string;
}

// New travel CSV format: DAY,DATE,COUNTRY,LOCATION,TYPE,DETAILS,ACTIVITIES / NOTES,COST
export interface TravelCSVRow {
  DAY: string;
  DATE: string;
  COUNTRY: string;
  LOCATION: string;
  TYPE: string;
  DETAILS: string;
  'ACTIVITIES / NOTES': string;
  COST: string;
}

// Detect CSV format based on headers
function detectCSVFormat(headers: string[]): 'notion' | 'travel' | 'unknown' {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  // Travel format: DAY, DATE, COUNTRY, LOCATION, TYPE, DETAILS
  if (lowerHeaders.includes('day') && lowerHeaders.includes('country') && lowerHeaders.includes('type')) {
    return 'travel';
  }

  // Notion format: Date, City, Activity
  if (lowerHeaders.includes('date') && (lowerHeaders.includes('city') || lowerHeaders.includes('activity'))) {
    return 'notion';
  }

  return 'unknown';
}

// Parse CSV string into generic rows
export function parseCSVGeneric(csvContent: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  // Handle BOM and parse header
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseCSVLine(headerLine);

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

// Parse CSV string into rows (legacy, for backwards compatibility)
export function parseCSV(csvContent: string): NotionTripRow[] {
  const { rows } = parseCSVGeneric(csvContent);
  return rows as unknown as NotionTripRow[];
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// Parse date from various formats: DD/MM/YYYY, "Feb 11", etc.
function parseDate(dateStr: string, year?: number): string | null {
  if (!dateStr) return null;

  // Try DD/MM/YYYY format
  const slashParts = dateStr.split('/');
  if (slashParts.length === 3) {
    const [day, month, yr] = slashParts;
    return `${yr}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try "Mon DD" or "MonDD" format (e.g., "Feb 11", "Mar 5")
  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const monthMatch = dateStr.match(/^([A-Za-z]{3})\s*(\d{1,2})$/);
  if (monthMatch) {
    const monthNum = monthNames[monthMatch[1].toLowerCase()];
    const day = monthMatch[2].padStart(2, '0');
    const yr = year || new Date().getFullYear();
    if (monthNum) {
      return `${yr}-${monthNum}-${day}`;
    }
  }

  // Try ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  return null;
}

// Parse day number from "Day 1", "Day 2", etc.
function parseDayNumber(dayStr: string): number | null {
  if (!dayStr) return null;
  const match = dayStr.match(/Day\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

// Parse cost
function parseCost(costStr: string): number {
  if (!costStr) return 0;
  const cleaned = costStr.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

// Parse reservation status
function parseReservationStatus(status: string): ReservationStatus {
  const lower = status.toLowerCase().trim();
  if (lower === 'done') return 'done';
  if (lower === 'pending') return 'pending';
  if (lower === 'cancelled') return 'cancelled';
  return 'not-started';
}

// Parse transport mode
function parseTransport(transport: string): TransportMode | undefined {
  if (!transport) return undefined;
  const lower = transport.toLowerCase().trim();
  if (lower.includes('flight') || lower.includes('fly')) return 'flight';
  if (lower.includes('train')) return 'train';
  if (lower.includes('bus')) return 'bus';
  if (lower.includes('taxi')) return 'taxi';
  if (lower.includes('walk')) return 'walk';
  if (lower.includes('car')) return 'car';
  if (lower.includes('ferry') || lower.includes('boat')) return 'ferry';
  return 'other';
}

// Parse time of day
function parseTimeOfDay(timeStr: string): 'morning' | 'afternoon' | 'evening' | 'night' | undefined {
  if (!timeStr) return undefined;
  const lower = timeStr.toLowerCase().trim();
  if (lower.includes('morning')) return 'morning';
  if (lower.includes('afternoon')) return 'afternoon';
  if (lower.includes('evening')) return 'evening';
  if (lower.includes('night')) return 'night';
  return undefined;
}

// Parse attachments from comma-separated file paths
function parseAttachments(filesStr: string): Attachment[] {
  if (!filesStr) return [];
  return filesStr.split(',').map((path) => {
    const trimmed = path.trim();
    const name = trimmed.split('/').pop() || trimmed;
    const ext = name.split('.').pop()?.toLowerCase() || '';
    let type: Attachment['type'] = 'other';
    if (ext === 'pdf') type = 'pdf';
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) type = 'image';
    else if (['doc', 'docx', 'txt'].includes(ext)) type = 'document';
    return { name, path: trimmed, type };
  });
}

// Determine activity category from activity name
function categorizeActivity(activityName: string): ActivityCategory {
  const lower = activityName.toLowerCase();
  if (lower.includes('fly') || lower.includes('flight')) return 'flight';
  if (lower.includes('checkin') || lower.includes('check in') || lower.includes('check-in')) return 'checkin';
  if (lower.includes('train') || lower.includes('bus') || lower.includes('taxi')) return 'transit';
  if (lower.includes('museum') || lower.includes('palace') || lower.includes('temple') || lower.includes('castle')) return 'sightseeing';
  if (lower.includes('restaurant') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('breakfast') || lower.includes('food') || lower.includes('tasting')) return 'food';
  if (lower.includes('beach') || lower.includes('spa') || lower.includes('relax')) return 'relaxation';
  if (lower.includes('shop') || lower.includes('market')) return 'shopping';
  if (lower.includes('bar') || lower.includes('club') || lower.includes('night')) return 'nightlife';
  if (lower.includes('class') || lower.includes('workshop') || lower.includes('cooking')) return 'workshop';
  if (lower.includes('hike') || lower.includes('walk') || lower.includes('tour')) return 'activity';
  return 'sightseeing';
}

// Extract scheduled time from notes or activity name
function extractScheduledTime(activity: string, notes: string): string | undefined {
  const combined = `${activity} ${notes}`;
  // Look for patterns like "9:30am", "10:00", "@ 9:00am"
  const match = combined.match(/(\d{1,2}:\d{2})(?:\s*(?:am|pm))?/i);
  return match ? match[1] : undefined;
}

// Parse hours string to duration in minutes
// Supports: "2h", "2.5", "1h 30m", "90 min", "1:30", "2 hours"
function parseHoursToDuration(hoursStr: string): number {
  if (!hoursStr) return 0;
  const str = hoursStr.trim().toLowerCase();

  // Pattern: "1h 30m" or "1h30m"
  const hhmm = str.match(/(\d+)\s*h\s*(\d+)\s*m/);
  if (hhmm) {
    return parseInt(hhmm[1], 10) * 60 + parseInt(hhmm[2], 10);
  }

  // Pattern: "2h" or "2 hours"
  const hours = str.match(/^(\d+(?:\.\d+)?)\s*(?:h|hours?)?$/);
  if (hours) {
    return Math.round(parseFloat(hours[1]) * 60);
  }

  // Pattern: "90 min" or "90m"
  const mins = str.match(/^(\d+)\s*(?:m|min|mins|minutes?)$/);
  if (mins) {
    return parseInt(mins[1], 10);
  }

  // Pattern: "1:30" (hours:minutes)
  const colon = str.match(/^(\d+):(\d+)$/);
  if (colon) {
    return parseInt(colon[1], 10) * 60 + parseInt(colon[2], 10);
  }

  // Just a number - assume hours
  const num = parseFloat(str);
  if (!isNaN(num)) {
    return Math.round(num * 60);
  }

  return 0;
}

// Convert CSV rows to Itinerary
export function csvToItinerary(rows: NotionTripRow[], tripName?: string): Itinerary {
  const itinerary = createEmptyItinerary(crypto.randomUUID());

  // Filter rows that have activity data
  const activityRows = rows.filter((row) => row.Activity || row.City);
  if (activityRows.length === 0) return itinerary;

  // Extract all unique cities
  const allCities = new Set<string>();
  activityRows.forEach((row) => {
    if (row.City) {
      row.City.split(',').forEach((city) => {
        const trimmed = city.trim();
        if (trimmed) allCities.add(trimmed);
      });
    }
  });

  // Get date range
  const dates = activityRows
    .map((row) => parseDate(row.Date))
    .filter((d): d is string => d !== null)
    .sort();

  const startDate = dates[0] || '';
  const endDate = dates[dates.length - 1] || '';
  const totalDays = dates.length > 0 ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;

  // Calculate total cost
  const totalCost = activityRows.reduce((sum, row) => sum + parseCost(row.Cost), 0);

  // Update meta
  itinerary.meta = {
    title: tripName || `Trip to ${Array.from(allCities).slice(0, 3).join(', ')}`,
    destination: Array.from(allCities).join(', '),
    destinations: Array.from(allCities),
    startDate,
    endDate,
    totalDays,
    estimatedBudget: {
      currency: 'USD',
      accommodation: 0,
      food: 0,
      activities: totalCost,
      transport: 0,
      misc: 0,
      total: totalCost,
      perDay: totalDays > 0 ? Math.round(totalCost / totalDays) : 0,
    },
  };

  // Group rows by date and create day plans
  const dayMap = new Map<string, NotionTripRow[]>();
  activityRows.forEach((row) => {
    const date = parseDate(row.Date);
    if (date) {
      if (!dayMap.has(date)) {
        dayMap.set(date, []);
      }
      dayMap.get(date)!.push(row);
    }
  });

  // Build accommodation bases
  const accommodations = new Map<string, { name: string; city: string; dates: string[] }>();
  activityRows.forEach((row) => {
    const accom = row['Accommodation Address'];
    const date = parseDate(row.Date);
    if (accom && date) {
      if (!accommodations.has(accom)) {
        accommodations.set(accom, { name: accom, city: row.City, dates: [] });
      }
      accommodations.get(accom)!.dates.push(date);
    }
  });

  // Create bases from accommodations
  const bases: Base[] = [];
  accommodations.forEach((accom, name) => {
    const sortedDates = accom.dates.sort();
    bases.push({
      id: `base-${bases.length + 1}`,
      location: accom.city.split(',')[0].trim(),
      accommodation: {
        name,
        type: 'hotel',
        priceRange: '$$',
      },
      nights: sortedDates.length,
      checkIn: sortedDates[0],
      checkOut: sortedDates[sortedDates.length - 1],
      rationale: `Accommodation in ${accom.city}`,
    });
  });
  itinerary.route.bases = bases;

  // Create day plans
  const sortedDates = Array.from(dayMap.keys()).sort();
  let dayNumber = 1;

  sortedDates.forEach((date) => {
    const dayRows = dayMap.get(date)!;
    const blocks: TimeBlock[] = [];

    dayRows.forEach((row, idx) => {
      if (!row.Activity) return;

      const activity: Activity = {
        id: `act-${date}-${idx}`,
        name: row.Activity,
        category: categorizeActivity(row.Activity),
        description: row.Notes || row.Activity,
        location: row.City ? { name: row.City.split(',')[0].trim() } : undefined,
        duration: 60, // Default 1 hour
        cost: row.Cost ? { amount: parseCost(row.Cost), currency: 'USD', isEstimate: false } : undefined,
        bookingRequired: row.Reservation === 'Done',
        tags: [],
        reservationStatus: parseReservationStatus(row.Reservation),
        transport: parseTransport(row.Transport),
        attachments: parseAttachments(row['Files & media']),
        timeOfDay: parseTimeOfDay(row['Time of Day']),
        scheduledTime: extractScheduledTime(row.Activity, row.Notes),
      };

      const timeOfDay = parseTimeOfDay(row['Time of Day']);
      let blockType: TimeBlock['type'] = 'midday-flex';
      if (timeOfDay === 'morning') blockType = 'morning-anchor';
      else if (timeOfDay === 'evening' || timeOfDay === 'night') blockType = 'evening-vibe';
      if (activity.category === 'transit' || activity.category === 'flight') blockType = 'transit';

      blocks.push({
        id: `block-${date}-${idx}`,
        type: blockType,
        startTime: activity.scheduledTime,
        activity,
        priority: activity.reservationStatus === 'done' ? 'must-see' : 'if-energy',
        isLocked: false,
        notes: row.Notes,
      });
    });

    // Find base for this day
    const dayBase = bases.find((b) => b.checkIn <= date && b.checkOut >= date);

    const dayPlan: DayPlan = {
      id: `day-${date}`,
      date,
      dayNumber,
      baseId: dayBase?.id || '',
      theme: blocks.length > 0 ? blocks[0].activity?.location?.name || undefined : undefined,
      blocks,
    };

    itinerary.days.push(dayPlan);
    dayNumber++;
  });

  // Create movements from transit activities
  const movements: Movement[] = [];
  itinerary.days.forEach((day) => {
    day.blocks.forEach((block) => {
      if (block.activity?.category === 'transit' || block.activity?.category === 'flight') {
        movements.push({
          id: `move-${day.date}-${block.id}`,
          from: '',
          to: '',
          date: day.date,
          transportType: block.activity.transport || 'other',
          duration: 60,
          cost: block.activity.cost,
          notes: block.activity.name,
        });
      }
    });
  });
  itinerary.route.movements = movements;

  // Update timestamps
  itinerary.createdAt = new Date();
  itinerary.updatedAt = new Date();
  itinerary.aiMeta.generatedAt = new Date();
  itinerary.aiMeta.modelUsed = 'csv-import';
  itinerary.aiMeta.routeRationale = 'Imported from Notion CSV export';

  return itinerary;
}

// Convert Travel CSV format to Itinerary
// Format: DAY,DATE,COUNTRY,LOCATION,TYPE,DETAILS,ACTIVITIES / NOTES,COST
export function travelCsvToItinerary(rows: Record<string, string>[], tripName?: string): Itinerary {
  const itinerary = createEmptyItinerary(crypto.randomUUID());

  // Filter out empty rows, section headers (like "🇹🇭 THAILAND"), and SUMMARY rows
  const activityRows = rows.filter((row) => {
    const day = row.DAY || row.Day || '';
    const date = row.DATE || row.Date || '';
    const location = row.LOCATION || row.Location || '';
    const type = row.TYPE || row.Type || '';

    // Skip if it's a section header (emojis with country names)
    if (location.match(/^🛫|^🇹🇭|^🇻🇳|^🇯🇵|^🇺🇸|^SUMMARY/)) return false;

    // Skip empty rows
    if (!day && !date && !location) return false;

    // Must have some useful data
    return day || (date && location) || type;
  });

  if (activityRows.length === 0) return itinerary;

  // Infer the year from context (use current year if not specified)
  const currentYear = new Date().getFullYear();

  // Extract unique countries and locations
  const allCountries = new Set<string>();
  const allLocations = new Set<string>();

  activityRows.forEach((row) => {
    const country = row.COUNTRY || row.Country || '';
    const location = row.LOCATION || row.Location || '';

    if (country && !country.includes('TRANSIT') && !country.includes('🛫')) {
      allCountries.add(country.trim());
    }
    if (location) {
      // Handle "Kelowna → Vancouver" format - extract just the destination
      const parts = location.split('→').map(p => p.trim());
      parts.forEach(p => {
        if (p && !p.match(/^🛫|^🇹🇭|^🇻🇳|^🇯🇵|^🇺🇸/)) {
          allLocations.add(p);
        }
      });
    }
  });

  // Get date range
  const dates = activityRows
    .map((row) => parseDate(row.DATE || row.Date || '', currentYear))
    .filter((d): d is string => d !== null)
    .sort();

  const startDate = dates[0] || '';
  const endDate = dates[dates.length - 1] || '';
  const totalDays = dates.length > 0
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  // Calculate total cost
  const totalCost = activityRows.reduce((sum, row) => {
    const cost = row.COST || row.Cost || '';
    return sum + parseCost(cost);
  }, 0);

  // Update meta
  const destinations = Array.from(allCountries);
  itinerary.meta = {
    title: tripName || `${destinations.slice(0, 3).join(' → ')} Trip`,
    destination: destinations.join(', '),
    destinations,
    startDate,
    endDate,
    totalDays,
    estimatedBudget: {
      currency: 'USD',
      accommodation: 0,
      food: 0,
      activities: totalCost,
      transport: 0,
      misc: 0,
      total: totalCost,
      perDay: totalDays > 0 ? Math.round(totalCost / totalDays) : 0,
    },
  };

  // Group rows by day number
  const dayMap = new Map<number, { date: string; rows: Record<string, string>[] }>();

  activityRows.forEach((row) => {
    const dayStr = row.DAY || row.Day || '';
    const dateStr = row.DATE || row.Date || '';

    // Parse day number - can be "1", "1-2", "41-49" for multi-day spans
    let dayNum = parseInt(dayStr, 10);
    if (isNaN(dayNum)) {
      // Try to extract first number from range like "41-49"
      const match = dayStr.match(/^(\d+)/);
      if (match) {
        dayNum = parseInt(match[1], 10);
      } else {
        return; // Skip if no valid day number
      }
    }

    const date = parseDate(dateStr, currentYear);
    if (!date) return;

    if (!dayMap.has(dayNum)) {
      dayMap.set(dayNum, { date, rows: [] });
    }
    dayMap.get(dayNum)!.rows.push(row);
  });

  // Build accommodation bases from hotel entries
  const accommodations = new Map<string, { name: string; location: string; country: string; dates: string[] }>();

  activityRows.forEach((row) => {
    const type = row.TYPE || row.Type || '';
    const details = row.DETAILS || row.Details || '';
    const location = row.LOCATION || row.Location || '';
    const country = row.COUNTRY || row.Country || '';
    const dateStr = row.DATE || row.Date || '';
    const date = parseDate(dateStr, currentYear);

    if (type.includes('Hotel') || type.includes('🏨') || type.includes('Ryokan') || type.includes('AirBnB')) {
      const hotelName = details.split('(')[0].trim(); // Remove "(X nights)" suffix
      const key = `${hotelName}-${location}`;
      if (date) {
        if (!accommodations.has(key)) {
          accommodations.set(key, { name: hotelName, location, country, dates: [] });
        }
        accommodations.get(key)!.dates.push(date);
      }
    }
  });

  // Create bases from accommodations
  const bases: Base[] = [];
  accommodations.forEach((accom) => {
    const sortedDates = accom.dates.sort();
    // Extract nights from name if present, e.g., "Hotel Name (4 nights)"
    const nightsMatch = accom.name.match(/\((\d+)\s*nights?\)/i);
    const nights = nightsMatch ? parseInt(nightsMatch[1], 10) : sortedDates.length;

    bases.push({
      id: `base-${bases.length + 1}`,
      location: accom.location.split('→').pop()?.trim() || accom.location,
      accommodation: {
        name: accom.name.replace(/\s*\(\d+\s*nights?\)/i, '').trim(),
        type: accom.name.toLowerCase().includes('ryokan') ? 'ryokan' : 'hotel',
        priceRange: '$$',
      },
      nights,
      checkIn: sortedDates[0],
      checkOut: sortedDates[sortedDates.length - 1],
      rationale: `Stay in ${accom.location}, ${accom.country}`,
    });
  });
  itinerary.route.bases = bases;

  // Create day plans
  const sortedDayNumbers = Array.from(dayMap.keys()).sort((a, b) => a - b);

  sortedDayNumbers.forEach((dayNum) => {
    const { date, rows: dayRows } = dayMap.get(dayNum)!;
    const blocks: TimeBlock[] = [];

    dayRows.forEach((row, idx) => {
      const type = row.TYPE || row.Type || '';
      const details = row.DETAILS || row.Details || '';
      const notes = row['ACTIVITIES / NOTES'] || row['Activities / Notes'] || row.NOTES || '';
      const location = row.LOCATION || row.Location || '';
      const country = row.COUNTRY || row.Country || '';
      const costStr = row.COST || row.Cost || '';
      const hoursStr = row.HOURS || row.Hours || row.TIME || row.Time || row.DURATION || row.Duration || '';

      // Determine activity category from TYPE emoji/text
      let category: ActivityCategory = 'activity';
      let blockType: TimeBlock['type'] = 'midday-flex';

      if (type.includes('Flight') || type.includes('✈️')) {
        category = 'flight';
        blockType = 'transit';
      } else if (type.includes('Hotel') || type.includes('🏨') || type.includes('Ryokan')) {
        category = 'accommodation';
        blockType = 'evening-vibe';
      } else if (type.includes('Activity') || type.includes('🐘') || type.includes('🛕') ||
                 type.includes('⛰️') || type.includes('🏍️') || type.includes('🐋') ||
                 type.includes('🏛️') || type.includes('🐃') || type.includes('🥾') ||
                 type.includes('🤼') || type.includes('🎨') || type.includes('⚡')) {
        category = 'activity';
        blockType = 'morning-anchor';
      } else if (type.includes('Theme Park') || type.includes('🎢') || type.includes('🏰')) {
        category = 'activity';
        blockType = 'morning-anchor';
      } else if (type.includes('Leisure') || type.includes('😌') || type.includes('💆') ||
                 type.includes('🌴') || type.includes('☕')) {
        category = 'relaxation';
        blockType = 'midday-flex';
      } else if (type.includes('Day Trip') || type.includes('🚤')) {
        category = 'activity';
        blockType = 'morning-anchor';
      } else if (type.includes('Transfer') || type.includes('Train') || type.includes('🚃') || type.includes('🚗')) {
        category = 'transit';
        blockType = 'transit';
      } else if (type.includes('🏖️') || type.includes('Beach')) {
        category = 'relaxation';
        blockType = 'midday-flex';
      } else if (type.includes('🌿') || type.includes('Nature')) {
        category = 'activity';
        blockType = 'morning-anchor';
      } else if (type.includes('👔') || type.includes('🛍️') || type.includes('Shopping')) {
        category = 'shopping';
        blockType = 'midday-flex';
      }

      // Extract scheduled time from details (e.g., "6:00am-7:15am")
      const timeMatch = details.match(/(\d{1,2}:\d{2})\s*(?:am|pm)?/i);
      const scheduledTime = timeMatch ? convertTo24Hour(timeMatch[0]) : undefined;

      // Create activity name from details or type
      const activityName = details || type.replace(/[🏨✈️🐘🛕😌💆🌴⛰️🏍️🐋🏛️🐃🥾🤼🎨⚡🎢🏰🚤🚃🚗🏖️🌿👔🛍️☕]/g, '').trim();

      // Parse duration from hours column (e.g., "2h", "2.5", "1h 30m", "90 min")
      let duration = category === 'flight' ? 120 : 60; // defaults
      if (hoursStr) {
        const parsed = parseHoursToDuration(hoursStr);
        if (parsed > 0) duration = parsed;
      }

      // For flights/transit, also try to extract duration from notes or details
      // (e.g., "10hr flight", "3.5 hour flight", "12h flight")
      if ((category === 'flight' || category === 'transit') && duration <= 120) {
        const textToSearch = `${notes} ${details}`.toLowerCase();
        const flightDurationMatch = textToSearch.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour|h)\s*(?:flight|train|bus)?/i);
        if (flightDurationMatch) {
          const extractedDuration = Math.round(parseFloat(flightDurationMatch[1]) * 60);
          if (extractedDuration > duration) {
            duration = extractedDuration;
          }
        }
      }

      const activity: Activity = {
        id: `act-${date}-${idx}`,
        name: activityName,
        category,
        description: notes || activityName,
        location: location ? { name: location.split('→').pop()?.trim() || location } : undefined,
        duration,
        cost: costStr ? { amount: parseCost(costStr), currency: 'USD', isEstimate: false } : undefined,
        bookingRequired: category === 'flight' || type.includes('Hotel'),
        tags: [country].filter(Boolean),
        scheduledTime,
      };

      blocks.push({
        id: `block-${date}-${idx}`,
        type: blockType,
        startTime: scheduledTime,
        activity,
        priority: category === 'flight' || type.includes('Hotel') ? 'must-see' : 'if-energy',
        isLocked: false,
        notes,
      });
    });

    // Find base for this day
    const dayBase = bases.find((b) => b.checkIn <= date && b.checkOut >= date);

    // Get theme from the main activity (first non-transit, non-hotel block)
    const mainActivity = blocks.find(b =>
      b.activity?.category !== 'flight' &&
      b.activity?.category !== 'transit' &&
      b.activity?.category !== 'accommodation'
    );
    const theme = mainActivity?.activity?.name ||
                  dayRows[0]?.LOCATION?.split('→').pop()?.trim() ||
                  undefined;

    const dayPlan: DayPlan = {
      id: `day-${date}`,
      date,
      dayNumber: dayNum,
      baseId: dayBase?.id || '',
      theme,
      blocks,
    };

    itinerary.days.push(dayPlan);
  });

  // Create movements from flight/transit activities
  const movements: Movement[] = [];
  itinerary.days.forEach((day) => {
    day.blocks.forEach((block) => {
      if (block.activity?.category === 'transit' || block.activity?.category === 'flight') {
        movements.push({
          id: `move-${day.date}-${block.id}`,
          from: '',
          to: '',
          date: day.date,
          transportType: block.activity.category === 'flight' ? 'flight' : 'other',
          duration: 60,
          cost: block.activity.cost,
          notes: block.activity.name,
        });
      }
    });
  });
  itinerary.route.movements = movements;

  // Update timestamps
  itinerary.createdAt = new Date();
  itinerary.updatedAt = new Date();
  itinerary.aiMeta.generatedAt = new Date();
  itinerary.aiMeta.modelUsed = 'csv-import';
  itinerary.aiMeta.routeRationale = 'Imported from travel CSV';

  return itinerary;
}

// Convert 12-hour time to 24-hour format
function convertTo24Hour(timeStr: string): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!match) return timeStr;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3]?.toLowerCase();

  if (period === 'pm' && hours !== 12) {
    hours += 12;
  } else if (period === 'am' && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// Main function to import CSV - auto-detects format
export function importCSV(csvContent: string, tripName?: string): Itinerary {
  const { headers, rows } = parseCSVGeneric(csvContent);
  const format = detectCSVFormat(headers);

  if (format === 'travel') {
    return travelCsvToItinerary(rows, tripName);
  }

  // Default to Notion format
  return csvToItinerary(rows as unknown as NotionTripRow[], tripName);
}
