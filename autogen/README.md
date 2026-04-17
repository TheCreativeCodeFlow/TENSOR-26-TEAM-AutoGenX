# Fisherfolk Safety System

A practical coastal safety platform built for Indian fishermen.

This project is designed around a real field constraint: internet is unreliable at sea. So the product is not just "forecast on a screen" - it includes offline safety guardrails, multilingual voice alerts, boundary awareness, and emergency-first workflows.

---

## Why We Built This

Fishermen often make go/no-go decisions based on weather at departure time. But conditions can change quickly after 1-2 hours at sea. Network coverage also drops offshore, which means cloud-only warning systems fail exactly when they are needed.

We built this to answer that gap with:
- real-time advisory when network is available,
- offline safety logic when network is gone,
- simple, low-literacy UI with voice-first cues,
- one-tap emergency escalation.

---

## What Is In This Repository

This repo contains both backend and frontend in one workspace:

- backend service: API, auth, profile enforcement, marine/advisory modules, SOS logging, APK download endpoint.
- frontend web app: login, onboarding, dashboards, risk map, history, offline safety guard, multilingual voice readout.

Folder structure:

- backend
- frontend

---

## Core Features

### 1) Auth + Onboarding
- Phone OTP login flow.
- Mandatory profile completion after login.
- Fisher-specific profile fields (zone, language, boat details, safety phone).

### 2) Advisory + Risk Dashboards
- Safe / Advisory / Danger state views.
- Wind, wave, visibility metrics with animated visual cards.
- Safety recommendation cards with localized UI labels.

### 3) Offline Safety Guard (Important)
- GPS-based boundary proximity/crossing alerts.
- Forecast freshness checks and stale warning escalation.
- Offline SOS queue and auto-retry when network returns.
- Live return-to-shore guidance (distance + direction).

### 4) Multilingual Voice Alerts
- English, Tamil, Malayalam, Telugu, Odia.
- Voice readout component with fallback strategy for device voice availability.

### 5) SOS Pipeline
- One-tap SOS action.
- Coast Guard call intent (1554).
- Distress payload logging and offline queue behavior.

### 6) APK Distribution
- Backend route to download APK directly:
  - GET /download/apk

---

## Tech Stack

### Frontend
- React
- React Router
- Tailwind CSS
- Web Speech API

### Backend
- Node.js
- Express
- Modular service/repository architecture

### Data and Integrations
- Supabase (persistence and profile/event data)
- Twilio Verify (OTP path)
- Marine/advisory sources integrated through backend modules

---

## Local Setup

## Prerequisites
- Node.js 18+
- npm

## 1) Backend

From project root:

```bash
cd backend
npm install
```

Create backend env file:

- copy backend/.env.example -> backend/.env
- fill required values

Run backend:

```bash
npm run dev
```

If your backend uses npm start instead of dev in your local setup:

```bash
npm start
```

Expected backend URL:
- http://localhost:3001

## 2) Frontend

From project root:

```bash
cd frontend
npm install
```

Create frontend env file:

- copy frontend/.env.example -> frontend/.env
- set VITE_API_BASE_URL to backend API prefix

Example:

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

Run frontend:

```bash
npm run dev
```

Expected frontend URL:
- http://localhost:5173

---

## Runtime Routes (Frontend)

- / -> public landing homepage
- /login -> login page
- /onboarding -> profile setup (post-auth)
- /app -> protected dashboard shell
- /app/advisory
- /app/danger
- /app/map
- /app/history
- /app/profile

---

## Quick Judge Demo Flow (3-5 mins)

1. Open landing page at /
2. Show Login and Download APK entry points.
3. Login with OTP and complete onboarding.
4. Show safe/advisory/danger dashboards.
5. Show Offline Safety Guard panel.
6. Explain:
   - boundary alert behavior,
   - forecast freshness escalation,
   - return-to-shore cue,
   - SOS queue + auto-retry.
7. Open history and show server + offline events.

---

## Design Notes For Real-World Use

- Offline-first behavior matters more than perfect forecast UI.
- Voice and color cues are prioritized for low-literacy users.
- Critical flows avoid deep menu navigation.
- Safety messaging is intentionally repetitive in danger states.

---

## Known Constraints (Honest)

- Non-English TTS quality depends on device/browser voice packs.
- Offshore real-time communication still benefits from VHF/satellite hardware support.
- Weather updates are best-effort under intermittent connectivity.

---

## What We Would Add Next

- Full-screen emergency takeover UI in boundary-crossed mode.
- Stronger geofencing with production maritime polygons.
- Pre-recorded local-language emergency audio packs.
- Native Android integration for robust background alerts.

---

## Social and Contact Links

Replace these placeholders with your final links:

- GitHub: https://github.com/Eshwar187
- LinkedIn: https://www.linkedin.com/in/j-eshwar-7b8854289/
- Portfolio: https://dev-folio-xi-taupe.vercel.app/
- Contact Email: jeshwar.work@gmail.com

---
