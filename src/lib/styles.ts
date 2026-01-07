/**
 * WANDR DESIGN SYSTEM - Typography & Spacing
 *
 * Use these constants for consistent styling across the app.
 * Import: import { typography, spacing } from '@/lib/styles';
 */

export const typography = {
  // Page titles (e.g., "Wandr" logo, trip title on detail page)
  pageTitle: 'text-xl font-bold',

  // Section headers (e.g., "Hotels", "Transport", "Bucket List")
  sectionTitle: 'text-sm font-semibold',

  // Card headers (e.g., "January 2026", hotel name)
  cardTitle: 'text-sm font-semibold',

  // Compact card headers (trip page widgets)
  cardTitleCompact: 'text-xs font-semibold',

  // Body text
  body: 'text-sm',
  bodySmall: 'text-xs',

  // Labels and meta info (e.g., "3 nights", dates)
  label: 'text-xs text-muted-foreground',
  labelSmall: 'text-[11px] text-muted-foreground',
  labelTiny: 'text-[10px] text-muted-foreground',

  // Badges and tags
  badge: 'text-xs font-medium',
  badgeSmall: 'text-[10px] font-medium',

  // Calendar specific
  calendarDay: 'text-xs font-medium',
  calendarDayCompact: 'text-[10px] font-medium',
  calendarHeader: 'text-[10px] font-medium',
  calendarHeaderCompact: 'text-[9px] font-medium',
  calendarLegend: 'text-[9px] text-muted-foreground',
  calendarLegendCompact: 'text-[8px] text-muted-foreground',
};

export const spacing = {
  // Card padding
  cardPadding: 'p-3',
  cardPaddingCompact: 'p-2',
  cardPaddingTight: 'p-1.5',

  // Section gaps
  sectionGap: 'gap-3',
  sectionGapCompact: 'gap-2',
  sectionGapTight: 'gap-1.5',

  // Item gaps (within lists)
  itemGap: 'gap-2',
  itemGapCompact: 'gap-1.5',
  itemGapTight: 'gap-1',
};

export const colors = {
  // Category colors (for dots, badges, icons)
  transport: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
  },
  hotel: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    dot: 'bg-purple-500',
  },
  food: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    dot: 'bg-orange-500',
  },
  activity: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
    dot: 'bg-yellow-500',
  },

  // Status badges
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
  pending: 'bg-orange-100 text-orange-700',
};

/**
 * Quick reference:
 *
 * FONT SIZES (Tailwind):
 * - text-xl: 20px (page titles only)
 * - text-lg: 18px (large section titles, rare)
 * - text-base: 16px (default body, rarely used)
 * - text-sm: 14px (section titles, card headers, body)
 * - text-xs: 12px (labels, compact headers, small body)
 * - text-[11px]: 11px (small labels)
 * - text-[10px]: 10px (tiny labels, calendar days)
 * - text-[9px]: 9px (calendar headers, legends)
 * - text-[8px]: 8px (compact legends)
 *
 * FONT WEIGHTS:
 * - font-bold: Page titles only
 * - font-semibold: Section/card headers
 * - font-medium: Labels, calendar days
 * - (default): Body text
 */
