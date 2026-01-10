# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trippified is a travel planning PWA that helps users create, manage, and track trip itineraries. It uses AI to generate trip plans from user preferences (TripDNA) and stores data locally with optional Supabase cloud sync.

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
- **Deployment:** Vercel (auto-deploys from GitHub main branch)

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
- **`/`** - Home dashboard with hero, CTAs, destination inspiration
- **`/plan`** - 2-step trip creation (destinations → preferences)
- **`/my-trips`** - Trip list with upcoming/past sections, stats
- **`/trip/[id]`** - Trip detail OR planning dashboard (if no itinerary yet)
- **`/questionnaire`** - Legacy multi-step trip preferences form
- **`/plan-mode`** - AI trip generation interface

### Components (`src/components/`)
- **`dashboard/`** - Dashboard widgets (DashboardHeader, TripDrawer, DestinationInspiration, MonthCalendar, BucketList, ProfileSettings)
- **`planning/`** - Trip planning curation (PlanningCuration with activities, hotels, neighborhoods, cafes, restaurants)
- **`itinerary/`** - Trip display (DayCard, PackingListView, FoodLayerView, TripOverview)
- **`trip/`** - Trip-specific (TripRouteMap, LeafletMap)
- **`chat/`** - AI chatbot (ChatSheet for trips, GeneralChatSheet for general use)
- **`ui/`** - shadcn/ui primitives (Button, Card, Input, Badge, etc.)
- **`questionnaire/`** - Form step components

### Hooks (`src/hooks/`)
- **`useDashboardData.ts`** - Aggregates trip data for dashboard
- **`useTripStats.ts`** - Calculates trip statistics, date ranges

### Database Hooks (`src/lib/db/use-trip-db.ts`)
- **`useTrips()`** - Load all trips with `{ trips, loading, error, refresh }`
- **`useTrip(tripId)`** - Load single trip with `{ trip, loading, error, refresh, updateTrip, deleteTrip }`

### AI Chatbot (`src/lib/ai/`, `src/components/chat/`)
Claude-powered chatbot for modifying trips via natural language:
- **`chat-tools.ts`** - Tool definitions (get_itinerary, add_activity, search_restaurants, etc.)
- **`tool-handlers.ts`** - Executes tool calls and returns updated itinerary
- **`chat-prompts.ts`** - System prompt builder with trip context
- **`/api/chat/route.ts`** - Streaming SSE endpoint for trip-specific chat
- **`/api/chat/general/route.ts`** - Streaming SSE endpoint for general chat (no trip context)
- **`useChat.ts`** - Hook managing messages, streaming, and multi-turn tool execution

**Two chat variants:**
- `ChatSheet` - Requires trip/itinerary context, can modify trips
- `GeneralChatSheet` - No trip context, for general travel questions

**Flight formatting rules** (in system prompt):
- Format: `[Airline] [ORIGIN]→[DEST] [departure]-[arrival]+[days]`
- Example: `Zipair YVR→NRT 9:50am-1:00pm+1`
- Always set: duration (minutes), cost ({ amount, currency }), tips (["details"])
- Use category `flight` not `transit`

### Booking URLs (`src/lib/booking/urls.ts`)
Generates booking links based on activity category:
- Flights → Google Flights
- Hotels → TripAdvisor (via DuckDuckGo redirect)
- Food/Activities → Google Search
- `parseFlightDetails()` extracts airport codes from activity names

### Route/Map Display
The `TripRouteMap` component shows destinations in order. The `sortedBases` memo builds route order from the schedule:
- Iterates through days using `getCityForDay()` to get each day's city
- Returns unique cities in chronological order
- **Map shows schedule order, NOT route.bases array order**

### Overview Stats
Trip page overview shows countries/cities count:
- Excludes first and last groups (origin/return - typically home city)
- Uses `getFlagForLocation()` for country flags
- Groups consecutive days at same location

## Terminology

- **Dashboard** = Home page (`/`) with hero, plan/import CTAs, destination inspiration
- **Trip page** = `/trip/[id]` with Overview, Schedule, Transport, Hotels widgets
- **Planning dashboard** = Trip page when no itinerary exists (shows curation widgets)

## Ground Rules

- **ALWAYS run `npm run build` before pushing** - catches TypeScript/build errors
- **Live site: https://www.trippified.com** - User tests here, NOT localhost
- **ALWAYS push to deploy:** `git add -A && git commit -m "..." && git push`
- Vercel auto-deploys from GitHub main branch (~1-2 min)

## Key Patterns

### Date Handling
Dates stored as ISO strings (`YYYY-MM-DD`). Parse without timezone issues:
```typescript
const [y, m, d] = dateStr.split('-').map(Number);
const date = new Date(y, m - 1, d);
```

### Multiple Destinations
The `/plan` page supports multiple destinations:
- Stored as `destinations: string[]` array in tripDna.interests
- Display as `destination: "Tokyo → Kyoto → Osaka"` (joined with →)
- Use chips UI with add/remove functionality

### Location Detection
The `getCityForDay()` function in trip page determines where user sleeps each night by checking:
1. Custom location override (`customLocation` field on DayPlan)
2. Accommodation activity location
3. Flight destination (but ORIGIN for overnight flights with +1/+2)
4. Any activity location
5. Base data fallback

**IMPORTANT Location Rules:**
- **NEVER display airport codes** (YLW, HNL, NRT) - always convert to city names
- **Merge airport cities**: Narita/Haneda → Tokyo, NRT → Tokyo
- **Merge equivalent locations**: Oahu = Honolulu = Waikiki
- The `normalizeLocation()` function handles all conversions
- **Overnight flights** (+1 in name): Show origin city, not destination (you're on the plane)

### Country/Flag Detection (`src/lib/geo/city-country.ts`)
- Comprehensive city-to-country database (400+ cities)
- `getFlagForLocation(city)` returns flag emoji for any known city
- `getCountryForCity(city)` returns ISO country code
- Add new cities to `CITY_TO_COUNTRY` map as needed

### Content Filtering
Trip page uses `contentFilter` state: `'overview'|'schedule'|'restaurants'|'docs'`

### Responsive Design
- Mobile-first with `md:` breakpoint for desktop
- Left sidebar (map + widgets) hidden on mobile
- Use `compact` prop on components for mobile variants

### Design System (`src/lib/styles.ts`)
Typography hierarchy:
```
Page titles:      text-xl font-bold       (20px)
Section titles:   text-sm font-semibold   (14px)
Card headers:     text-sm font-semibold   (14px)
Body text:        text-sm or text-xs      (14px/12px)
Labels:           text-xs text-muted-foreground (12px)
Small labels:     text-[10px] or text-[11px]
```

Category colors (PIPELINE_COLORS):
- Overview: red (bg-red-50, text-red-600)
- Schedule: gray (bg-gray-50, text-gray-600)
- Transport: blue (bg-blue-50, text-blue-600)
- Hotels: purple (bg-purple-50, text-purple-600)
- Food: orange (bg-orange-50, text-orange-600)
- Activities: yellow (bg-yellow-50, text-yellow-600)

### Suspense Boundaries
When using `useSearchParams()`, wrap the component in Suspense:
```typescript
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PageContent />
    </Suspense>
  );
}
```
