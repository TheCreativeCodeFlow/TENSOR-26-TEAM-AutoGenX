# Fisherfolk Sea Safety System - Frontend

## Overview
React + Tailwind CSS frontend for the Fisherfolk Sea Safety application.

## Features Implemented

✅ **Authentication**
- Supabase phone OTP login
- Supabase OAuth support
- Protected routes
- Mandatory profile setup flow (post-auth)

✅ **Dashboard Screens**
- Safe Dashboard (GO)
- Danger Alert (NO-GO)
- Advisory Dashboard (Caution)
- Cyclone Dashboard (Stay in Port)
- Map & Risk Zones
- History Log

✅ **Profile Management**
- Profile setup form with all fisherman details
- Required fields: name, age, coastal area, location, language, boat type, phone
- Profile view page

✅ **Safety Features**
- SOS flow integrated with backend event logging and direct call to Coast Guard `1554`
- Voice readout in supported languages
- Map preview + risk overlay

✅ **Responsive Design**
- Desktop sidebar navigation
- Mobile bottom navigation
- Mobile-friendly FAB

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Access at: http://localhost:5173

## Demo Flow

1. Open http://localhost:5173
2. Enter phone number and request OTP via Supabase
3. Verify OTP
4. Complete onboarding profile (mandatory)
5. Access dashboard and advisories
6. Use SOS to log incident and call `1554`

## Environment

Create `frontend/.env` from `frontend/.env.example`.

Required:

- `VITE_API_BASE_URL=http://localhost:3001/api/v1`
- `VITE_SUPABASE_URL=<your supabase project url>`
- `VITE_SUPABASE_ANON_KEY=<your supabase anon key>`

Optional free providers:

- `VITE_OPENWEATHER_API_KEY`
- `VITE_IMD_BASE_URL`
- `VITE_INCOIS_BASE_URL`

## Language Support

Supported app/advisory languages:

- English (`en`)
- Tamil (`ta`)
- Malayalam (`ml`)
- Telugu (`te`)
- Odia (`or`)

Voice readout maps these to browser voices where available.

## Free API Setup Guide

### OpenWeather (real-time weather factors)

1. Create free account: `https://home.openweathermap.org/users/sign_up`.
2. Create API key in dashboard.
3. Add key to `VITE_OPENWEATHER_API_KEY`.

### IMD advisories (cyclone/storm)

1. Use public IMD advisory sources: `https://mausam.imd.gov.in/`.
2. Set `VITE_IMD_BASE_URL` for your feed adapter.

### Fishing location coordinates

1. Use browser GPS detection in onboarding.
2. Allow manual latitude/longitude input as fallback.

### INCOIS historical incidents/data

1. Discover public datasets from `https://incois.gov.in/`.
2. Set `VITE_INCOIS_BASE_URL`.
3. Use backend synthetic fallback data where open records are incomplete.

## Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Routing & protected routes |
| `src/components/Layout.jsx` | Main layout with nav |
| `src/pages/Login.jsx` | OTP login page |
| `src/pages/ProfileSetup.jsx` | Profile registration |
| `src/pages/ProfileView.jsx` | Profile display |
| `src/services/api.js` | API calls |
