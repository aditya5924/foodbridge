# Frontend delivery notes

## Changed / created
- `src/App.jsx`: React Router navigation, role guards, session, per-user notification polling.
- `src/main.jsx`: new entry stylesheet.
- `src/ui/Pages.jsx`: working donor, NGO, volunteer, admin, map, impact, auth and home flows.
- `src/ui/Shared.jsx`: reusable cards, live countdown, photo input, timeline, match breakdown, modal, async loading and errors.
- `src/ui/foodbridge.css`: responsive minimal design (360px, 768px, 1280px).
- `src/services/mockAdapter.js`: cleaned mock data and state transitions; pickup PK-202 linked to reserved food.
- `src/services/resources/{auth,donations,pickups,impact,schedules,users}.js`: API-ready resource calls.
- `src/services/format.js`: shared local date/time formatting.
- `package.json`: React Router, Leaflet, React Leaflet and localization packages.
- `.env.example`, `.gitignore`, `README.md`, `docs/API_CONTRACT.md`.

## Manual test checklist
- [ ] `npm install` then `npm run build` on a machine with npm registry access.
- [ ] Open `/login`, select each demo role and sign in.
- [ ] Donor add donation, history and cancel reserved confirmation.
- [ ] Organization reserve, accept/decline, see handover code.
- [ ] Volunteer pickup accept, photo upload and code verification.
- [ ] Admin verify pending NGO, assign volunteer and resolve incident.
- [ ] Donation timeline, map, monthly report CSV, notifications.
- [ ] Invalid routes show 404; protected routes redirect to login.
- [ ] Test at 360px, 768px and 1280px.

## Remaining integration work
- Backend agreement on `docs/API_CONTRACT.md` and end-to-end tests.
- Full address autocomplete and QR scanner.
- Marathi/Hindi translation completeness.
- Browser automation and production build were not available in this execution environment.
