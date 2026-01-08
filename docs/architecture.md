# Trippified Architecture

> AI-powered trip planning PWA with offline-first storage and cloud sync.

---

## Overview

Trippified is a personal travel planning application that helps users create, manage, and visualize detailed trip itineraries. The app uses a questionnaire-based approach to generate "Trip DNA" which captures traveler preferences, then displays rich itineraries with day-by-day planning, accommodations, transportation, and packing lists.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 16 (App Router) | React 19, Turbopack |
| Styling | Tailwind CSS + shadcn/ui | Component library |
| State | Zustand | Questionnaire state only |
| Forms | React Hook Form + Zod | Validation |
| Local DB | Dexie.js (IndexedDB) | Offline-first storage |
| Cloud DB | Supabase (PostgreSQL) | Cross-device sync |
| Maps | Google Maps API | Places, restaurant search |
| PWA | next-pwa | Offline support |
| Deployment | Netlify | Auto-deploy from GitHub |

---

## Directory Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Dashboard (home)
│   ├── layout.tsx           # Root layout
│   ├── questionnaire/       # Trip DNA questionnaire flow
│   ├── trip/[id]/           # Individual trip view
│   ├── plan-mode/           # Planning interface
│   └── api/                 # API routes
│       ├── places/          # Google Places integration
│       └── seed/            # Dev: seed sample data
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── dashboard/           # Dashboard components
│   ├── itinerary/           # Trip view components
│   ├── questionnaire/       # Questionnaire steps
│   └── trip/                # Trip-specific components
├── hooks/                   # Custom React hooks
│   ├── useDashboardData.ts  # Dashboard data fetching
│   └── useTripStats.ts      # Trip statistics
├── lib/
│   ├── ai/                  # AI integration (Claude)
│   ├── db/
│   │   ├── indexed-db.ts    # Dexie wrapper + cloud sync
│   │   └── supabase.ts      # Supabase client
│   ├── dashboard/           # Dashboard utilities
│   ├── csv/                 # CSV import parser
│   ├── packing/             # Packing list generator
│   └── trips/               # Trip data utilities
└── types/
    ├── trip-dna.ts          # Input: traveler preferences
    └── itinerary.ts         # Output: generated itinerary
```

---

## Data Flow

```
[User] → [Questionnaire] → [Trip DNA] → [AI/Import] → [Itinerary]
                                              ↓
                                     [IndexedDB] ←→ [Supabase]
                                              ↓
                                      [Trip View/Edit]
```

### Storage Architecture

1. **Supabase** (cloud) - Source of truth for cross-device sync
2. **IndexedDB** (local) - Offline cache, fast reads
3. **localStorage** (legacy) - Migration fallback only

Data flows: Cloud-first fetch → cache to local → sync writes to cloud

---

## Key Components

### Dashboard (`src/app/page.tsx`)
- **Purpose:** Main landing page showing all trips
- **Features:** Featured trip, recent trips sidebar, stats, weather widget

### Trip View (`src/app/trip/[id]/page.tsx`)
- **Purpose:** Display and edit individual trip itineraries
- **Features:** Day cards, pipeline view, filters, drag-drop reordering

### Questionnaire (`src/app/questionnaire/`)
- **Purpose:** Collect traveler preferences to create Trip DNA
- **Steps:** Traveler profile, vibe/pace, constraints, interests, logistics, review

---

## Database Schema (Supabase)

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY,
  trip_dna JSONB NOT NULL,
  itinerary JSONB,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Trip DNA (JSONB)
- `travelerProfile`: party type, travel identities
- `vibeAndPace`: pace, schedule tolerance, energy pattern
- `constraints`: dates, budget, accommodation style
- `interests`: destination, depth preference, food, hobbies
- `logistics`: movement tolerance, transport preferences

### Itinerary (JSONB)
- `meta`: title, destination, dates, total days
- `route`: bases (accommodations), movements (transport)
- `days`: array of day plans with time blocks
- `foodLayer`: restaurant recommendations
- `packingLayer`: packing list

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/places/restaurants | Search restaurants via Google Places |
| GET | /api/places/details | Get place details |
| POST | /api/seed | Seed sample trip (dev only) |

---

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Google Maps/Places API | Yes |
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| ANTHROPIC_API_KEY | Claude API (future AI features) | No |

---

## Patterns & Conventions

### Naming
- Components: PascalCase (`DayCard.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- API routes: kebab-case (`/api/places-details`)

### Data Fetching
- Use `tripDb` methods for all trip operations
- Cloud-first: try Supabase, fallback to IndexedDB
- Fire-and-forget sync: write local immediately, sync async

### Component Organization
- Dashboard components in `/components/dashboard/`
- Itinerary components in `/components/itinerary/`
- Shared UI in `/components/ui/` (shadcn)

---

## Deployment

### Netlify Configuration
- Build command: `npm run build`
- Publish directory: `.next`
- Environment variables set in Netlify dashboard

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Add API keys
3. Run `npm run dev`

---

## Security

- ✅ API keys in environment variables (not committed)
- ✅ `.env*` files gitignored
- ✅ Supabase Row Level Security (RLS) ready
- ⚠️ No authentication yet (single-user app)
