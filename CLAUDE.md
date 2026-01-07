# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wandr is a travel planning PWA that helps users create, manage, and track trip itineraries. It uses AI to generate trip plans from user preferences (TripDNA) and stores data locally with optional Supabase cloud sync.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui (Radix primitives)
- **State:** Zustand for questionnaire flow
- **Database:** Dexie.js (IndexedDB) with Supabase cloud sync
- **AI:** Anthropic Claude API for itinerary generation
- **Icons:** lucide-react
- **Deployment:** Netlify (auto-deploys from GitHub main branch)

## Architecture

### Data Flow
```
TripDNA (user preferences) → AI Generation → Itinerary → IndexedDB + Supabase
```

### Core Types (`src/types/`)
- **`trip-dna.ts`** - User travel preferences (destinations, dates, budget, style)
- **`itinerary.ts`** - Full trip structure: days, activities, bases, food, packing

### Database Layer (`src/lib/db/`)
- **`indexed-db.ts`** - Dexie.js wrapper with `tripDb`, `documentDb`, `packingDb`, `preferencesDb`
- **`supabase.ts`** - Cloud sync for trips
- Cloud-first reads with local fallback; writes go to both

### Key Interfaces
```typescript
StoredTrip { id, tripDna, itinerary, status: 'draft'|'generated'|'active'|'completed' }
Itinerary { meta, route: { bases, movements }, days: DayPlan[], foodLayer, packingLayer }
DayPlan { date, blocks: TimeBlock[], theme }
TimeBlock { activity: Activity, priority, isLocked }
```

### Pages (`src/app/`)
- **`/`** - Dashboard with trip list, stats, calendar
- **`/questionnaire`** - Multi-step trip preferences form
- **`/trip/[id]`** - Trip detail view with overview, schedule, transport, hotels, packing tabs
- **`/plan-mode`** - AI trip generation interface

### Components (`src/components/`)
- **`dashboard/`** - Dashboard widgets (FeaturedTripCard, MonthCalendar, StatsPanel, WorldMap)
- **`itinerary/`** - Trip display (DayCard, PackingListView, FoodLayerView)
- **`trip/`** - Trip-specific (TripRouteMap)
- **`ui/`** - shadcn/ui primitives (Button, Card, Input, etc.)
- **`questionnaire/`** - Form step components

### Hooks (`src/hooks/`)
- **`useDashboardData.ts`** - Aggregates trip data for dashboard
- **`useTripStats.ts`** - Calculates trip statistics, date ranges

### Database Hooks (`src/lib/db/use-trip-db.ts`)
- **`useTrips()`** - Load all trips with `{ trips, loading, error, refresh }`
- **`useTrip(tripId)`** - Load single trip with `{ trip, loading, error, refresh, updateTrip, deleteTrip }`

## Terminology

- **Dashboard** = Home page (`/`) with calendar, featured trip, stats, map
- **Trip page** = `/trip/[id]` with Overview, Schedule, Transport, Hotels widgets

## Ground Rules

- Start replies with 🔧 emoji
- Be succinct - avoid verbose explanations
- Work in small, verifiable steps
- Always check TypeScript errors before committing: `npx tsc --noEmit`
- Deploy: push to GitHub (Netlify auto-deploys). If deploy doesn't trigger, use empty commit: `git commit --allow-empty -m "chore: trigger deploy" && git push`
- **Always push to live after completing tasks** unless explicitly told not to

## Key Patterns

### Date Handling
Dates stored as ISO strings (`YYYY-MM-DD`). Parse without timezone issues:
```typescript
const [y, m, d] = dateStr.split('-').map(Number);
const date = new Date(y, m - 1, d);
```

### Location Detection
The `getCityForDay()` function in trip page determines where user sleeps each night by checking:
1. Custom location override (`customLocation` field on DayPlan)
2. Accommodation activity location
3. Last flight destination
4. Any activity location
5. Base data fallback

**IMPORTANT Location Rules:**
- **NEVER display airport codes** (YLW, HNL, etc.) - always convert to city names (Kelowna, Honolulu)
- **Merge equivalent locations**: Oahu = Honolulu = Waikiki (they're the same place)
- The `normalizeLocation()` function handles these conversions
- Airport code mappings are in `AIRPORT_TO_CITY` constant and `airportToCityMap` inside `getCityForDay()`

### Content Filtering
Trip page uses `contentFilter` state: `'overview'|'schedule'|'transport'|'hotels'|'experiences'|'packing'|'docs'|'budget'`

### Responsive Design
- Mobile-first with `md:` breakpoint for desktop
- Left sidebar (map + widgets) hidden on mobile
- Use `compact` prop on components for mobile variants

### Design System (`src/lib/styles.ts`)
Typography hierarchy - use consistently:
```
Page titles:      text-xl font-bold       (20px) - "Wandr" logo only
Section titles:   text-sm font-semibold   (14px) - "Hotels", "Transport"
Card headers:     text-sm font-semibold   (14px) - "January 2026", hotel names
Compact headers:  text-xs font-semibold   (12px) - Trip page widgets
Body text:        text-sm or text-xs      (14px/12px)
Labels:           text-xs text-muted-foreground (12px)
Small labels:     text-[10px] or text-[11px]
Tiny (legends):   text-[9px] or text-[8px]
```

Category colors:
- Transport: blue (bg-blue-100, text-blue-600)
- Hotels: purple (bg-purple-100, text-purple-600)
- Food: orange (bg-orange-100, text-orange-600)
- Activities: yellow (bg-yellow-100, text-yellow-600)
