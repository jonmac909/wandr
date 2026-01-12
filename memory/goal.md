# Current Goal

> Cross-context memory file. Updated January 2025.

---

## Objective

Build **Trippified** - an AI-powered personal travel planning PWA that helps users create detailed trip itineraries with:
- Day-by-day schedules with time blocks
- Accommodation tracking
- Transportation planning
- Restaurant recommendations
- Packing lists
- Cross-device sync via Supabase

---

## Current State

```
TDD Phase: 🚀 (Active Development)
Current Task: Cleanup and polish
Blockers: None
```

---

## Completed Features

### Core
- [x] Next.js 16 App Router setup
- [x] Tailwind + shadcn/ui styling
- [x] TypeScript throughout
- [x] Trip DNA types and questionnaire
- [x] Itinerary data model
- [x] IndexedDB persistence (Dexie.js)
- [x] Supabase cloud sync
- [x] PWA manifest

### Dashboard
- [x] Featured trip card
- [x] Recent trips sidebar
- [x] Trip stats panel
- [x] World map visualization
- [x] Weather widget
- [x] Month calendar
- [x] Bucket list
- [x] Profile settings
- [x] Import modal (CSV + JSON)

### Trip View
- [x] Route map component
- [x] Pipeline view (flights, hotels, food, activities)
- [x] Day cards with time blocks
- [x] Drag-drop activity reordering
- [x] Food recommendations
- [x] Packing list generator
- [x] Trip editing (title, activities)

### Questionnaire
- [x] 6-step flow (profile, vibe, constraints, interests, logistics, review)
- [x] Zustand state management
- [x] Progress indicator
- [x] Form validation

---

## Next Tasks

- [ ] AI itinerary generation (Claude integration)
- [ ] Export to PDF/calendar
- [ ] Multi-user authentication
- [ ] Collaborative trip planning
- [ ] Budget tracking

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind + shadcn/ui |
| State | Zustand |
| Local DB | Dexie.js (IndexedDB) |
| Cloud DB | Supabase |
| Maps | Google Maps API |
| Deploy | Cloudflare Workers |

---

## Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Supabase over Firebase | PostgreSQL, better DX, free tier | Jan 2025 |
| Cloudflare Workers | Edge deployment, fast globally | Jan 2025 |
| IndexedDB + Supabase | Offline-first with cloud sync | Jan 2025 |
| No auth yet | Single-user MVP first | Jan 2025 |

---

## Notes

- Sample trip "ASIA 2026" seeded to Supabase for testing
- Cloud sync working: trips persist across devices
- Marketing skills folder removed (was from template)
