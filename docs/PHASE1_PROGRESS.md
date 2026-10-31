# Phase 1 — foundation checkpoint (not complete)

## Added
- `frontend/src/services/http.js` — HTTP wrapper, bearer token in memory, 401 callback, normalized errors.
- `frontend/src/services/mode.js` — `VITE_USE_MOCK` switch.
- `frontend/src/services/mockAdapter.js` — transitional async mock operations; incomplete features throw explicit errors.
- `frontend/src/services/resources/*.js` — nine REST resource service modules plus query helper.
- `docs/API_CONTRACT.md` — draft endpoint/shape contract for backend review.
- `frontend/.env.example` — mock/API settings; `.env` removed and ignored.
- `frontend/package.json` — dev server binds localhost by default.

## Still required before switching to real API
- Existing pages and `App.jsx` **still use legacy synchronous `api.js`** and localStorage. They have NOT been migrated to resource services.
- Existing demo credentials are still in legacy seed data. This is not production-ready authentication.
- Auth provider, route guard, async loading/errors, mock user-scoped notifications, seed consistency, handover and monthly mock report remain to implement.
- Backend contract needs agreement, especially handover code access and recovery endpoints.

## Run
1. `cd FoodBridge/frontend`
2. Copy `.env.example` to `.env` and keep `VITE_USE_MOCK=true`.
3. `npm install`
4. `npm run dev`

## Manual checks
- Landing page loads, demo sign-in and role pages work as before.
- No backend request is made by legacy pages yet.
- Import `resources/auth.js` and test `login({email:'donor@foodbridge.demo',password:'demo123'})` separately; it returns a promise.
- With `VITE_USE_MOCK=false`, resource calls target `VITE_API_URL` and return `ApiError` on failure.
