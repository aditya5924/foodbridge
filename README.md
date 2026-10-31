# FoodBridge — HACKNOVA 2026 · PS14

A frontend-only React + Vite prototype for Nagpur's community surplus-food rescue network. **No backend code is included.** The current visual language is minimal, editorial, off-white and terracotta.

## Start

1. Install Node.js 20+.
2. Open this folder in VS Code (the folder containing `package.json`).
3. Run `npm install` and `npm run dev`.
4. Open the URL printed by Vite, normally http://localhost:5173/.

Copy `.env.example` to `.env` if you want to change the defaults. `VITE_USE_MOCK=true` runs the interactive local demo. When your backend implements `docs/API_CONTRACT.md`, set `VITE_USE_MOCK=false` and `VITE_API_URL=http://localhost:5000/api` and restart Vite. This switch changes the transport, but the backend must implement the documented contract first.

## Demo accounts (mock mode only)

| Role | Email | Password |
|---|---|---|
| Donor | donor@foodbridge.demo | demo123 |
| Organization | ngo@foodbridge.demo | demo123 |
| Volunteer | volunteer@foodbridge.demo | demo123 |
| Admin | admin@foodbridge.demo | demo123 |

Mock accounts use a common demonstration password, not production authentication. User passwords are not persisted in the mock database. Mock app data is saved locally in the browser and the access token is held in sessionStorage.

## Features

- Landing page, separate sign-in/register, role-protected workspaces, 404.
- Donor: create food with ISO pickup windows, validated photo, history, cancel reserved with confirmation, profile, recurring schedules, traceability.
- NGO: pending verification, browse and reserve, accept/decline with reason, authorized handover code, matching breakdown on details.
- Volunteer: open pickups, directions, accept, handover-code entry, proof photo (the correct code is **not** returned to volunteer).
- Admin: verify NGOs, assign volunteers, incident resolution, recovery queue.
- All roles: incident reporting, map with OpenStreetMap, notification inbox, monthly impact with CSV export, live expiry countdown.
- API service layer: `src/services/http.js`, `src/services/resources/`, `src/services/mockAdapter.js`.

## Limitations / integration notes

- Mock mode simulates server decisions and uses browser storage; it is not a secure backend. Real expiry/safety/authorization must be enforced by the backend.
- The matching breakdown in mock mode is sample adapter data. In real mode the score must come from the API.
- Map tiles and editorial photographs require internet. Address entry is manual; geocoding/autocomplete can be added when an acceptable geocoding provider and its terms are agreed.
- QR scanning is not implemented; manual handover code entry is supported.
- English is the current language; full Marathi/Hindi translation is not complete.
- Real backend compatibility is subject to agreeing on the API contract and integration testing.

## Manual smoke test

1. Sign in as donor, post a listing, see it in history, open detail timeline.
2. Sign in as NGO, reserve an available listing, accept reservation, reveal code.
3. Sign in as volunteer, accept the pickup, enter code and attach photo, verify delivery.
4. Sign in as admin, verify a pending organization, assign an open pickup, resolve an incident.
5. Test map pins, notifications, impact month selection/CSV, 404 route and 360px responsive layout.
6. Set `VITE_USE_MOCK=false` only after your backend implements the documented endpoints.
