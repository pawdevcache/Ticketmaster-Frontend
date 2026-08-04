# TixWave — Ticketmaster Frontend

A modern React (Vite) UI for the Go + MongoDB Ticketmaster backend.

## Run locally

```bash
# 1. Start the backend (in ../Ticketmaster) so it listens on :8080
# 2. Then:
npm install
npm run dev      # http://localhost:5173
```

Vite proxies `/api` and `/discovery` to `http://localhost:8080` — no CORS setup needed.

## Interfaces

| Route | Screen | Backend calls |
|-------|--------|---------------|
| `/` | **Discover** — hero search, category chips, event grid | `GET /discovery/v2/events`, `/classifications` |
| `/events/:id` | **Event detail** — venue, line-up, quantity stepper, booking | `GET /events/{id}`, `/venues/{id}`, `/attractions/{id}`, `POST /api/bookings` |
| `/login` | **Auth** — combined Sign in / Register | `POST /api/login`, `/api/register` |
| `/bookings` | **My Tickets** — list + cancel | `GET /api/bookings`, `DELETE /api/bookings/{id}` |

All routes except `/login` are gated behind auth.

## Structure

Separated by domain — `admin/`, `user/`, and `shared/` — over cross-cutting infra.

```
src/
  main.jsx          entry point (mounts <App/>, applies theme)
  App.jsx           providers + router + route guards
  user/             everything a customer sees
    context/AuthContext.jsx        user session (token in localStorage)
    components/     Navbar, EventCard, ETicket
    pages/          Home, EventDetail, Auth, Bookings, BookingConfirmation
  admin/            everything staff sees
    context/AdminContext.jsx        separate admin session
    pages/AdminDashboard.jsx
  shared/           used by both — Footer, ThemeToggle
  services/api.js   all backend endpoints (fetch wrapper: api + adminApi)
  utils/
    format.js       date/price/availability/cover/calendar helpers
    icons.jsx       central icon list (react-icons/cg)
  styles/index.css  design system (color palette + light/dark themes)
```

Palette + themes live in `:root` / `:root[data-theme="dark"]` in `styles/index.css`.
Icons come from the css.gg set via `react-icons/cg`, aliased centrally in `utils/icons.jsx`.

## Deploy to Vercel

> **The backend must be publicly reachable first.** Vercel serves only this static
> frontend — it cannot see `localhost:8080`. Host the Go API + MongoDB somewhere
> public (Render / Railway / Fly.io + MongoDB Atlas) over **HTTPS**, then continue.

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
   The Vite preset, `npm run build` and `dist/` are picked up from `vercel.json`.
3. Add an environment variable (Project Settings → Environment Variables):

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://your-backend-host.com` |

4. **Deploy.** Redeploy after changing the variable — Vite inlines it at build time.

`vercel.json` rewrites all routes to `index.html`, so deep links like
`/events/E001` and `/bookings` survive a refresh instead of 404ing.

### Alternative: proxy through Vercel (no CORS, hides the backend URL)

Leave `VITE_API_URL` empty and add rewrites **before** the catch-all in `vercel.json`:

```json
{ "source": "/api/:p*",       "destination": "https://your-backend-host.com/api/:p*" },
{ "source": "/discovery/:p*", "destination": "https://your-backend-host.com/discovery/:p*" },
{ "source": "/(.*)",          "destination": "/index.html" }
```

### Backend notes

- CORS is already `Access-Control-Allow-Origin: *`, so direct browser calls work.
- The backend must be served over **HTTPS** — a Vercel (HTTPS) page cannot call an
  `http://` API; browsers block it as mixed content. The proxy option above avoids this.
- Login tokens are random IDs stored in Mongo (not JWTs) and never expire; the
  frontend keeps one in `localStorage`. Fine for a demo — revisit before real use.
