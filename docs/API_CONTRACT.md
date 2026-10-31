# FoodBridge API contract — proposed v1

**Status: draft for backend agreement.** Base URL `VITE_API_URL` (e.g. `http://localhost:5000/api`). JSON request/response, except `POST /uploads` (`multipart/form-data`). Authenticated requests send `Authorization: Bearer <accessToken>`. Never return password hashes or handover secrets to volunteer endpoints.

## Response conventions
- Success: JSON resource/object or JSON array as described below; `204` for empty success.
- Error: `{ "error": { "code": "INVALID_STATUS", "message": "Human-readable text", "details": {} } }` with suitable HTTP status (`400`, `401`, `403`, `404`, `409`, `422`, `500`).
- Dates: UTC ISO-8601 strings with offset (`2026-10-31T10:00:00Z`); frontend displays local time.
- IDs: opaque strings. Coordinates: `{ "lat": 21.1458, "lng": 79.0882 }` (Nagpur example).
- Pagination (future): agree before adding; v1 lists return arrays.

## Authentication
| Method | Endpoint | Body | Success |
|---|---|---|---|
| POST | `/auth/login` | `{email,password}` | `{accessToken,user}` |
| POST | `/auth/register` | `{name,email,password,role,organization?}` | `{accessToken,user}` |
| GET | `/auth/me` | — | `User` |

`User`: `{id,name,email,role,organization?,organizationId?}`. Roles `donor`, `organization`, `volunteer`, `admin`. Public registration forbids `admin`. Access tokens must have defined expiry; refresh/session strategy needs backend agreement.

## Donations and matching
| Method | Endpoint | Body / query | Success |
|---|---|---|---|
| GET | `/donations` | `?status=&donorId=&category=` | `Donation[]` |
| GET | `/donations/:id` | — | `Donation` |
| POST | `/donations` | `DonationCreate` | `Donation` (`201`) |
| POST | `/donations/:id/cancel` | `{reason?}` | `Donation` |
| GET | `/donations/:id/matches` | — | `Match[]` |
| GET | `/donations/:id/events` | — | `Event[]` |

`DonationCreate`: `{title,category,quantity,unit,preparedAt,pickupStart,pickupEnd,expiresAt,storage,location,lat,lng,photoUrl?}`. `Donation`: same plus `{id,donorId,donor,status,safety,createdAt,organization?,volunteer?,reservationId?}`. Statuses: `available`, `reserved`, `accepted`, `collected`, `delivered`, `cancelled`, `expired`. Safety: `pending`, `passed`, `rejected`. Server enforces expiry, safety and permissions.

`Match`: `{organizationId,organizationName,score,breakdown:{distance,capacityFit,hoursOverlap,needMatch,timeLeft},distanceKm?,eligible,reason?}`. All scores provided by server, not computed by frontend. Agree each breakdown score range (suggest `0..100`) and weighting with backend team.

`Event`: `{id,donationId,actor:{id,name,role},action,status?,createdAt,notes?}`. Server records status transitions and reassignments.

## Reservations
| Method | Endpoint | Body / query | Success |
|---|---|---|---|
| GET | `/reservations` | `?organizationId=&status=` | `Reservation[]` |
| POST | `/reservations` | `{donationId,organizationId}` | `Reservation` (`201`) |
| POST | `/reservations/:id/accept` | — | `Reservation` |
| POST | `/reservations/:id/decline` | `{reason}` | `Reservation` |

`Reservation`: `{id,donationId,organizationId,organization,status,createdAt,updatedAt}`. Statuses: `reserved`, `accepted`, `declined`, `collected`, `delivered`, `cancelled`. Unverified organizations cannot reserve or accept.

## Pickups and handover
| Method | Endpoint | Body / query | Success |
|---|---|---|---|
| GET | `/pickups` | `?volunteerId=&status=` | `Pickup[]` |
| GET | `/pickups/:id` | — | `Pickup` |
| POST | `/pickups/:id/accept` | — | `Pickup` |
| POST | `/pickups/:id/assign` | `{volunteerId}` | `Pickup` |
| POST | `/pickups/:id/handover` | `{code,proofUrl}` | `Pickup` |

`Pickup`: `{id,donationId,organizationId,volunteerId?,status,pickupStart,pickupEnd,lat,lng,location,proofUrl?}`. Statuses: `open`, `assigned`, `collected`, `delivered`, `cancelled`, `missed`. **Handover code is included only in the organization's authorized handover view (endpoint/shape to agree); never in volunteer pickup response.** Server verifies code, proof and deadline.

## Organizations
| Method | Endpoint | Body | Success |
|---|---|---|---|
| GET | `/organizations` | — | `Organization[]` |
| POST | `/organizations/:id/verify` | — | `Organization` |
| POST | `/organizations/:id/reject` | `{reason}` | `Organization` |

`Organization`: `{id,name,location,capacity,need,status}`. Statuses: `pending`, `verified`, `rejected`.

## Incidents
| Method | Endpoint | Body | Success |
|---|---|---|---|
| GET | `/incidents` | — | `Incident[]` |
| POST | `/incidents` | `{donationId,severity,description,photoUrl?}` | `Incident` (`201`) |
| POST | `/incidents/:id/resolve` | `{resolution}` | `Incident` |

`Incident`: `{id,donationId,reporterId,severity,description,photoUrl?,status,createdAt,resolvedAt?}`. Severity `low`, `medium`, `high`, `critical`; status `open`, `resolved`.

## Notifications
| Method | Endpoint | Body | Success |
|---|---|---|---|
| GET | `/notifications` | — | `Notification[]` scoped to current JWT user |
| PATCH | `/notifications/:id/read` | — | `Notification` |

`Notification`: `{id,userId,text,read,createdAt,type?}`. Frontend polls every 30 seconds; websocket upgrade later.

## Impact
| Method | Endpoint | Query | Success |
|---|---|---|---|
| GET | `/impact/monthly` | `?month=2026-10` | `MonthlyImpact` |

`MonthlyImpact`: `{month,rescuedQuantity:{value,unit},completedPickups,missedCollections,cancelledPickups,estimatedWasteKg,conversionFactor:{kgPerUnit,unit},daily:[{date,rescuedKg,completedPickups,missedCollections}]}`. API computes metrics; CSV export can serialize this response client-side.

## Uploads
| Method | Endpoint | Body | Success |
|---|---|---|---|
| POST | `/uploads` | multipart `file` (image JPEG/PNG/WebP, max 5 MB) | `{url,key,contentType,size}` |

Backend must validate MIME, size, ownership, retention and permissions; frontend validation is only UX.

## Pending backend decisions
1. Access token persistence/refresh: prefer HttpOnly Secure cookie refresh; access token in memory.
2. Exact handover-code retrieval endpoint for organization role only.
3. Matching breakdown weights and scores; rescue recovery event/reassignment endpoints.
4. List pagination, standardized sorting, and reporting units/conversion factors.

## Organization handover code
| Method | Endpoint | Body | Success |
|---|---|---|---|
| GET | `/pickups/:id/handover-code` | — | `{id,code}` (organization authorized only) |

## Donor schedules and profile
| Method | Endpoint | Body | Success |
|---|---|---|---|
| GET | `/donor/schedules` | — | `Schedule[]` |
| POST | `/donor/schedules` | `{frequency,day?,time}` | `Schedule` |
| PATCH | `/auth/me` | `{name}` | `User` |
| GET | `/users?role=volunteer` | — | `User[]` (admin only) |

`Schedule`: `{id,userId,frequency,day?,time}`; frequency `daily` or `weekly`.

## Security and compatibility
- `POST /auth/login` and `/auth/register` return `{accessToken,user}`. Mock mode uses `{token,user}`; the frontend auth adapter normalizes both.
- Access token is kept in sessionStorage for prototype session continuity; **never** store passwords. Production should agree on HttpOnly cookie / refresh strategy with backend team.
- CORS must permit the frontend origin and Authorization header.
- Admin-only actions and handover-code access must be enforced server-side. Client-side disabling is only UX.
- For real mode, image uploads return `{url}`. For mock mode, uploaded images are browser data URLs.
- `/impact/monthly?month=YYYY-MM` returns `{month,rescuedQuantity,completedPickups,missedCollections,cancelledPickups,estimatedWasteKg,conversionFactorKgPerUnit,trend:[{label,quantity}]}`.
