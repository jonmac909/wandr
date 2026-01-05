/**
 * Fix flight durations in existing itineraries
 * Extracts duration from notes/description like "10hr flight" and updates the activity
 */

import { Itinerary, DayPlan, TimeBlock } from '@/types/itinerary';

/**
 * Extract flight duration from text (e.g., "10hr flight", "3.5 hour flight", "12h")
 * Returns duration in minutes, or null if not found
 */
function extractFlightDuration(text: string): number | null {
  if (!text) return null;

  const lowerText = text.toLowerCase();

  // Pattern: "10hr", "10 hr", "10hour", "10 hour", "10h", "3.5hr", etc.
  const match = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour|h)(?:s)?(?:\s*flight)?/i);

  if (match) {
    const hours = parseFloat(match[1]);
    return Math.round(hours * 60); // Convert to minutes
  }

  return null;
}

/**
 * Check if a block is a flight or transit that might need duration fix
 */
function isFlightOrTransit(block: TimeBlock): boolean {
  if (!block.activity) return false;

  const category = block.activity.category;
  const name = block.activity.name?.toLowerCase() || '';

  return (
    category === 'flight' ||
    category === 'transit' ||
    name.includes('flight') ||
    name.includes('fly') ||
    name.includes('✈️')
  );
}

/**
 * Fix durations for a single day
 */
function fixDayDurations(day: DayPlan): { day: DayPlan; fixedCount: number } {
  let fixedCount = 0;

  const updatedBlocks = day.blocks.map((block) => {
    if (!isFlightOrTransit(block) || !block.activity) {
      return block;
    }

    // Try to extract duration from notes or description
    const textToSearch = `${block.notes || ''} ${block.activity.description || ''} ${block.activity.name || ''}`;
    const extractedDuration = extractFlightDuration(textToSearch);

    // Only update if we found a duration and it's different (and longer than 2 hours)
    if (extractedDuration && extractedDuration > 120) {
      const currentDuration = block.activity.duration || 0;

      // Only fix if the extracted duration is significantly different
      if (Math.abs(extractedDuration - currentDuration) > 30) {
        fixedCount++;
        return {
          ...block,
          activity: {
            ...block.activity,
            duration: extractedDuration,
          },
        };
      }
    }

    return block;
  });

  return {
    day: { ...day, blocks: updatedBlocks },
    fixedCount,
  };
}

/**
 * Fix all flight durations in an itinerary
 * Returns the updated itinerary and count of fixed durations
 */
export function fixFlightDurations(itinerary: Itinerary): {
  itinerary: Itinerary;
  fixedCount: number;
  details: string[];
} {
  let totalFixed = 0;
  const details: string[] = [];

  const updatedDays = itinerary.days.map((day) => {
    const { day: updatedDay, fixedCount } = fixDayDurations(day);

    if (fixedCount > 0) {
      totalFixed += fixedCount;

      // Log details about what was fixed
      updatedDay.blocks.forEach((block, idx) => {
        if (block.activity && isFlightOrTransit(block)) {
          const originalBlock = day.blocks[idx];
          const originalDuration = originalBlock?.activity?.duration || 0;
          const newDuration = block.activity.duration || 0;

          if (originalDuration !== newDuration) {
            const hours = Math.floor(newDuration / 60);
            const mins = newDuration % 60;
            details.push(
              `Day ${day.dayNumber}: ${block.activity.name} - ${Math.floor(originalDuration / 60)}h → ${hours}h${mins > 0 ? ` ${mins}m` : ''}`
            );
          }
        }
      });
    }

    return updatedDay;
  });

  return {
    itinerary: {
      ...itinerary,
      days: updatedDays,
      updatedAt: new Date(),
    },
    fixedCount: totalFixed,
    details,
  };
}

/**
 * Scan itinerary for potential duration issues without fixing
 * Returns list of flights that might have incorrect durations
 */
export function scanForDurationIssues(itinerary: Itinerary): {
  issues: Array<{
    dayNumber: number;
    activityName: string;
    currentDuration: number;
    suggestedDuration: number | null;
  }>;
} {
  const issues: Array<{
    dayNumber: number;
    activityName: string;
    currentDuration: number;
    suggestedDuration: number | null;
  }> = [];

  itinerary.days.forEach((day) => {
    day.blocks.forEach((block) => {
      if (!isFlightOrTransit(block) || !block.activity) return;

      const textToSearch = `${block.notes || ''} ${block.activity.description || ''} ${block.activity.name || ''}`;
      const extractedDuration = extractFlightDuration(textToSearch);
      const currentDuration = block.activity.duration || 0;

      // Flag if extracted duration is significantly different
      if (extractedDuration && Math.abs(extractedDuration - currentDuration) > 30) {
        issues.push({
          dayNumber: day.dayNumber,
          activityName: block.activity.name,
          currentDuration,
          suggestedDuration: extractedDuration,
        });
      }
    });
  });

  return { issues };
}

/**
 * Known airport code typos/corrections
 */
const AIRPORT_CODE_FIXES: Record<string, string> = {
  'KLW': 'YLW', // Kelowna - common typo
};

/**
 * Fix airport code typos in activity names and descriptions
 * Returns the updated itinerary and list of fixes applied
 */
export function fixAirportCodes(itinerary: Itinerary): {
  itinerary: Itinerary;
  fixedCount: number;
  details: string[];
} {
  let totalFixed = 0;
  const details: string[] = [];

  const updatedDays = itinerary.days.map((day) => {
    const updatedBlocks = day.blocks.map((block) => {
      if (!block.activity) return block;

      let name = block.activity.name || '';
      let description = block.activity.description || '';
      let wasFixed = false;

      // Check each typo and fix it
      for (const [typo, correct] of Object.entries(AIRPORT_CODE_FIXES)) {
        // Fix in name (case-sensitive for airport codes)
        if (name.includes(typo)) {
          const oldName = name;
          name = name.replace(new RegExp(typo, 'g'), correct);
          details.push(`Day ${day.dayNumber}: "${oldName}" → "${name}"`);
          wasFixed = true;
        }
        // Fix in description
        if (description.includes(typo)) {
          description = description.replace(new RegExp(typo, 'g'), correct);
          wasFixed = true;
        }
      }

      if (wasFixed) {
        totalFixed++;
        return {
          ...block,
          activity: {
            ...block.activity,
            name,
            description,
          },
        };
      }

      return block;
    });

    return { ...day, blocks: updatedBlocks };
  });

  return {
    itinerary: {
      ...itinerary,
      days: updatedDays,
      updatedAt: new Date(),
    },
    fixedCount: totalFixed,
    details,
  };
}
