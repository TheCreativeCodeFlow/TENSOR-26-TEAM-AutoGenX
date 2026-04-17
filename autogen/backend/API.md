# API Overview

Base URL: `http://localhost:3001/api/v1`

## Environment Required For Persistence And Auth

Set these in `backend/.env`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`
- `JWT_SECRET`

Supported advisory languages in this project: `en`, `ta`, `ml`, `te`, `or`.

Language map:

- `en`: English
- `ta`: Tamil
- `ml`: Malayalam
- `te`: Telugu
- `or`: Odia

## Free Data Sources You Can Use

These match the problem statement in your attached image and are student-friendly.

### 1) Real-time marine/weather factors (wind, wave proxy, visibility)

Provider: OpenWeather (free plan)

How to get:

1. Sign up at `https://home.openweathermap.org/users/sign_up`.
2. Verify email and log in.
3. Go to `API keys` and copy your free key.
4. Put key in frontend: `VITE_OPENWEATHER_API_KEY`.
5. Put key in backend: `OPENWEATHER_API_KEY`.

Notes:

- Free tier is enough for student/demo usage.
- Wave height may come from marine endpoints or can be combined with synthetic fallback if unavailable.

### 2) Cyclone/storm advisories

Provider: IMD public feeds/pages

How to get:

1. Use IMD public weather/cyclone pages from `https://mausam.imd.gov.in/`.
2. Configure base URL as `IMD_BASE_URL` / `VITE_IMD_BASE_URL`.
3. Consume public bulletins/advisories from available open endpoints or scrape-friendly data sources.

Notes:

- IMD generally provides public data access and bulletins without paid key for basic usage.

### 3) Fishing zone coordinates

Source options (free):

- GPS from browser geolocation (already implemented in onboarding).
- Manual coordinate entry by fisherman.
- OpenStreetMap geometry and your own zone polygons.

How to get:

1. Use browser geolocation API to detect lat/lng.
2. Let user manually enter location label and coordinates.
3. Store zones in backend and match via `/zones/locate`.

### 4) Historical sea incident records

Provider options:

- INCOIS public datasets/feeds
- Synthetic fallback dataset (already available in backend mock data)

How to get:

1. Browse `https://incois.gov.in/` for open marine/ocean data products.
2. Configure base URL as `INCOIS_BASE_URL` / `VITE_INCOIS_BASE_URL`.
3. Start with open datasets and keep synthetic fallback for missing fields.

## Required .env Variables

Backend (`backend/.env`):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_AUTH_TIMEOUT_MS`
- `COAST_GUARD_NUMBER` (set to `1554`)
- `STRICT_LIVE_DATA=true`
- `OPENWEATHER_API_KEY` (optional, recommended)
- `OPENWEATHER_BASE_URL`
- `IMD_BASE_URL`
- `IMD_CAP_RSS_URL`
- `INCOIS_BASE_URL`
- `INCOIS_HIGH_WAVE_URL`
- `INCOIS_STORM_SURGE_URL`

Frontend (`frontend/.env`):

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPENWEATHER_API_KEY` (optional, recommended)
- `VITE_IMD_BASE_URL`
- `VITE_INCOIS_BASE_URL`

## Post-Auth Profile Requirement

After Supabase login, profile completion is mandatory before marine/advisory/alerts/notices/SOS APIs:

Required profile fields:

- fullName
- age
- coastalArea
- locationLabel
- latitude
- longitude
- language (`en`/`ta`/`ml`/`te`/`or`)
- boatType
- phone

If incomplete, protected APIs return `428 PRECONDITION_REQUIRED`.

## Database Persistence Prerequisite

Run [backend/supabase/schema.sql](backend/supabase/schema.sql) in your Supabase project first.

Required tables:

- `fishing_zones`
- `fisher_profiles`
- `sos_events`
- `fisher_auth_metadata`

## Health

- `GET /health/live`
- `GET /health/ready`
- `GET /health/metrics`

## Auth

### Request OTP

`POST /auth/otp/request`

```json
{
  "phone": "+919876543210"
}
```

### Verify OTP

`POST /auth/otp/verify`

```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

### Current User

`GET /auth/me`

Headers:

```text
Authorization: Bearer <backend_jwt_access_token>
```

Demo-only fallback headers (when `ALLOW_DEMO_AUTH_FALLBACK=true`):

```text
x-user-id: user-1
Authorization: Bearer mock-token-user-1
```

## Profiles

### Upsert Profile

`PUT /profiles/me`

Required auth via backend JWT Bearer access token.
Demo fallback is supported only when `ALLOW_DEMO_AUTH_FALLBACK=true`.

## Marine

### Current Conditions

`GET /marine/conditions?zoneId=zone-palk-01`

### Forecast

`GET /marine/forecast?zoneId=zone-palk-01&hours=12`

### Tides

`GET /marine/tides?zoneId=zone-palk-01`

## Advisories

### Live Advisory

`GET /advisories/current/zone-palk-01`

Returns:

- risk score
- risk level
- go/no-go recommendation
- localized message bundle
- active alerts
- danger-zone polygon overlay
- safe-return estimate

### Custom Assessment

`POST /advisories/assessments`

```json
{
  "zoneId": "zone-palk-01",
  "conditions": {
    "windSpeedKmph": 30,
    "waveHeightM": 1.9,
    "visibilityKm": 7,
    "stormIndex": 52
  }
}
```

## Zones

- `GET /zones`
- `GET /zones/:zoneId`
- `POST /zones/locate`

`POST /zones/locate` body:

```json
{
  "lat": 9.62,
  "lng": 79.31
}
```

## Alerts And Notices

- `GET /alerts`
- `POST /alerts`
- `GET /notices`
- `POST /notices`
- `PATCH /notices/:noticeId/expire`

## Emergency SOS

- `POST /emergency/sos/`
- `GET /emergency/sos/mine`
- `PATCH /emergency/sos/:eventId/status`

Emergency reference number: `1554` (Indian Coast Guard).

SOS workflow:

1. Client posts SOS event to backend with zone + coordinates.
2. Backend logs escalation plan and coast guard target `1554`.
3. Client immediately opens dialer `tel:1554` for direct emergency call.
