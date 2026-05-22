# SparkDo

> Your scholastic command center. A curated workspace for assignments, deadlines, and deep focus.

---

## Features

- **Dashboard** — Priorities, progress tracking, and extraction metrics at a glance
- **Tasks** — Daily focus with priority tags, attachments, and Teams sync status
- **Calendar** — Month/week/day views with deadline highlights and focus sessions
- **Profile** — Monitored classes, sync engine status, and integration management
- **Authentication** — Full login / register / password-reset flow with session persistence

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** for blazing fast builds
- **Tailwind CSS v4** with Material You theming
- **Motion** for fluid animations
- **Lucide React** for iconography

## Getting Started

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your `GEMINI_API_KEY` in `.env.local`

3. Run locally:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Authentication

SparkDo includes a complete client-side auth system:

| Feature | Details |
|---------|---------|
| **Register** | Name, email, password with strength indicator |
| **Login** | Email + password with visibility toggle |
| **Forgot Password** | Simulated reset flow (ready for backend integration) |
| **Session** | Persisted via `localStorage` across refreshes |
| **Logout** | Available in header dropdown, sidebar, and profile view |

> **Note:** Auth is currently client-side only (stored in `localStorage`). Swap `AuthContext.tsx` for Firebase, Supabase, or your own backend API when ready.

## Project Structure

```
sparkdo/
├── src/
│   ├── components/
│   │   └── AuthForms.tsx      # Login / Register / Forgot UI
│   ├── contexts/
│   │   └── AuthContext.tsx    # Auth state & user management
│   ├── App.tsx                # Main app shell & routing
│   ├── types.ts               # Shared TypeScript interfaces
│   └── ...
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Start local dev server on port 3000 |
| Build | `npm run build` | Production build to `dist/` |
| Preview | `npm run preview` | Preview production build |
| Lint | `npm run lint` | Type-check with TypeScript |

---

<p align="center">
  <sub>Built with precision in The Scholastic Atelier.</sub>
</p>
