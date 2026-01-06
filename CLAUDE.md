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

## Ground Rules

- Start replies with 🔧 emoji
- Be succinct - avoid verbose explanations
- Work in small, verifiable steps
- Always check TypeScript errors before committing: `npx tsc --noEmit`
- Deploy: push to GitHub (Netlify auto-deploys). If deploy doesn't trigger, use empty commit: `git commit --allow-empty -m "chore: trigger deploy" && git push`

## Key Patterns

### Date Handling
Dates stored as ISO strings (`YYYY-MM-DD`). Parse without timezone issues:
```typescript
const [y, m, d] = dateStr.split('-').map(Number);
const date = new Date(y, m - 1, d);
```

### Location Detection
The `getCityForDay()` function in trip page determines where user sleeps each night by checking:
1. Accommodation activity location
2. Last flight destination
3. Any activity location
4. Base data fallback

### Content Filtering
Trip page uses `contentFilter` state: `'overview'|'schedule'|'transport'|'hotels'|'experiences'|'packing'|'docs'|'budget'`

### Responsive Design
- Mobile-first with `md:` breakpoint for desktop
- Left sidebar (map + widgets) hidden on mobile
- Use `compact` prop on components for mobile variants
