# Kadal Kavalan App - Project Summary

## 1. Problem Statement & Objective

### Problem Statement

Coastal fishing communities in India face significant safety risks due to unpredictable marine weather conditions. Tamil Nadu, Kerala, Andhra Pradesh, and Odisha collectively have thousands of fishermen who venture into the sea daily, often with limited access to accurate, timely weather information. The lack of localized marine weather forecasting specifically tailored for small-scale fishermen results in:

- **High accident rates**: Fishermen frequently encounter sudden weather changes, leading to capsizing and fatalities
- **Language barriers**: Existing weather apps are primarily in English, inaccessible to local fishing communities
- **No boat-specific risk assessment**: Generic weather forecasts don't account for vessel type (small vallam/catamaran vs. large trawlers)
- **Inadequate warning systems**: Official alerts from IMD and INCOIS are not delivered in real-time or in local languages
- **No return time estimation**: Fishermen have no way to estimate safe return windows

### Objective

**Kadal Kavalan** (Tamil: "Sea Guardian") aims to provide:

1. **Real-time risk assessment** - Zone-specific marine safety scoring (0-100 scale)
2. **Multi-language interface** - Support for Tamil, Malayalam, Telugu, Odia, and English
3. **Boat-class aware warnings** - Risk thresholds tailored to vessel size (Class A/B/C)
4. **Safe departure windows** - Time slots recommended for safe sea entry and return
5. **Hourly risk forecasting** - 48-hour ahead risk prediction timeline
6. **Voice output** - Text-to-speech for hands-free operation at sea
7. **Journey tracking** - GPS-based heading and distance tracking
8. **Offline capability** - Cached data for areas with poor connectivity
9. **Cyclone alerts** - Special warnings for approaching cyclones
10. **ML-enhanced predictions** - Machine learning models trained on historical data

---

## 2. Methodology / Approach

### Research Phase

1. **Fishing Zone Mapping** - Identified 11 primary fishing zones across 4 coastal states using:
   - State-wise coastal boundaries
   - INCOIS zone codes
   - IMD regional codes
   - Centroid coordinates for each zone

2. **Weather Data Sources**:
   - **Open-Meteo API**: Real-time marine weather (wave height, wind speed, visibility, swell)
   - **IMD (India Meteorological Department)**: Official warnings
   - **INCOIS (Indian National Centre for Ocean Information Services)**: Sea state alerts
   - **Open-Meteo Archive**: Historical data for ML training (2023-2024)

3. **Boat Classification**:

| Class | Vessel Type | Max Wave | Max Wind | Max Gust | Min Visibility |
|------|-------------|----------|----------|----------|----------------|
| A | Vallam/Catamaran | 1.0m | 28 km/h | 35 km/h | 3 km |
| B | Country Craft | 2.0m | 40 km/h | 50 km/h | 2 km |
| C | Trawler/Mechanical | 3.5m | 55 km/h | 65 km/h | 1 km |

### Design Phase

1. **Risk Algorithm Development**:
   - Wind speed contribution: 30%
   - Wave height contribution: 25%
   - Visibility contribution: 20%
   - Swell height contribution: 15%
   - Weather code (fog/rain): 10%

2. **Risk Levels**:
   - SAFE (0-29): Conditions suitable for voyage
   - ADVISORY (30-54): Caution advised
   - DANGER (55-79): Return to shore recommended
   - CYCLONE (80-100): Extreme danger - do not venture

3. **Localization Strategy**:
   - All UI strings translated to 5 languages
   - Zone names in native scripts
   - Date/time formatting per locale

### Development Phase

1. **Tech Stack Selection**:
   - **Framework**: Expo SDK 51 with React Native 0.74.5
   - **Language**: TypeScript
   - **Navigation**: React Navigation 6 (bottom tabs + native stack)
   - **Animations**: React Native Reanimated 3
   - **State Management**: React Context API

2. **Data Architecture**:
   - WeatherContext: Real-time weather state
   - UserContext: User preferences and zone selection
   - AsyncStorage for local persistence

3. **ML Pipeline** (models/ folder):
   - Historical data collection (2 years, 11 zones)
   - Label generation using risk algorithm
   - HuggingFace AutoTrain model preparation
   - Three prediction models: Day Safety, Hourly Risk, Return Time

---

## 3. System Architecture

### High-Level Architecture

```
MOBILE APP
┌─────────────────────────────────────────────────────────────────┐
│  MainDashboard  │  AlertsScreen  │  NauticalMapScreen          │
│  Onboarding     │  SettingsScreen│  Tab Navigator              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
CONTEXT LAYER
┌─────────────────────────────────────────────────────────────────┐
│  WeatherContext  │  UserContext  │  ThemeContext               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
API LAYER
┌─────────────────────────────────────────────────────────────────┐
│  weather.ts  │  imd.ts  │  incois.ts  │  mlApi (Render)       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
EXTERNAL APIS
┌─────────────────────────────────────────────────────────────────┐
│  Open-Meteo  │  IMD  │  INCOIS  │  HuggingFace Models        │
└─────────────────────────────────────────────────────────────────┘
```

### Module Structure

```
src/
├── api/
│   ├── client.ts          # API client configuration
│   ├── weather.ts         # Open-Meteo integration
│   ├── imd.ts             # IMD warning fetching
│   ├── incois.ts         # INCOIS alert fetching
│   ├── types.ts          # TypeScript interfaces
│   └── index.ts          # API exports
├── context/
│   ├── UserContext.tsx   # User preferences state
│   ├── WeatherContext.tsx# Weather data state
│   └── ThemeProvider.tsx # Theme management
├── screens/
│   ├── MainDashboard.tsx # Primary risk dashboard
│   ├── AlertsScreen.tsx  # Journey tracking + compass
│   ├── NauticalMapScreen.tsx # Map visualization
│   ├── OnboardingScreen.tsx # First-time setup
│   └── SettingsScreen.tsx # User settings
├── data/
│   ├── zones.ts          # 11 fishing zones definition
│   └── coastline.ts     # Coastal boundaries
├── services/
│   ├── riskScorer.ts    # Risk calculation engine
│   └── marineWeather.ts # Marine weather utilities
├── utils/
│   └── riskEngine.ts    # Risk level helpers
├── navigation/
│   └── AppNavigator.tsx # Tab + Stack navigation
├── theme/
│   ├── colors.ts, typography.ts, spacing.ts, shadows.ts
│   └── ThemeProvider.tsx
├── i18n/
│   └── index.ts         # Internationalization
└── services/
    └── hfInference.ts   # ML model inference

models/
├── scripts/
│   ├── fetch_historical_data.ts # Data collection
│   ├── generate_labels.ts       # Label creation
│   └── prepare_hf_dataset.ts   # HF format conversion
├── src/
│   ├── services/
│   │   └── mlRiskScorer.ts     # ML scoring
│   └── types/
│       └── mlTypes.ts          # ML type definitions
├── backend/
│   ├── config.json
│   ├── hourly_risk.json
│   └── day_safety.json
└── IMPLEMENTATION_PLAN.md
```

---

## 4. Implementation Details

### Core Features Implemented

#### 4.1 Risk Assessment Dashboard (MainDashboard.tsx)

**Components**:
- Hero Risk Card: Location name, risk level (SAFE/ADVISORY/DANGER/CYCLONE), reason text
- Live Clock Widget: Real-time clock with weather-aware sky icon (sun/moon/cloud/rain)
- Hourly Risk Timeline: 24-hour horizontal bar visualization with animated fills
- Overall Score Ring: SVG circle animation showing 0-100 risk score
- Safe Departure Window: Time range pill showing best return window
- Wind Hero Card: Animated odometer display of wind speed
- Secondary Metrics: Wave height, visibility, swell cards
- Tide Card: High/low tide times and heights
- Offline Mode Banner: Cached data indicator
- Floating Voice Button: Text-to-speech trigger

**Animations**:
- Screen entry: Fade + slide up (900ms)
- Card mounts: Staggered delay (70ms intervals)
- Hero pulse: Continuous glow (7s loop)
- Timeline capsules: Fill animation per segment
- Odometer digits: Rolling number animation
- Voice button pulse: Ripple effect when speaking

#### 4.2 Alerts & Journey Screen (AlertsScreen.tsx)

**Features**:
- Real-time compass with smooth heading smoothing
- GPS journey tracking:
  - Captures heading samples every 10 minutes
  - Stores up to 144 samples per journey
  - Uses heading smoothing algorithm (alpha=0.2)
- Journey summaries:
  - Average heading and direction
  - Distance from start (Haversine formula)
  - Estimated return hours calculation
- Journey log storage (AsyncStorage)
- Up to 10 saved journey summaries

**Calculations**:
- Distance: Haversine formula between coordinates
- Bearing: Initial bearing to destination
- Return time: Distance / (Base speed - wind penalty)

#### 4.3 Nautical Map (NauticalMapScreen.tsx)

- Interactive map with react-native-maps
- Zone markers showing current location
- Coastal zone boundaries (coastline.ts data)
- Weather overlay possibilities

#### 4.4 Onboarding Flow (OnboardingScreen.tsx)

- Welcome screens (3 slides)
- Zone selection (picker with 11 zones)
- Boat class selection (A/B/C with descriptions)
- Language selection (5 languages)
- Notification preferences
- Completion flag storage

#### 4.5 Settings (SettingsScreen.tsx)

- Change zone
- Change boat class
- Change language
- Toggle notifications
- Morning alert time picker
- Theme toggle (light/dark)
- About section
- Version info

#### 4.6 Weather Context (WeatherContext.tsx)

**Responsibilities**:
- Fetch weather data on zone/boat class change
- 15-minute stale data check
- Cache management (AsyncStorage)
- Offline mode detection
- Risk score calculation call
- Forecast 48-hour data preparation

**Data Flow**:
```
User selects zone → WeatherContext fetches weather
→ Open-Meteo API → Risk calculation
→ State update → UI renders
```

#### 4.7 User Context (UserContext.tsx)

**Responsibilities**:
- Load saved preferences on app start
- Default to TN-01 zone, Class A, Tamil
- Save preferences to AsyncStorage
- Update triggers weather refetch

#### 4.8 API Integration

**Weather Endpoint**: Open-Meteo Marine API
- Parameters: wave_height, swell_height, wind_speed, wind_gusts, visibility
- Forecast: 48 hours hourly

**IMD Endpoint**: imd.gov.in warnings (scraped/formatted)
**INCOIS Endpoint**: incois.gov.in alerts

**ML Backend**: Render.com hosted (models/backend/)
- hourly_risk.json: Pre-computed hourly risks
- day_safety.json: Day-level safety scores
- return_time.json: Return time estimates

#### 4.9 Risk Scoring Algorithm

```typescript
function calculateRiskScore(conditions, boatClass):
  // Thresholds based on boat class
  thresholds = BOAT_CLASS_THRESHOLDS[boatClass]

  // Individual scores (0-100, lower is better)
  waveScore = min(100, (conditions.wave_height / thresholds.max_wave_height) * 100)
  windScore = min(100, (conditions.wind_speed / thresholds.max_wind_speed) * 100)
  gustScore = min(100, (conditions.wind_gust / thresholds.max_wind_gust) * 100)
  visScore = min(100, (thresholds.min_visibility / conditions.visibility) * 100)
  swellScore = min(100, (conditions.swell_height / thresholds.max_swell_height) * 100)

  // Weighted average
  riskScore = (waveScore * 0.25) + (windScore * 0.30) +
              (gustScore * 0.10) + (visScore * 0.20) + (swellScore * 0.15)

  // Risk level determination
  if riskScore >= 80: return 'CYCLONE'
  if riskScore >= 55: return 'DANGER'
  if riskScore >= 30: return 'ADVISORY'
  return 'SAFE'
```

#### 4.10 Multi-Language Support

**Supported Languages**:
- Tamil (ta): Primary zone - TN-01 to TN-04
- Malayalam (ml): Primary zone - KL-01 to KL-03
- Telugu (te): Primary zone - AP-01 to AP-02
- Odia (or): Primary zone - OD-01 to OD-02
- English (en): Default

**Translated Elements**:
- UI labels and buttons
- Zone names
- Risk level text
- Weather descriptions
- Error messages

#### 4.11 Voice Output (expo-speech)

**Languages**:
- Tamil: 'ta-IN'
- Malayalam: 'ml-IN'
- Telugu: 'te-IN'
- Odia: 'or-IN'
- English: 'en-IN'

**Content**: Synthesized risk summary including:
- Zone name
- Risk level
- Risk score
- Wave height
- Wind speed
- Safe window

#### 4.12 ML Models (models/)

**Phase 1 - Data Collection**:
- Open-Meteo Archive API (2023-2024)
- 11 zones × 2 years × ~8,000 hours = ~176,000 data points

**Phase 2 - Label Generation**:
- Apply existing riskScorer to historical data
- Generate: day_safe (0/1), hourly_risk (0-100), return_time (hours)

**Phase 3 - Model Training**:
- Model 1: Day Safety - Binary classification
- Model 2: Hourly Risk - Multi-output regression (24 outputs)
- Model 3: Return Time - Regression

**Phase 4 - Inference**:
- HuggingFace inference endpoint
- Render.com backend API
- Response caching

---

## 5. Results / Outputs

### App Screenshots

Note: Screenshots would be captured during actual app testing. The following describes what appears on each screen.

#### Main Dashboard
- **Top Section**: Location name + Risk level badge (GREEN/YELLOW/ORANGE/RED)
- **Clock Widget**: Live time, date, sky condition icon
- **Timeline**: Horizontal bar chart showing 24-hour risk
- **Score Ring**: Large number (0-100) in circular progress
- **Window Pill**: "5:00 AM - 11:00 AM" format with color indicator
- **Metrics Cards**: Wind, wave, visibility, swell values
- **Tide Card**: High/low times and heights
- **Floating Button**: Green circular button (bottom-right)

#### Alerts Screen
- **Compass**: Rotating SVG compass with N/E/S/W markings
- **Journey Card**: Start/End positions, average heading
- **Stats**: Duration, distance, estimated return time
- **History**: List of past journeys

#### Settings Screen
- **Profile Section**: Zone, boat class, language
- **Preferences**: Notification toggles, alert time
- **Appearance**: Theme selector
- **About**: App version, credits

### Key Metrics

| Metric | Value |
|--------|-------|
| Supported Zones | 11 |
| Supported States | 4 (TN, KL, AP, OD) |
| Languages | 5 |
| Boat Classes | 3 |
| Risk Levels | 4 |
| Forecast Hours | 48 |
| Update Frequency | ~15 minutes |

### Build Configuration

- **Package Name**: com.kadalkavalan.app
- **iOS Bundle**: com.kadalkavalan.app
- **Min Android SDK**: 23 (Android 6.0)
- **Target SDK**: 34 (Android 14)
- **Expo SDK**: 51.0.39

### Data Sources Used

| Source | Data Type | Update Frequency |
|--------|-----------|------------------|
| Open-Meteo | Weather forecast | ~15 minutes |
| IMD | Warnings | On issuance |
| INCOIS | Sea alerts | On issuance |
| ML Backend | Risk predictions | On demand |

---

## 6. Conclusion & Future Scope

### Conclusion

Kadal Kavalan successfully implements a comprehensive fishermen safety application with:

1. **Real-time risk assessment** - Validated risk algorithm accounting for boat class
2. **Multi-zone coverage** - 11 fishing zones across 4 Indian coastal states
3. **Full localization** - 5 languages with native script support
4. **Professional UI** - Animated dashboard with real-time clock and timeline
5. **Journey tracking** - GPS-based heading and distance calculations
6. **Offline capability** - Cached data for connectivity-challenged areas
7. **Voice output** - Hands-free operation for fishermen at sea
8. **ML pipeline foundation** - Ready for model training infrastructure

The app demonstrates:
- Proper separation of concerns (UI/Context/API layers)
- TypeScript type safety throughout
- Animated user experience using Reanimated
- Accessibility for non-English speakers
- Production-ready configuration (EAS builds configured)

### Future Scope

#### Immediate (v1.1)
- [ ] Push notifications for risk level changes
- [ ] WhatsApp alert integration
- [ ] SMS alerts for critical warnings

#### Short-term (v1.2)
- [ ] Community reporting feature (sea condition reports)
- [ ] Multi-zone comparison view
- [ ] Fisherman SOS emergency button

#### Medium-term (v2.0)
- [ ] ML model training completion and deployment
- [ ] Custom route planning
- [ ] Fish catch logging
- [ ] Weather forecast for fishing zones (best times)

#### Long-term
- [ ] Regional expansion (West Bengal, Gujarat, Maharashtra)
- [ ] Government partnership (Fisheries Dept)
- [ ] Community leader dashboard
- [ ] IoT integration (buoy data)

### Contribution

This project serves as a template for:
- Multi-language mobile apps in Expo
- Marine weather data integration
- Boat-specific risk assessment
- Offline-first mobile applications
- GIS-based journey tracking
- ML infrastructure for mobile apps

---

*Document generated from codebase analysis*
*Project: Kadal Kavalan - Fishermen Safety App*
*Version: 1.0.0*
*Date: April 2026*
