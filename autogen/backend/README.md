# Fisherfolk Weather and Sea Safety Backend

Backend-only Express API for the fisherfolk safety problem statement. This service is modular, versioned under `/api/v1`, and intentionally not wired to the frontend.

## What It Covers

- Twilio Verify phone OTP authentication
- Backend JWT access tokens for protected API calls
- Fisherfolk profile management
- Live marine weather and feed integrations
- Risk advisory scoring with GO / CAUTION / NO_GO / STAY_IN_PORT outputs
- Localized advisory payloads for English, Tamil, Malayalam, Telugu, and Odia
- Fishing zone overlays and zone lookup
- Alerts, notices, and emergency SOS workflows

## Structure

```text
src/
  app.js
  server.js
  config/
  middleware/
  routes/
  data/mock/
  modules/
    auth/
    profiles/
    marine-weather/
    advisories/
    zones/
    alerts/
    notices/
    emergency-sos/
```

## Run

```bash
npm start
```

Server default: `http://localhost:3001`

API prefix default: `/api/v1`

## Environment Setup

Create `backend/.env` from `backend/.env.example`.

### Required for Supabase persistence

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

These are used for profile/SOS/zone persistence through Supabase REST.

### Required for Twilio OTP + backend auth

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

### Supabase tables for persistence

Run [backend/supabase/schema.sql](backend/supabase/schema.sql) in Supabase SQL Editor.

This creates:

- `fishing_zones`
- `fisher_profiles`
- `sos_events`
- `fisher_auth_metadata`

Without these tables, profile, SOS, and zone endpoints will fail.

### Free map and voice setup

No paid key is required for the recommended student setup:

- Map: OpenStreetMap tiles (free/open data)
- Voice: Browser Web Speech API (built-in TTS)

Frontend values for this are documented in `frontend/.env.example`.

## Strict Live Data Mode

This backend now defaults to strict live mode:

- `STRICT_LIVE_DATA=true`
- `ALLOW_DEMO_AUTH_FALLBACK=false`
- `MOCK_OTP_EXPOSURE=false`

In this mode:

- Marine conditions and forecast are fetched from OpenWeather live APIs.
- Alerts are fetched from IMD CAP RSS feed.
- Notices are fetched from INCOIS public bulletin pages.
- Manual alert/notice creation endpoints are intentionally blocked.

## How To Get Supabase Values (Student Friendly)

1. Create a free Supabase project at `https://supabase.com`.
2. In Supabase dashboard, open `Project Settings -> API`.
3. Copy `Project URL` and put it in `SUPABASE_URL`.
4. Copy `anon public` key and put it in `SUPABASE_ANON_KEY`.
5. Use the same values in frontend as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. Open `Authentication -> Providers -> Phone` and enable phone OTP.
7. For development, set test phone numbers in `Authentication -> Users` or use Supabase test OTP flow.

Do not put the service role key in frontend env files.

## Free Data APIs (From Problem Statement)

You can run this project with free sources only.

### OpenWeather Marine/Weather (wind/visibility/wave proxies)

1. Sign up free: `https://home.openweathermap.org/users/sign_up`.
2. Copy API key from dashboard.
3. Set `OPENWEATHER_API_KEY` in backend and `VITE_OPENWEATHER_API_KEY` in frontend.

### IMD cyclone/storm advisories

1. Use public IMD data from `https://mausam.imd.gov.in/`.
2. Set `IMD_BASE_URL` and `VITE_IMD_BASE_URL`.

### GPS fishing zones

- Browser geolocation and manual lat/lng are free and already supported.
- Zone matching is done through `/zones/locate`.

### INCOIS historical/ocean data

1. Use public INCOIS datasets from `https://incois.gov.in/`.
2. Set `INCOIS_BASE_URL` and `VITE_INCOIS_BASE_URL`.
3. Keep synthetic fallback data enabled for demos.

## Mandatory Post-Auth Profile Completion

After auth, protected marine/advisory/alerts/notices/sos routes require completed profile fields:

- fullName
- age
- coastalArea
- locationLabel
- latitude
- longitude
- language (`en`, `ta`, `ml`, `te`, `or`)
- boatType
- phone

If incomplete, backend returns `428 PRECONDITION_REQUIRED` with missing field list.

## Auth Modes

- Preferred: `Authorization: Bearer <backend_jwt_access_token>`
- Local demo fallback (controlled by `ALLOW_DEMO_AUTH_FALLBACK`): `x-user-id` or `Bearer mock-token-<userId>`

## Key Routes

- `POST /api/v1/auth/otp/request`
- `POST /api/v1/auth/otp/verify`
- `GET /api/v1/auth/me`
- `PUT /api/v1/profiles/me`
- `GET /api/v1/marine/conditions?zoneId=zone-palk-01`
- `GET /api/v1/marine/forecast?zoneId=zone-palk-01&hours=12`
- `GET /api/v1/advisories/current/zone-palk-01`
- `POST /api/v1/advisories/assessments`
- `GET /api/v1/zones`
- `POST /api/v1/zones/locate`
- `GET /api/v1/alerts`
- `GET /api/v1/notices`
- `POST /api/v1/emergency/sos/`

## Notes

- The backend uses in-memory mock repositories and synthetic providers so the API is demoable without external dependencies.
- Frontend and backend remain decoupled.
- Production deployment would replace mock repositories with a real database, SMS provider, and real marine/cyclone feeds.
