# FoodBridge integration review

This archive was inspected and configured using the **second (most recently shared) Supabase connection URL**. It contains both frontend and backend files in a **single folder**. The existing package.json had frontend-only dependencies; backend dependencies and scripts have been added.

## Run
1. Open this directory in VS Code.
2. `npm.cmd install`
3. If database is empty, `npm.cmd run db:init` then optionally `npm.cmd run db:seed`. **Do not run against a populated database without confirming schema compatibility and backups.**
4. In one terminal `npm.cmd run server`
5. In another terminal `npm.cmd run dev`
6. Verify `http://localhost:5000/api/health` and the Vite URL.

## Important limitations
- Cloudinary credentials are in `.env` but the current `routes/uploads.js` uses **local disk storage**, not Cloudinary. Cloudinary is NOT connected.
- Database connectivity, schema compatibility, and full frontend/API integration have NOT been tested.
- The supplied RAR contained `node_modules` which was deliberately excluded from this ZIP. Reinstall dependencies locally.
- The `.env` file contains real credentials and must never be uploaded to a public repository or shared broadly. The existing `.gitignore` ignores `.env`. Rotating exposed credentials is strongly advised.
- The frontend uses `VITE_USE_MOCK=false` in `.env`; if pages still use mock-only logic, additional integration fixes may be needed.
