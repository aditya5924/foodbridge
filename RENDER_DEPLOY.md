# Render deployment — FoodBridge

The ZIP contains frontend and backend in the same project root.

## Fastest judge demo (no live database required)
1. Push this project to GitHub **without a .env file**.
2. Render → New → Static Site → GitHub repo → root blank, build `npm ci && npm run build`, publish `dist`.
3. Environment: `VITE_USE_MOCK=true` (Vite variables require a new build).
4. Add rewrite rule Source `/*` → Destination `/index.html` (Rewrite) so reloading /admin works.
5. Open an incognito window; use Admin `admin@foodbridge.demo` / `demo123`, or other demo accounts in the login page.
6. For prototype use, don't share real personal information: demo users/data are stored in that browser's localStorage.

## Live backend deployment
1. Render → New → Web Service → same repo → build `npm ci` → start `npm run server`.
2. Backend Environment: `DATABASE_URL` (Supabase), `JWT_SECRET` (32+ random characters), `NODE_ENV=production`, `FRONTEND_URL=https://YOUR-FRONTEND.onrender.com` (no trailing slash). Existing `FRONTEND_ORIGINS` values may also be used as comma-separated origins.
3. Initialize schema on Supabase using `database/schema.sql` (never run destructive changes against a populated DB without a backup).
4. For admin in live database, securely set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` and run `npm run db:seed` against the intended database from a trusted environment. Demo account credentials are NOT live database credentials.
5. Frontend Static Site env: `VITE_USE_MOCK=false`, `VITE_API_URL=https://YOUR-BACKEND.onrender.com/api`. **Rebuild and redeploy**.
6. Check `https://YOUR-BACKEND.onrender.com/api/health` (this also probes DB connectivity).

## Known limits
- End-to-end hosted Supabase auth has not been live-tested in this package.
- Uploaded images use local backend disk, which is ephemeral on Render free services; Cloudinary integration is not implemented. For durable uploads use object storage.
- The NGO matching engine is a placeholder in live API mode. Demo uses illustrative scoring.
- HTML/CSS is responsive, but multilingual translation keys are not fully implemented.
- A live production rollout needs security, food safety, and load testing.
- Do not commit `.env`, API keys, passwords or deploy hooks.

## Donation visibility and notifications
- In `VITE_USE_MOCK=true`, donors and NGOs can see the same donation only when they are using the **same browser profile and origin**. Mock data is in browser localStorage, not a shared server. A separate phone, incognito window, or browser has its own independent data.
- This patch creates notifications for verified NGOs when donor posts food and allows unverified NGOs to browse (but not reserve) food. To see changes, refresh the NGO dashboard or switch to the NGO account in the same browser.
- For cross-device donor-to-NGO sharing, use `VITE_USE_MOCK=false`, verified backend auth, and the shared Supabase PostgreSQL database. The backend now notifies verified NGO users on donation creation. Be sure to set `VITE_API_URL` and `FRONTEND_URL` correctly, and rebuild frontend.
