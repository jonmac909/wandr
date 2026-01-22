# iOS Conversion Plan for Wandr (Trippified)

## Executive Summary

Wandr is a sophisticated travel planning PWA with complex features including multi-phase trip curation, AI-powered itinerary generation, real-time Google Places integration, offline-first data storage with cloud sync, and rich map visualizations. Converting this to native iOS presents both opportunities for enhanced UX and technical challenges around data persistence and API integration.

**Estimated Timeline**: 24-34 weeks (6-8 months)
**Target Platform**: iOS 17+
**Recommended Stack**: SwiftUI + SwiftData + Supabase Swift SDK

---

## Part 1: Current Architecture Analysis

### Tech Stack Overview

| Layer | Current Tech | Description |
|-------|-------------|-------------|
| Framework | Next.js 15 (App Router) | Server components, API routes |
| UI | React 19 + Tailwind CSS 4 | Component-based with utility classes |
| Components | shadcn/ui (Radix primitives) | Dialog, Sheet, Tabs, Forms |
| State | Zustand | Persisted questionnaire flow |
| Local DB | Dexie.js (IndexedDB) | Trips, planning states, preferences |
| Cloud DB | Supabase | Sync layer with caching |
| Maps | Leaflet + OpenStreetMap/MapTiler | Route visualization |
| Icons | lucide-react | 500+ icons used throughout |
| APIs | Google Places, Wikipedia, OSRM | External data |

### Data Model Summary

The app uses 6 core data structures:

1. **TripDNA** (~152 lines) - User preferences with nested objects for traveler profile, vibe/pace, constraints, interests, logistics
2. **Itinerary** (~346 lines) - Complex trip structure with days, activities, bases, movements, food recommendations, packing lists
3. **SavedPlace** - Bookmarked places from Explore feature
4. **PlanningState** - Trip curation progress persistence
5. **StoredTrip** - Wrapper combining TripDNA and Itinerary
6. **UserPreferences** - App-wide settings

### Key Feature Categories

1. **Trip Creation Flow** (5 phases): Where/When, Preferences, City Picker, Route Planning, Day Planning
2. **Trip Management**: View, edit, delete trips with cloud sync
3. **Exploration**: Discover places by category with Google Places
4. **Saved Places**: Bookmark and organize places by city/country
5. **Import**: Parse TikTok/Instagram links for place extraction
6. **Itinerary Display**: Day cards, timeline, packing lists

---

## Part 2: Recommended iOS Tech Stack

### Core Framework Decision: SwiftUI

**Recommendation: SwiftUI (iOS 17+)**

Rationale:
1. **Declarative paradigm** - Maps well to React's component model
2. **Navigation API** - Native multi-phase flows similar to current wizard
3. **Observable macro** - Clean state management like Zustand
4. **SwiftData** - Modern persistence that integrates with SwiftUI
5. **MapKit** - Native maps with excellent performance
6. **Future-proof** - Apple's investment is clearly in SwiftUI

### Complete Tech Stack

| Layer | iOS Tech | Rationale |
|-------|----------|-----------|
| UI Framework | SwiftUI (iOS 17+) | Declarative, similar mental model to React |
| Architecture | MVVM + Coordinators | Clean separation, testable |
| State Management | @Observable + Environment | Native, similar to Zustand |
| Local Persistence | SwiftData | Modern, type-safe, syncs with CloudKit |
| Cloud Sync | Supabase Swift SDK | Maintain existing backend |
| Maps | MapKit | Native performance, offline caching |
| Networking | URLSession + async/await | Native concurrency |
| Image Loading | AsyncImage + NukeUI | Efficient caching |
| Keychain | KeychainAccess | Secure API key storage |
| Analytics | Firebase/Mixpanel | Optional tracking |

### Why Not UIKit?

- UIKit would require significantly more boilerplate
- No SwiftData integration (Core Data only)
- Complex custom implementations for features SwiftUI provides (sheets, navigation)
- Harder to maintain with smaller team

---

## Part 3: Data Persistence Strategy

### Primary: SwiftData

SwiftData provides the closest equivalent to the current Dexie.js + Supabase architecture:

```swift
// Example SwiftData model for StoredTrip
@Model
class StoredTrip {
    @Attribute(.unique) var id: UUID
    var tripDna: TripDNA
    var itinerary: Itinerary?
    var createdAt: Date
    var updatedAt: Date
    var syncedAt: Date?
    var status: TripStatus

    enum TripStatus: String, Codable {
        case draft, generated, active, completed, archived
    }
}
```

### Model Translations

| Current (TypeScript) | iOS (SwiftData) |
|---------------------|-----------------|
| StoredTrip | `@Model class StoredTrip` |
| TripDNA | Embedded Codable struct |
| Itinerary | Embedded Codable struct or separate @Model |
| PlanningState | `@Model class PlanningState` |
| SavedPlace | `@Model class SavedPlace` |
| UserPreferences | `@Model class UserPreferences` (singleton) |

### Cloud Sync Strategy

**Option A: Supabase Swift SDK (Recommended for consistency)**
- Maintains existing Supabase backend
- Same sync logic as web (cloud-first reads, dual writes)
- Lower migration effort

**Option B: CloudKit (Native Apple experience)**
- Automatic sync with SwiftData
- No server maintenance
- Would require backend migration

**Recommendation**: Use Supabase Swift SDK initially, consider CloudKit migration later if needed.

### Sync Implementation Pattern

```swift
class TripRepository: ObservableObject {
    private let modelContext: ModelContext
    private let supabase: SupabaseClient

    func getAll() async throws -> [StoredTrip] {
        // Cloud-first, fallback to local (matching web pattern)
        do {
            let cloudTrips = try await supabase.from("trips").select().execute()
            // Cache to local
            for trip in cloudTrips {
                modelContext.insert(trip)
            }
            return cloudTrips
        } catch {
            // Fallback to local
            return try modelContext.fetch(FetchDescriptor<StoredTrip>())
        }
    }

    func save(_ trip: StoredTrip) async throws {
        // Write to both (matching web pattern)
        modelContext.insert(trip)
        try modelContext.save()
        try await supabase.from("trips").upsert(trip).execute()
    }
}
```

---

## Part 4: Feature Parity Checklist

### Phase 1: Core Infrastructure
- [ ] SwiftData models for all types
- [ ] Supabase Swift client setup
- [ ] Repository pattern for data access
- [ ] API service layer
- [ ] Network reachability monitoring
- [ ] Image caching system

### Phase 2: Navigation & Layout
- [ ] Tab bar navigation (Trips, Explore, Saved, Profile)
- [ ] Custom header component matching web design
- [ ] Sheet presentations (drawers, modals)
- [ ] Pull-to-refresh patterns

### Phase 3: Home Dashboard
- [ ] Dashboard view with hero section
- [ ] Plan New Trip CTA
- [ ] Import Trip CTA
- [ ] Destination Inspiration grid
- [ ] Trip drawer with recent trips

### Phase 4: Trip Creation (5 Phases)
- [ ] Phase navigation component (5 dots)
- [ ] Section 1: Where & When (destinations, dates, duration)
- [ ] Section 2: Preferences (traveler type, budget, pace, interests)
- [ ] Section 3: City Picker (swipeable cards with images)
- [ ] Section 4: Route Planning (map visualization, TSP optimization)
- [ ] Section 5: Day Planning (auto-itinerary view)

### Phase 5: Trip Detail
- [ ] Trip hub hero with cover image
- [ ] Overview section (stats, dates, route)
- [ ] Schedule section (day-by-day cards)
- [ ] Hotels section
- [ ] Transport section
- [ ] Documents section
- [ ] Packing list view
- [ ] Food recommendations

### Phase 6: Explore
- [ ] Category browsing (beaches, culture, food)
- [ ] Search functionality
- [ ] Place cards with Google Places data
- [ ] Ready-made itineraries display

### Phase 7: Saved Places
- [ ] Map view with saved locations
- [ ] Country/City grouping
- [ ] TikTok/Instagram import feature
- [ ] Place detail sheet

### Phase 8: Profile & Settings
- [ ] User preferences form
- [ ] Travel interests selection
- [ ] Home airport setting
- [ ] Theme preferences
- [ ] Sync status

### Phase 9: Advanced Features
- [ ] AI itinerary autofill (Anthropic API)
- [ ] Video analysis for place extraction (Gemini API)
- [ ] Offline mode with sync queue
- [ ] Push notifications for trip reminders
- [ ] Widget for upcoming trips
- [ ] Apple Watch companion (stretch goal)

---

## Part 5: API Layer Architecture

### Service Pattern

```swift
protocol PlacesServiceProtocol {
    func fetchActivities(city: String, type: String, limit: Int) async throws -> [Activity]
    func fetchPhoto(ref: String) async throws -> UIImage
    func fetchCityImage(city: String, country: String) async throws -> URL?
}

class GooglePlacesService: PlacesServiceProtocol {
    private let apiKey: String
    private let cache: PlacesCacheProtocol

    func fetchActivities(city: String, type: String, limit: Int) async throws -> [Activity] {
        // Check cache first (matching web pattern)
        if let cached = await cache.getByCity(city, type: type) {
            return cached
        }

        // Fetch from Google Places API
        let response = try await networkClient.post(
            "https://places.googleapis.com/v1/places:searchText",
            body: PlacesSearchRequest(textQuery: "top \(type)s in \(city)")
        )

        // Cache results
        await cache.save(response.places, city: city, type: type)
        return response.places
    }
}
```

### API Rate Limiting

Port the safeguards from `/src/lib/api/safeguards.ts`:

```swift
actor APIRateLimiter {
    private var totalCalls = 0
    private var endpointCalls: [String: Int] = [:]
    private var endpointFailures: [String: Int] = [:]
    private var lastCallTime: [String: Date] = [:]

    private let limits = APILimits(
        maxCallsPerSession: 200,
        maxCallsPerEndpoint: 50,
        maxFailuresBeforeStop: 5,
        minSecondsBetweenCalls: 0.1
    )

    func canMakeCall(endpoint: String) -> (allowed: Bool, reason: String?) {
        // Port logic from TypeScript safeguards
    }
}
```

### Required API Endpoints

| Endpoint | Description | iOS Implementation |
|----------|-------------|-------------------|
| Google Places Text Search | Activities, restaurants | Direct API call |
| Google Places Photo | Place images | Direct API call + caching |
| Wikipedia API | Place history | Direct API call |
| OSRM | Route distances | Direct API call |
| REST Countries | Country info | Direct API call |
| Wikivoyage | Travel tips | Direct API call |
| Supabase | Cloud sync | Supabase Swift SDK |

---

## Part 6: UI Component Mapping

### shadcn/ui to SwiftUI Equivalents

| shadcn/ui Component | SwiftUI Equivalent |
|--------------------|-------------------|
| Button | Button with custom styles |
| Card | GroupBox or custom View |
| Input | TextField |
| Textarea | TextEditor |
| Badge | Text with background modifier |
| Dialog | .sheet or .fullScreenCover |
| Sheet | .sheet with detents |
| Tabs | TabView |
| Select | Picker |
| Slider | Slider |
| Checkbox | Toggle |
| DropdownMenu | Menu |
| Progress | ProgressView |
| Avatar | AsyncImage in circle |

### Custom Components to Build

1. **CityImage** - Async image with gradient placeholder fallback
2. **PlanningNavDots** - 5-phase progress indicator
3. **SwipeableCard** - Tinder-style city selection
4. **DayCard** - Timeline view for daily activities
5. **RouteMap** - MapKit view with route polylines
6. **TripDrawer** - Bottom sheet with trip list
7. **ActivityCard** - Place card with image, rating, actions

---

## Part 7: Migration Phases & Timeline

### Phase 1: Foundation (4-6 weeks)

**Goal**: Core infrastructure and basic navigation

Tasks:
- Project setup with SwiftUI + SwiftData
- Data models and repositories
- Supabase integration
- Basic tab navigation
- Home dashboard (static)
- API service layer skeleton

**Deliverable**: App compiles, shows dashboard, no functionality

---

### Phase 2: Trip Management (4-6 weeks)

**Goal**: View and manage existing trips

Tasks:
- Trip list view
- Trip detail view (read-only)
- Sync with Supabase
- Basic CRUD operations
- Delete confirmation

**Deliverable**: Can view trips synced from web

---

### Phase 3: Trip Creation (6-8 weeks)

**Goal**: Full trip creation wizard

Tasks:
- 5-phase navigation system
- Section 1: Destination input with chips
- Section 2: Preferences forms
- Section 3: City picker (critical - complex UI)
- Section 4: Route planning with map
- Section 5: Day planning basics

**Deliverable**: Can create new trips on iOS

---

### Phase 4: Explore & Save (3-4 weeks)

**Goal**: Discovery features

Tasks:
- Explore browse view
- Google Places integration
- Save/unsave functionality
- Saved places view with map

**Deliverable**: Can discover and save places

---

### Phase 5: Advanced Features (4-6 weeks)

**Goal**: Feature parity

Tasks:
- AI itinerary autofill
- Import from social media
- Packing list with checkboxes
- Food recommendations
- Offline mode

**Deliverable**: Feature parity with web

---

### Phase 6: Polish & Launch (3-4 weeks)

**Goal**: Production ready

Tasks:
- Performance optimization
- Accessibility audit
- App Store assets
- Beta testing via TestFlight
- Bug fixes

**Deliverable**: App Store submission

---

### Total Timeline: 24-34 weeks (6-8 months)

---

## Part 8: Potential Challenges & Solutions

### Challenge 1: Complex Planning UI

**Issue**: SwipeablePlanningView is 4500+ lines with complex phase logic

**Solution**:
- Break into smaller SwiftUI views per phase
- Use NavigationPath for phase management
- Coordinator pattern for phase transitions
- Each phase as its own feature module

---

### Challenge 2: Map Performance

**Issue**: Web uses Leaflet; iOS needs native maps

**Solution**:
- MapKit with MKPolyline for routes
- Custom MKAnnotation for city markers
- Consider MapBox SDK if MapKit insufficient
- MapKit supports offline map caching

---

### Challenge 3: Image Caching

**Issue**: Heavy image usage from Google Places

**Solution**:
- NukeUI for aggressive in-memory and disk caching
- Supabase storage for persistent cache
- Placeholder gradients matching web
- AsyncImage with custom phases

---

### Challenge 4: Offline Sync

**Issue**: Cloud-first with local fallback is complex

**Solution**:
- SwiftData handles local persistence automatically
- Sync queue for pending changes when offline
- Network reachability monitoring with NWPathMonitor
- Conflict resolution strategy (last-write-wins)

---

### Challenge 5: Date Handling

**Issue**: Web has timezone-aware date parsing

**Solution**:
- Use Calendar API consistently
- Store as ISO strings for sync compatibility
- TimeZone.current for display
- Match web's `YYYY-MM-DD` format for dates

---

### Challenge 6: Large Component Translation

**Issue**: trip/[id]/page.tsx is 55K+ tokens

**Solution**:
- Extract into smaller feature modules
- TripDetailViewModel handles business logic
- Separate views for each section (Overview, Schedule, Hotels, etc.)
- Use ViewBuilder for composable sections

---

## Part 9: Testing Strategy

### Unit Tests
- Repository layer (mock Supabase)
- ViewModels with mock repositories
- Date/formatting utilities
- API response parsing

### UI Tests
- Trip creation flow
- Navigation between tabs
- Sheet presentations
- Form validation

### Integration Tests
- Supabase sync round-trip
- Google Places API responses
- Image caching behavior

### Snapshot Tests
- Critical views for regression
- Dark mode variants
- Dynamic type sizes

---

## Part 10: Recommended File Structure

```
Wandr/
├── App/
│   ├── WandrApp.swift
│   ├── AppCoordinator.swift
│   └── ContentView.swift
├── Features/
│   ├── Dashboard/
│   │   ├── DashboardView.swift
│   │   ├── DashboardViewModel.swift
│   │   └── Components/
│   ├── TripCreation/
│   │   ├── TripCreationCoordinator.swift
│   │   ├── Phase1-Where/
│   │   ├── Phase2-Preferences/
│   │   ├── Phase3-Cities/
│   │   ├── Phase4-Route/
│   │   └── Phase5-Itinerary/
│   ├── TripDetail/
│   ├── Explore/
│   ├── Saved/
│   └── Profile/
├── Core/
│   ├── Models/
│   │   ├── TripDNA.swift
│   │   ├── Itinerary.swift
│   │   └── SavedPlace.swift
│   ├── Repositories/
│   │   ├── TripRepository.swift
│   │   └── PlacesRepository.swift
│   ├── Services/
│   │   ├── GooglePlacesService.swift
│   │   ├── WikipediaService.swift
│   │   └── SupabaseService.swift
│   └── Utilities/
│       ├── APIRateLimiter.swift
│       ├── DateHelpers.swift
│       └── GeoUtils.swift
├── Components/
│   ├── Cards/
│   ├── Maps/
│   ├── Navigation/
│   └── Shared/
├── Resources/
│   └── Assets.xcassets
└── Tests/
```

---

## Part 11: Critical Files Reference

The following files contain the core logic to port:

| File | Purpose | Priority |
|------|---------|----------|
| `src/types/itinerary.ts` | Complete data model (Activity, DayPlan, Base, Movement) | Critical |
| `src/types/trip-dna.ts` | User preferences model | Critical |
| `src/lib/db/indexed-db.ts` | Repository pattern and sync logic | Critical |
| `src/lib/db/supabase.ts` | Supabase schema and row conversion | Critical |
| `src/components/planning/SwipeablePlanningView.tsx` | Core planning UI (~4500 lines) | Critical |
| `src/app/api/generate-itinerary/route.ts` | Itinerary generation algorithms | High |
| `src/lib/api/safeguards.ts` | API rate limiting | High |
| `src/lib/geo/city-country.ts` | City/country database | High |
| `src/lib/geo/destination-cities.ts` | Curated destination list | Medium |
| `src/lib/booking/urls.ts` | Booking URL generation | Medium |

---

## Part 12: Dependencies (Swift Package Manager)

```swift
// Package.swift or via Xcode
dependencies: [
    // Networking & Backend
    .package(url: "https://github.com/supabase-community/supabase-swift", from: "2.0.0"),

    // Image Loading
    .package(url: "https://github.com/kean/Nuke", from: "12.0.0"),

    // Keychain
    .package(url: "https://github.com/kishikawakatsumi/KeychainAccess", from: "4.0.0"),

    // Optional: Better date handling
    .package(url: "https://github.com/davedelong/time", from: "1.0.0"),
]
```

---

## Part 13: App Store Considerations

### App Store Requirements
- Privacy policy URL
- App screenshots (6.5" and 5.5" iPhones, 12.9" iPad)
- App icon (1024x1024)
- App description and keywords
- Support URL
- Age rating questionnaire

### Privacy Disclosures
- Location data (for trip planning)
- User content (trip data)
- Analytics (if using Firebase/Mixpanel)
- Third-party APIs (Google, Supabase)

### TestFlight Beta
- Internal testing: Up to 100 testers
- External testing: Up to 10,000 testers
- Requires App Review for external

---

## Conclusion

Converting Wandr to iOS is a substantial but achievable project. The key success factors are:

1. **Start with data models** - Get TripDNA and Itinerary types right first
2. **Prioritize sync** - Supabase integration enables web ↔ iOS parity
3. **Break down SwipeablePlanningView** - Don't try to port it as one file
4. **Leverage SwiftUI's strengths** - Sheets, navigation, and MapKit
5. **Test incrementally** - Each phase should produce a working subset

The 6-8 month timeline allows for careful implementation while maintaining the quality bar set by the web application.
