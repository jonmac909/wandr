# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wandr (Trippified) is a travel planning PWA that helps users create, manage, and track trip itineraries. Users complete a questionnaire to create a "Trip DNA" (preferences), then curate cities/activities via a swipeable interface, and generate day-by-day itineraries. Data stored locally (IndexedDB) with Supabase cloud sync.

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server at localhost:3000

# Quality Checks (run before pushing)
npm run typecheck        # TypeScript type check only (fast)
npm run check            # TypeScript + ESLint
npm run lint             # ESLint only
npm run build            # Full Next.js build

# Cloudflare Deployment
npm run build:cloudflare # Build for Cloudflare Workers
npm run deploy           # Build and deploy to Cloudflare

# Testing
npm run test             # Run all Playwright tests
npm run test:ui          # Playwright UI mode
npx playwright test tests/homepage.spec.ts  # Run single test file
```

**Pre-push hook**: Husky runs `npm run typecheck` before every push. Failed type checks block the push, preventing Cloudflare build failures.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui (Radix primitives)
- **State:** Zustand for questionnaire flow
- **Database:** Dexie.js (IndexedDB) with Supabase cloud sync
- **APIs:** Google Places API for activities/restaurants, Pexels for images
- **Maps:** Leaflet, OpenStreetMap embeds
- **Icons:** lucide-react
- **Deployment:** Cloudflare Workers via OpenNext

## Environment Variables

Required in `.env.local` (and Cloudflare dashboard for production):
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=  # Google Maps/Places (client-side)
GOOGLE_MAPS_API_KEY=              # Google Maps/Places (server-side)
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anonymous key
```

## Architecture

### Data Flow
```
TripDNA (user preferences) → AI Generation → Itinerary → IndexedDB + Supabase
```

### Core Types (`src/types/`)
- **`trip-dna.ts`** - User travel preferences (destinations, dates, budget, style)
- **`itinerary.ts`** - Full trip structure: days, activities, bases, food, packing

### Database Layer (`src/lib/db/`)
- **`indexed-db.ts`** - Dexie.js wrapper with `tripDb`, `documentDb`, `packingDb`, `preferencesDb`, `savedPlacesDb`
- **`supabase.ts`** - Cloud sync for trips
- Cloud-first reads with local fallback; writes go to both
- **`savedPlacesDb`** - Stores user's saved places from Explore feature (attractions, restaurants, cafes, nightlife)

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
- **`/explore`** - Place discovery with AI recommendations, save places by city/interest
- **`/questionnaire`** - Legacy multi-step trip preferences form
- **`/plan-mode`** - AI trip generation interface

### Components (`src/components/`)
- **`planning/`** - Main trip planning interface
  - **`SwipeablePlanningView.tsx`** - Core component (~4500 lines). Multi-phase trip curation with phases: `'picking'` → `'route-planning'` → `'auto-itinerary'` → `'day-planning'`. Contains city cards, route optimization, hotel picker.
  - **`AutoItineraryView.tsx`** - Day-by-day itinerary display/editing
  - **`RouteMap.tsx`** - Leaflet map for route visualization
- **`dashboard/`** - Dashboard widgets (DashboardHeader, TripDrawer, DestinationInspiration, ProfileSettings)
- **`itinerary/`** - Trip display (DayCard, PackingListView, FoodLayerView, TripOverview)
- **`trip/`** - Trip-specific (TripRouteMap, LeafletMap)
- **`explore/`** - Place discovery (AddPlaceSheet, ExploreMap)
- **`ui/`** - shadcn/ui primitives (Button, Card, Input, Badge, etc.)
- **`questionnaire/`** - Form step components

### Hooks (`src/hooks/`)
- **`useDashboardData.ts`** - Aggregates trip data for dashboard
- **`useTripStats.ts`** - Calculates trip statistics, date ranges

### Database Hooks (`src/lib/db/use-trip-db.ts`)
- **`useTrips()`** - Load all trips with `{ trips, loading, error, refresh }`
- **`useTrip(tripId)`** - Load single trip with `{ trip, loading, error, refresh, updateTrip, deleteTrip }`

### API Routes (`src/app/api/`)
- **`/api/places/activities`** - GET: Activities/restaurants via Google Places (with Supabase caching)
- **`/api/city-info`** - GET: City metadata (best time, crowd level, highlights)
- **`/api/city-image`** - GET: City images via Pexels API
- **`/api/generate-itinerary`** - POST: Itinerary generation from TripDNA
- **`/api/explore/recommendations`** - POST: Place recommendations for cities
- **`/api/hotels`** - GET: Hotel search
- **`/api/places/restaurants`** - GET: Restaurant search via Google Places
- **`/api/places/details`** - GET: Place details

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

- **NEVER use `npm run dev`** - Do not start the dev server. It hogs resources (CPU/RAM) and blocks builds. User tests on live site only.
- **NEVER use `npm run deploy`** - The local `@opennextjs/cloudflare build` hangs. Don't waste time on it.
- **ALWAYS run `npm run build` before pushing** - catches TypeScript/build errors
- **Live testing site: https://trippified.jon-c95.workers.dev/** - User tests here, NOT localhost
- **To deploy: just `git push`** - GitHub Actions auto-deploys to Cloudflare Workers. That's it.
- **Build issues with Playwright**: `tsconfig.json` excludes `playwright.config.ts` and `tests/` to prevent build errors
- **Kill resource hogs** - If things are slow, check for background processes with `ps aux | grep -E "node|npm"`. Kill any `npm run dev` or `next dev` processes immediately with `pkill -f "npm run dev" && pkill -f "next dev"`. Always tell the user if something is hogging resources.

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers on push to `main`.

**Required GitHub secrets** (Settings → Secrets → Actions):
- `CLOUDFLARE_API_TOKEN` - Get from Cloudflare dashboard → API Tokens
- `CLOUDFLARE_ACCOUNT_ID` - Get from Cloudflare dashboard → Overview sidebar
- `ANTHROPIC_API_KEY` - Claude API key for chatbot (also set directly in Cloudflare via `wrangler secret put`)

**Playwright tests**: Run against deployed site to verify. Tests check homepage, chat API, and explore features.

**Cloudflare secrets**: Managed via `wrangler secret put ANTHROPIC_API_KEY`. Use this for immediate updates without redeployment.

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

### City Coordinates (CITY_COORDS)
Module-level constant in `SwipeablePlanningView.tsx` contains `[lat, lng]` tuples for all supported cities. Used for:
- Geographic route optimization (nearest-neighbor algorithm)
- Map embeds in city detail modals
- **Important**: Only ONE definition should exist. Check before adding new cities to avoid duplicate declaration errors.

## How to Debug Properly

**STOP making incremental patches. Read the WHOLE code first.**

### The Right Way
1. **Read ALL related files end-to-end** before touching anything
2. **Trace the complete data flow** from source to destination
3. **Understand the render lifecycle** - what renders when, in what order
4. **Find the ROOT CAUSE** - not symptoms
5. **Make ONE fix** in the right place - usually earlier than you think

### The Wrong Way (what I keep doing)
- Adding guards/flags inside components without understanding WHY they're needed
- Making "quick fixes" without reading the full context
- Adding more useEffects to "fix" race conditions caused by other useEffects
- Saying "this should fix it" without tracing the full flow
- Making 10 incremental patches instead of 1 correct fix

### Before ANY bug fix, answer:
1. What is the EXACT sequence of events that causes this bug?
2. Where in that sequence should the fix go? (Usually earlier than the symptom)
3. Have I read ALL the code involved, not just the file with the error?

### If a fix doesn't work:
- **DO NOT** add another patch on top
- **DO** step back and re-read the entire flow
- The bug is probably in a different place than you think

---

## Debugging Persistence Bugs

**STOP. Before making any fix, answer these questions:**

### 1. Trace the FULL data lifecycle
Ask yourself in order:
1. **Where is state initialized?** (useState initializer runs BEFORE any useEffect)
2. **When does the component first render?** (May be before async data loads)
3. **When does saved data arrive?** (IndexedDB/API calls are async)
4. **What renders while waiting?** (Component may render with defaults first)

### 2. The #1 cause of persistence bugs: RENDER TIMING
```
❌ WRONG: Add guards inside child component
✅ RIGHT: Don't render child until parent has loaded data
```

Example - the allocation persistence bug:
- AutoItineraryView was rendering BEFORE IndexedDB loaded savedAllocations
- It generated defaults, then synced them back, overwriting the DB
- Fix: Show loading state in PARENT until `persistenceLoaded=true`

```typescript
// ❌ BAD - Component renders immediately with empty data
if (phase === 'auto-itinerary') {
  return <AutoItineraryView initialAllocations={savedAllocations} />
}

// ✅ GOOD - Wait for data before rendering
if (phase === 'auto-itinerary') {
  if (!persistenceLoaded) return <Loading />
  return <AutoItineraryView initialAllocations={savedAllocations} />
}
```

### 3. Debug checklist for IndexedDB persistence
1. **Is the field in the interface?** Check `PlanningState` in `indexed-db.ts`
2. **Is it being saved?** Check the `update()` function includes the field
3. **Is it being loaded?** Check the load useEffect sets the state
4. **Is the component waiting for load?** Don't render until `persistenceLoaded=true`
5. **Check IndexedDB directly:** DevTools → Application → IndexedDB → TravelerDB

### 4. Don't make incremental patches
If a fix doesn't work, STOP and re-trace the full data flow. Don't add more guards/flags/useEffects. The problem is usually earlier in the lifecycle than you think.

### 5. Common mistakes
- Adding `hasLoaded` flags inside child components (fix belongs in parent)
- Adding delays/timeouts to "wait" for data (use proper loading states)
- Multiple useEffects that race each other (simplify to one source of truth)
- useState initializer generating defaults before saved data arrives
