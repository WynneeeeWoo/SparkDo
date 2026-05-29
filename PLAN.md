# SparkDo — Development Plan & Checklist

> A student & parent scholastic planner that automatically pulls homework and activities from Microsoft Teams.

---

## Phase 1: Authentication & Microsoft Teams Integration

- [x] Install `@azure/msal-browser` and `@azure/msal-react`
- [x] Create `src/config/msalConfig.ts` — env-based Azure AD config
- [x] Create `src/services/graphApi.ts` — Microsoft Graph API helpers
- [x] Update `src/contexts/AuthContext.tsx` — dual local + MSAL auth with admin consent flow
- [x] Update `src/components/AuthForms.tsx` — "Sign in with Microsoft" button + admin consent UI
- [x] Update `src/main.tsx` — conditional `MsalProvider` wrapper
- [x] Update `.env.example` — MSAL env variables
- [x] Fix `tsconfig.json` — add Vite client types for `import.meta.env`
- [x] Fix MSAL config TypeScript errors
- [x] Fix `graphApi.ts` import — use `getMsalInstance`
- [x] Production build passes

## Phase 2: Data Layer & State Management

- [x] Create `src/services/teamsSync.ts` — orchestrate Graph API polling + caching
- [x] Add assignment sync engine (pull from `/education/me/assignments`)
- [x] Add class/team sync engine (pull from `/me/joinedTeams`)
- [x] Add calendar sync engine (pull from `/me/calendarview`)
- [x] Store synced data in `localStorage` with timestamp versioning
- [x] Add manual "Re-sync" button + auto-sync on login
- [x] Handle offline mode gracefully (show cached data when network fails)
- [x] Integrate synced data into Dashboard, Tasks, Calendar, and Profile views

## Phase 3: AI Integration (OpenAI)

- [ ] Install `openai` package
- [ ] Create `src/services/aiService.ts` — central OpenAI client (`gpt-4o` / `gpt-4o-mini`)
- [ ] Update `.env.example` — `OPENAI_API_KEY`
- [ ] Implement **Assignment Parser** (see `docs/AI_SCHEMA.md`)
- [ ] Implement **Weekly Study Plan Generator**
- [ ] Implement **Parent Summary Digest**
- [ ] Implement **Smart Task Prioritizer**
- [ ] Add AI caching layer (cache by assignment ID in `localStorage`)
- [ ] Add AI error handling & graceful degradation

## Phase 4: UI Polish & Parent Features

- [x] Parent dashboard view (read-only summary of child's tasks)
- [x] Weekly digest card with stats + red flags in Family view
- [x] Red-flag alerts for overdue assignments (banner + badges)
- [x] Task completion tracking with animated progress bar
- [x] Focus timer / Pomodoro integration with circular progress
- [x] Dark mode toggle with full Material You color overrides
- [x] Family tab added to bottom nav + sidebar with icon navigation

## Phase 5: Deployment & DevOps

- [ ] Add GitHub Actions CI for build + lint checks
- [ ] Configure production `.env` variables
- [ ] Deploy to Vercel / Netlify / Cloud Run
- [ ] Set up Microsoft 365 Developer tenant for end-to-end testing
- [ ] Write admin setup guide for school IT departments

---

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Copy .env.example -> .env.local and fill in your keys

# 3. Start dev server
npm run dev
# Open http://localhost:3000

# 4. Build for production
npm run build
```

## Microsoft Teams Setup (For Schools)

1. Register app in [Azure Portal](https://portal.azure.com) → Microsoft Entra ID → App registrations
2. Add delegated permissions: `EduAssignments.Read`, `TeamMember.Read.All`, `Calendars.Read`, `User.Read`
3. Grant **admin consent** for the tenant
4. Copy `Client ID` and `Tenant ID` into `.env.local`

---

## Architecture Overview

```
SparkDo React App
├── Auth (localStorage + MSAL)
├── Graph API Service (Teams/Outlook data)
├── AI Service (OpenAI enrichment)
├── Sync Engine (polling + caching)
└── UI Views (Dashboard / Tasks / Calendar / Profile)
```

---

*Last updated: 2026-05-29*
