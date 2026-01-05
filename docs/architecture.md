# Architecture

> System overview. Keep this updated as the system evolves!

---

## Overview

[High-level description of what this system does]

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js (App Router) | TBD |
| Backend | Next.js API Routes | TBD |
| Database | [TBD] | Supabase recommended |
| Auth | [TBD] | NextAuth recommended |
| Testing | [TBD] | Jest/Vitest + Playwright |
| Deployment | [TBD] | Vercel recommended |

---

## Directory Structure

```
src/
├── app/                 # Next.js App Router
│   ├── page.tsx        # Home page
│   ├── layout.tsx      # Root layout
│   └── api/            # API routes
├── components/          # React components
│   ├── ui/             # Generic UI components
│   └── features/       # Feature-specific components
├── lib/                 # Shared utilities
│   ├── db.ts           # Database client
│   └── utils.ts        # Helper functions
└── types/               # TypeScript types
```

---

## Data Flow

```
[User] → [Frontend] → [API Routes] → [Database]
                           ↓
                    [External APIs]
```

---

## Key Components

### Component 1: [Name]
- **Purpose:** [What it does]
- **Location:** [File path]
- **Dependencies:** [What it needs]

### Component 2: [Name]
- **Purpose:** [What it does]
- **Location:** [File path]
- **Dependencies:** [What it needs]

---

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add more tables as they're created
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/example | [Description] |
| POST | /api/example | [Description] |

---

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| DATABASE_URL | Database connection | Yes |
| NEXTAUTH_SECRET | Auth encryption | Yes |
| NEXTAUTH_URL | Auth callback URL | Yes |

---

## Patterns & Conventions

### Naming
- Components: PascalCase (`UserProfile.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- API routes: kebab-case (`/api/user-profile`)

### Error Handling
- API routes return `{ error: string }` on failure
- Use try/catch with specific error types
- Log errors with context

### Testing
- Unit tests: `*.test.ts` next to source
- Integration tests: `tests/` directory
- E2E tests: `e2e/` directory

---

## External Integrations

| Service | Purpose | Config Location |
|---------|---------|-----------------|
| [Service] | [Purpose] | [Where configured] |

---

## Security Considerations

- [ ] Input validation on all endpoints
- [ ] Auth required for protected routes
- [ ] Rate limiting on public endpoints
- [ ] CORS configured properly
- [ ] Secrets in environment variables only

---

## Performance Considerations

- [ ] Database queries optimized
- [ ] Images optimized
- [ ] Bundle size monitored
- [ ] Caching strategy defined

---

## Deployment

### Production
```bash
npm run build
npm start
```

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Fill in required variables
3. Run `npm run dev`
