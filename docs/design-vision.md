# Wandr Design Vision

> A personal travel companion that adapts to your style — from meticulous planners to "just book it" travelers.

## Design DNA: Notion × TripAdvisor × Google Maps

| Notion | TripAdvisor | Google Maps |
|--------|-------------|-------------|
| Flexible blocks & databases | Reviews & ratings | Location-first thinking |
| Drag-drop organization | Trust scores & photos | Route visualization |
| Templates & views | Restaurant discovery | Real-time context |
| Clean, minimal UI | Social proof | Navigation & timing |

**The Result:** An app that's as customizable as Notion, as informative as TripAdvisor, and as spatial as Google Maps.

---

## Core Philosophy

**"Your trip, your way."**

Wandr is not a one-size-fits-all travel app. It's a spectrum tool that serves:
- **The Perfectionist**: Wants to control every 15-minute block, read every review, compare every option
- **The Spontaneous**: Wants AI to handle everything with minimal input
- **Everyone in between**: Adjustable autonomy levels throughout the planning process

---

## User Profiles

| Type | Party Size | Key Needs |
|------|-----------|-----------|
| Solo | 1 | Full control, personal preferences, safety info |
| Couples | 2 | Preference merging, shared calendars, romantic spots |
| Families | 3+ | Kid-friendly filters, rest stops, multi-generational activities |
| Friends | 2-8 | Voting on activities, split costs, group coordination |

---

## Visual Identity

### Style: Rich & Immersive
- **Full-bleed destination photography** as backgrounds and hero sections
- **Layered glass-morphism cards** floating over imagery
- **Vibrant but sophisticated palette** — sunset corals, ocean blues, forest greens
- **Magazine-quality typography** — elegant serif headlines, clean sans-serif body
- **Micro-animations** — parallax scrolling, smooth transitions, subtle hover states
- **Dark mode**: Deep navy/charcoal with warm accent glows

### Design Principles
1. **Show, don't tell** — Photos > text descriptions
2. **Reduce friction** — Every action should feel effortless
3. **Celebrate the journey** — Make planning feel like part of the adventure
4. **Progressive disclosure** — Simple by default, powerful when needed

---

## Information Architecture

```
DASHBOARD (Home)
├── Today's Date & Greeting
├── Coming Up (next trip countdown)
├── World Map (Travel History Pinboard)
├── My Trips (cards: upcoming, drafts by status)
├── Bucket List / Dream Destinations (saved places to explore)
├── Past Adventures (completed trips)
├── Quick Actions (new trip, continue planning)
└── Quick Stats (countries, cities, days traveled)

NEW TRIP FLOW
├── 1. Personality Quiz (2-3 min, skippable if profile exists)
├── 2. Trip Basics (where, when, who, budget)
├── 3. Vibe Check (pace, priorities, must-haves)
├── 4. AI Generation or Manual Build
└── 5. Refine & Customize

TRIP VIEW
├── Overview (hero image, dates, summary)
├── Itinerary (day-by-day, drag-drop activities)
├── Map (route visualization)
├── Calendar (month/week/day views)
├── Restaurants (filtered list with ratings slider)
├── Packing List (AI-generated, editable)
├── Budget Tracker
└── Documents (reservations, tickets, etc.)

PROFILE
├── Travel DNA (personality results)
├── Preferences (dietary, accessibility, interests)
├── Past Trips (linked to world map)
└── Settings
```

---

## Feature Deep-Dives

### 1. World Map Pinboard (Travel History)

**Purpose**: Visual celebration of where you've been

**Interactions**:
- Pins drop with satisfying animation when trip is completed
- Click pin → expand to trip memories (photos, highlights, notes)
- Clusters for multiple visits to same region
- Statistics overlay: "15 countries, 4 continents, 127 days abroad"
- Share-worthy: Export as poster or social media graphic

**Visual Treatment**:
- Custom illustrated or satellite-style map
- Pins styled as polaroid corners or vintage stamps
- Connecting lines show travel routes
- Hover reveals destination photo peek

---

### 2. Personality Quiz (Onboarding)

**Goal**: Build a "Travel DNA" profile in 2-3 minutes

**Question Categories**:

1. **Pace & Energy**
   - "It's 7 AM on vacation. You're..."
   - Options: Already exploring / Leisurely breakfast / Still asleep

2. **Planning Style**
   - "Your ideal level of structure is..."
   - Slider: Minute-by-minute ←→ Totally spontaneous

3. **Social vs Solo**
   - "At a new destination, you prefer..."
   - Local tours / Self-guided / Mix of both

4. **Comfort vs Adventure**
   - "Your accommodation vibe..."
   - Boutique luxury / Airbnb local / Hostel social / Wherever's cheap

5. **Food Priorities**
   - "When it comes to eating..."
   - Must-try famous spots / Hidden local gems / I'll eat anything / Dietary needs first

6. **Activity Types** (multi-select)
   - Nature / Culture / Food / Nightlife / Relaxation / Adventure / Shopping / Photography

**Output**: Travel DNA Card
- Visual representation (radar chart or icon-based)
- Shareable/exportable
- Influences all AI recommendations

---

### 3. Trip Planning: The Discovery Canvas

For flexible travelers, planning doesn't start with dates — it starts with **discovery**.

**The Journey:**
```
DISCOVER → ESTIMATE → PRICE → COMMIT → BOOK
```

1. **Discover** — Save anything that interests you
2. **Estimate** — AI tells you "this is about X days of stuff"
3. **Price** — Check flights across flexible date ranges
4. **Commit** — Lock in dates when you find good prices
5. **Book** — Make reservations, finalize details

---

#### The Discovery Canvas

A visual workspace where you collect and organize finds before dates exist.

```
┌─────────────────────────────────────────────────────────────────┐
│  ASIA ADVENTURE                    [Canvas] [Itinerary] [Map]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🗺️ YOUR DISCOVERIES                              [+ Add]      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  TOKYO              KYOTO             OSAKA             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ 🍜 Ichiran   │  │ 🏯 Fushimi   │  │ 🍣 Kuromon   │  │   │
│  │  │ 🏨 Park Hyatt│  │ 🍵 Tea house │  │ 🎭 Dotonbori │  │   │
│  │  │ 🎌 Shibuya   │  │ 🚶 Arashiyama│  │              │  │   │
│  │  │ 🛍️ Harajuku  │  │ 🍜 Nishiki   │  │              │  │   │
│  │  │ +8 more      │  │ +4 more      │  │              │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                         │   │
│  │  AI: "You have enough for ~5 days Tokyo, 2-3 days Kyoto"│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📍 MAP                                           [Expand]     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │        •Tokyo (12 saves)                                │   │
│  │              \  2h15m shinkansen                        │   │
│  │               •Kyoto (8)──30min──•Osaka (2)            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ✈️ FLIGHT PRICES                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Searching for 8-10 day trips in next 6 months...      │   │
│  │                                                         │   │
│  │  Mar 5-14   $823  ★ Cherry blossom season              │   │
│  │  Apr 2-11   $645  ★ Cheapest                           │   │
│  │  May 8-17   $712                                        │   │
│  │  Oct 15-24  $689  ★ Best weather                       │   │
│  │                                                         │   │
│  │  [Show more dates]         [I have specific dates]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Continue Exploring]              [Lock Dates: Apr 2-11 →]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

#### How It Works

**Phase 1: Pure Discovery (No dates needed)**
- Browse destinations, restaurants, activities
- Save to city "buckets" within the trip canvas
- Map shows spatial relationships
- AI estimates: "You have 5 days of content for Tokyo"

**Phase 2: Duration Emerges**
- Based on saves, AI suggests total trip length
- User can adjust: "Actually I want to take it slower"
- Trip becomes "8-10 days" without specific dates

**Phase 3: Price Shopping**
- Search flights for flexible date ranges
- See cheapest options across months
- Seasonal notes: "Cherry blossoms", "Rainy season", "Peak crowds"

**Phase 4: Lock & Book**
- Pick dates based on price + season
- Canvas transforms into day-by-day itinerary
- AI auto-arranges activities by neighborhood + logistics
- User refines, drags, edits

---

#### Planning Modes (User Choice)

| Mode | Description | Best For |
|------|-------------|----------|
| **Discovery First** | Collect → Estimate → Price → Commit | Flexible dates, price-sensitive |
| **Dates First** | I know when → AI fills content | Fixed vacation dates |
| **AI Autopilot** | "Surprise me" → Full AI generation | Minimal effort desired |
| **Blank Canvas** | Empty itinerary, manual adds | Full control planners |

**Key**: User can switch modes anytime

---

### 3b. AI-Generated Skeleton Plan

For users who want AI to do the heavy lifting but still want control.

**The Flow:**
```
QUESTIONNAIRE → AI GENERATES SKELETON → REFINE → FINALIZE
```

#### Questionnaire → Skeleton

After the questionnaire (vibe, pace, dates, etc.), AI generates a **skeleton plan**:

```
┌─────────────────────────────────────────────────────────────────┐
│  ✨ Your Trip is Ready!                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Based on your answers, here's a skeleton plan:                 │
│                                                                 │
│  🗓️ TOKYO • 5 days                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Day 1: Arrival + Shinjuku exploration                   │   │
│  │ Day 2: Tsukiji → TeamLab → Shibuya nightlife           │   │
│  │ Day 3: Day trip - Mt. Fuji OR Nikko                     │   │
│  │ Day 4: Harajuku + Akihabara culture day                 │   │
│  │ Day 5: Flex day / Shopping / Travel to Kyoto           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🗓️ KYOTO • 3 days                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Day 6: Fushimi Inari (sunrise) + Nishiki Market        │   │
│  │ Day 7: Arashiyama bamboo + temples                      │   │
│  │ Day 8: Gion district + departure                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  💡 This is a starting point. Tap any day to customize.        │
│                                                                 │
│  [Looks Good!]              [Regenerate]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Refining the Skeleton

Once you accept the skeleton, you can refine it:

**Option 1: Manual Browse & Add**
- Tap a day to expand
- Browse suggested activities for that day
- Swipe to add/remove
- Drag to reorder

**Option 2: Ask AI for More**
- Floating AI button or chat input
- "Find me more food experiences in Kyoto"
- "I want something adventurous for Day 4"
- "Show me alternatives to Mt. Fuji day trip"
- AI returns options, you pick what to add

```
┌─────────────────────────────────────────────────────────────────┐
│  DAY 2 - TOKYO                               [+ Add Activity]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ☀️ MORNING                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🐟 Tsukiji Outer Market          6:00 AM                │   │
│  │    Fresh sushi breakfast         ⭐ 4.8                  │   │
│  │    [Confirmed] [Swap] [Remove]                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🌤️ AFTERNOON                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎨 TeamLab Planets               11:00 AM               │   │
│  │    Immersive digital art         ⭐ 4.9                  │   │
│  │    ⚠️ Needs booking              [Book Now]             │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🍜 Suggested: Ramen lunch        ~1:30 PM               │   │
│  │    3 options near TeamLab        [View Options]         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🌙 EVENING                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🌃 Shibuya Crossing              7:00 PM                │   │
│  │    Nightlife exploration         [Swap] [Remove]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💬 "Find me a cool bar in Shibuya"            [Send]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### AI Chat for Refinement

The AI chat can handle requests like:
- "Add more food experiences"
- "I don't want to wake up early"
- "Find something romantic for Day 7"
- "What are alternatives to [activity]?"
- "This day feels too packed, spread it out"
- "Show me what's near my hotel"

AI responds with options, user picks, plan updates.

---

### 4. Itinerary & Calendar

**Day View**:
```
┌─────────────────────────────────────────────┐
│ DAY 3 - KYOTO                    Wed, Mar 5 │
├─────────────────────────────────────────────┤
│ ☀️ MORNING                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ 🏯 Fushimi Inari Shrine                 │ │
│ │    6:00 AM - 9:00 AM                    │ │
│ │    Beat the crowds, sunrise photos      │ │
│ │    📍 5 min walk from station           │ │
│ └─────────────────────────────────────────┘ │
│                     ↓ 25 min train          │
│ ┌─────────────────────────────────────────┐ │
│ │ 🍜 Nishiki Market                       │ │
│ │    10:00 AM - 12:00 PM                  │ │
│ │    Street food breakfast/lunch          │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ 🌤️ AFTERNOON                                │
│  ...                                        │
└─────────────────────────────────────────────┘
```

**Interactions**:
- Drag activities to reorder
- Drag between days
- Pinch/expand time blocks
- Tap to see details, reviews, photos
- Long-press for quick actions (delete, duplicate, move)

**Smart Features**:
- Auto-calculate travel time between activities
- Warning if schedule too tight
- Suggest nearby alternatives if something closes
- Weather integration ("Rain expected — indoor backup?")

---

### 5. Restaurant Discovery

**Filter Panel**:
```
┌─────────────────────────────────────────────┐
│ FIND RESTAURANTS                            │
├─────────────────────────────────────────────┤
│ Rating                                      │
│ ○───────────────●─────○                     │
│ 3.0            4.4    5.0                   │
│                                             │
│ Cuisine        [Japanese ▼] [Italian ▼]    │
│ Price          $ ● $$ ● $$$ ○ $$$$ ○       │
│ Distance       Within [15 min ▼] walk      │
│ Vibe           [Romantic] [Casual] [Views] │
│ Dietary        [Vegetarian] [Gluten-free]  │
│                                             │
│ Sort by: [Best Match ▼]                    │
└─────────────────────────────────────────────┘
```

**Restaurant Card**:
- Hero photo (swipeable gallery)
- Name, rating, price, cuisine tags
- "Why AI picked this": personalized reason
- Quick actions: Add to trip, Save, Directions
- Review snippets (AI-summarized highlights)

**Unique Features**:
- "Trust Score" — weighs recent reviews higher
- "Matches Your Taste" percentage based on profile
- One-tap reservation (OpenTable/Resy integration)
- "Similar to places you loved" recommendations

---

### 6. Packing List

**AI-Generated Based On**:
- Destination weather forecast
- Activities planned (hiking gear? formal dinner?)
- Trip duration
- Your saved preferences

**Structure**:
```
┌─────────────────────────────────────────────┐
│ PACKING LIST                    Tokyo, 7 days│
├─────────────────────────────────────────────┤
│ 👔 CLOTHING                      [Add item] │
│   ☐ T-shirts (5)                           │
│   ☐ Light jacket (rain expected Day 3-4)   │
│   ☐ Comfortable walking shoes              │
│   ☐ Nice outfit (dinner at Sukiyabashi)    │
│                                             │
│ 🔌 ELECTRONICS                              │
│   ☐ Phone + charger                        │
│   ☐ Power adapter (Type A/B)               │
│   ☐ Portable battery                       │
│                                             │
│ 📄 DOCUMENTS                                │
│   ☐ Passport (valid until 2027 ✓)          │
│   ☐ Hotel confirmations                    │
│   ☐ JR Pass voucher                        │
│                                             │
│ 💊 HEALTH                                   │
│   ☐ Medications                            │
│   ☐ Travel insurance card                  │
└─────────────────────────────────────────────┘
```

**Interactions**:
- Check off items (syncs across devices)
- Add custom items
- Swipe to delete
- Reorder by priority
- "Forgot something?" AI suggestions based on common oversights

---

### 7. Bucket List / Dream Destinations

**Purpose**: A curated collection of places you want to visit someday

**Sources**:
- Manual saves ("I want to go here!")
- AI suggestions based on travel DNA
- Saved from articles, social media, friends' trips
- Inspiration gallery browsing

**Card Structure**:
```
┌─────────────────────────────────────────────┐
│ [Stunning destination photo]                │
│                                             │
│ 🏔️ Patagonia, Argentina                    │
│ "Hike the W Trek before I'm 40"            │
│                                             │
│ Best time: Nov-Mar  •  Est. budget: $3,500 │
│                                             │
│ [Start Planning]        [Save for Later]   │
└─────────────────────────────────────────────┘
```

**Features**:
- Add personal notes ("Why I want to go")
- Set priority (High / Medium / Low)
- Add travel companions ("Go with Sarah")
- Quick convert to trip draft
- Seasonal recommendations
- Budget estimates based on travel style

---

### 8. Autonomy Slider (Core UX Concept)

**The Big Idea**: A global control that adjusts how much AI does vs. user controls

```
┌─────────────────────────────────────────────┐
│          PLANNING AUTONOMY                  │
│                                             │
│  YOU      ○──────●──────○──────○      AI   │
│  DECIDE                            DECIDES  │
│                                             │
│  Current: "Guided" — AI suggests, you pick │
└─────────────────────────────────────────────┘
```

**Levels**:
1. **Full Control**: Blank canvas, no AI interference
2. **Guided**: AI offers options, you choose
3. **Collaborative**: AI drafts, you edit
4. **Autopilot**: AI handles it, you approve

This slider can be:
- Set globally in preferences
- Adjusted per-trip
- Changed mid-planning

---

## Key Screens (Wireframe Concepts)

### Dashboard (Home Screen)
```
┌─────────────────────────────────────────────┐
│ ≡  WANDR                          [Avatar] │
├─────────────────────────────────────────────┤
│  Sunday, January 5                          │
│  Good morning, Jacqueline                   │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  COMING UP                            │  │
│  │  ✈️ Tokyo          ███████░░░ 45 days │  │
│  │  Mar 5-12 • 12/18 tasks complete      │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [12] Countries [47] Cities [4] Continents │
│                                             │
│  MY TRIPS                    [+ New Trip]  │
│  ┌─────────────────┐ ┌─────────────────┐   │
│  │ Tokyo           │ │ Bali            │   │
│  │ 🟠 Booked       │ │ 🟡 Planning     │   │
│  └─────────────────┘ └─────────────────┘   │
│                                             │
│  BUCKET LIST                   [See All]   │
│  ┌─────────────────┐ ┌─────────────────┐   │
│  │ 🏔️ Patagonia   │ │ 🌸 Japan        │   │
│  │ "Someday..."    │ │ "Cherry bloss"  │   │
│  └─────────────────┘ └─────────────────┘   │
│                                             │
│  PAST ADVENTURES                           │
│  ┌─────────────────┐ ┌─────────────────┐   │
│  │ Peru • Dec 2024 │ │ Italy • 2023    │   │
│  └─────────────────┘ └─────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### Trip Overview
```
┌─────────────────────────────────────────────┐
│ ←                                    ⋮     │
├─────────────────────────────────────────────┤
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░ [HERO DESTINATION PHOTO] ░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░ TOKYO ░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░ March 5-12, 2025 ░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────────┤
│                                             │
│  [Itinerary] [Map] [Restaurants] [Packing] │
│                                             │
│  DAY 1 - ARRIVAL                           │
│  ┌─────────────────────────────────────┐   │
│  │ ✈️ Land at Narita 2:30 PM           │   │
│  │ 🚃 Train to Shinjuku               │   │
│  │ 🏨 Check in Park Hyatt              │   │
│  │ 🍜 Dinner: Ichiran Ramen            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  DAY 2 - SHIBUYA & HARAJUKU               │
│  ┌─────────────────────────────────────┐   │
│  │ ...                                 │   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Interaction Patterns

### Drag & Drop
- Activities can be dragged between time slots
- Visual feedback: ghost card, drop zones highlight
- Haptic feedback on mobile
- Undo toast appears after any reorder

### Swipe Actions
- Swipe right: Quick-add to trip
- Swipe left: Dismiss/hide
- Works on restaurant cards, activity suggestions, etc.

### Progressive Disclosure
- Default: Simple, essential info
- Tap to expand: Full details
- "Show more options" for power users

### Smart Defaults
- Pre-select most common options
- "Recommended" badges
- One-tap acceptance for AI suggestions

---

## Empty States

Each empty state should feel like an invitation, not a dead end.

**No trips yet**:
> "Your adventure starts here. Where do you want to go?"
> [Beautiful world map animation]
> [Start Planning button]

**Empty day in itinerary**:
> "This day is wide open. Want some ideas?"
> [AI-suggested activities based on location]

**No restaurants saved**:
> "Let's find you something delicious."
> [Jump to restaurant discovery]

---

## Accessibility

- High contrast mode available
- Screen reader optimized
- Keyboard navigation for all actions
- Reduced motion option
- Font size controls
- Color blind friendly palette options

---

## Next Steps

1. **Wireframes**: Detailed screen-by-screen layouts
2. **User Flows**: Step-by-step journey maps
3. **Component Library**: UI kit for consistent design
4. **Prototype**: Interactive Figma/Framer prototype
5. **User Testing**: Validate with target users

---

*This is a living document. Update as design evolves.*
