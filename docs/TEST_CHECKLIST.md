# Manual backend test checklist

- [ ] `npm install` and `npm run db:init` complete without errors.
- [ ] `/api/health` returns HTTP 200.
- [ ] Register donor, organization and volunteer; admin registration is rejected.
- [ ] Login returns `{accessToken,user}` and wrong password returns 401.
- [ ] Donor posts donation with ISO timestamps and sees it in GET /donations.
- [ ] Newly registered organization is `pending`; cannot reserve.
- [ ] Admin verifies organization; organization can reserve eligible donation.
- [ ] Organization accepts reservation; pickup becomes `open`.
- [ ] Organization can fetch handover code; volunteer receives 403 on that endpoint.
- [ ] Volunteer accepts pickup; uploads image and submits code + proofUrl; delivery status and timeline update.
- [ ] Incorrect code is rejected; volunteer cannot submit another volunteer's pickup.
- [ ] Donor cancels reserved donation; reservation and pickup cancellation notifications are created.
- [ ] Notifications are scoped to JWT user; one user cannot mark another user's notification as read.
- [ ] Any signed-in role can report an incident; admin can resolve it.
- [ ] Impact report returns monthly counts and does not fabricate kg conversion.
- [ ] 401/403/404/409/422 errors return `{error:{code,message}}`.
- [ ] Test phone access using LAN IP, correct Vite host setting, CORS and firewall.

## Backend team follow-ups

1. Build real matching and explainable breakdown.
2. Add expiry/missed-collection background worker and recovery/reassignment policy.
3. Decide handover sequence (collected versus delivered), security limits and anti-brute-force.
4. Define food-safety review and authorized signoff.
5. Define quantity conversion to kg and proper monthly reporting basis.
6. Add API integration tests, migrations, structured logging and deployment hardening.
