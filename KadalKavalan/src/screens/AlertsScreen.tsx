import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Line, G, Text as SvgText, Path } from 'react-native-svg';
import { useUser } from '../context/UserContext';
import { useWeather } from '../context/WeatherContext';
import { useAppTheme } from '../theme';
import { BOAT_SPEEDS, getZoneStatus } from '../data/coastline';
import ScreenLayout from '../components/ScreenLayout';
import { NAV_BOTTOM_PADDING } from '../constants/layout';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(width * 0.55, 220);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const JOURNEY_STORAGE_KEY = '@kadal_journey_data';
const JOURNEY_SUMMARIES_STORAGE_KEY = '@kadal_journey_summaries';
const JOURNEY_LOG_INTERVAL_MS = 10 * 60 * 1000;
const MAX_JOURNEY_LOGS = 144;
const MAX_JOURNEY_SUMMARIES = 10;
const HEADING_SMOOTHING_ALPHA = 0.2;
const HEADING_FILTER_WINDOW = 5;
const HEADING_JITTER_DEADBAND_DEG = 3;
const HEADING_UI_UPDATE_INTERVAL_MS = 120;
const HEADING_FORCE_UPDATE_DEG = 10;
const KM_PER_KNOT = 1.852;

interface JourneySample {
  heading: number;
  windSpeed: number;
  windDirection: number;
  timestamp: number;
}

interface JourneyData {
  startTime: number;
  startLat: number;
  startLon: number;
  headingHistory: JourneySample[];
}

interface JourneySummary {
  id: string;
  endedAt: number;
  durationMinutes: number;
  logsCaptured: number;
  avgHeading: number;
  avgDirection: string;
  avgWindSpeed: number;
  distanceFromStartKm: number | null;
  returnHeading: number;
  returnDirection: string;
  estimatedReturnHours: number | null;
}

function normalizeHeading(heading: number): number {
  return ((Math.round(heading) % 360) + 360) % 360;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function calculateBearingDegrees(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
  return normalizeHeading((Math.atan2(y, x) * 180) / Math.PI);
}

function circularMeanHeading(samples: JourneySample[]): number {
  if (samples.length === 0) {
    return 0;
  }

  let sumX = 0;
  let sumY = 0;
  samples.forEach((sample) => {
    const radians = toRadians(sample.heading);
    sumX += Math.cos(radians);
    sumY += Math.sin(radians);
  });

  return normalizeHeading((Math.atan2(sumY, sumX) * 180) / Math.PI);
}

function circularMeanAngles(angles: number[]): number {
  if (angles.length === 0) {
    return 0;
  }

  let sumX = 0;
  let sumY = 0;
  angles.forEach((angle) => {
    const radians = toRadians(angle);
    sumX += Math.cos(radians);
    sumY += Math.sin(radians);
  });

  return normalizeHeading((Math.atan2(sumY, sumX) * 180) / Math.PI);
}

function shortestHeadingDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

function smoothCircularHeading(previousHeading: number, newHeading: number, alpha = HEADING_SMOOTHING_ALPHA): number {
  const delta = shortestHeadingDelta(previousHeading, newHeading);
  return ((previousHeading + delta * alpha) % 360 + 360) % 360;
}

function estimateReturnHours(distanceKm: number, boatClass: string, windSpeedKmh: number): number {
  const baseKnots = BOAT_SPEEDS[boatClass as keyof typeof BOAT_SPEEDS] ?? 8;
  const baseSpeedKmh = baseKnots * KM_PER_KNOT;
  const windPenalty = Math.min(0.4, Math.max(0, windSpeedKmh / 160));
  const effectiveSpeedKmh = Math.max(4, baseSpeedKmh * (1 - windPenalty));
  const hours = distanceKm / effectiveSpeedKmh;
  return Math.round(hours * 10) / 10;
}

const EntryCard: React.FC<{
  children: React.ReactNode;
  delay: number;
  onPress?: () => void;
  theme: ReturnType<typeof useAppTheme>;
  style?: object;
}> = ({ children, delay, onPress, theme, style }) => {
  const mount = useSharedValue(0);
  const pressScale = useSharedValue(1);

  React.useEffect(() => {
    mount.value = withDelay(delay, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [delay, mount]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: mount.value,
    transform: [{ translateY: 16 * (1 - mount.value) }, { scale: pressScale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowOpacity: theme.isDark ? 0.18 : 0.12 },
        style,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={() => { pressScale.value = withTiming(0.96, { duration: 140 }); }}
      onPressOut={() => { pressScale.value = withTiming(1, { duration: 180 }); }}
    >
      <LinearGradient colors={theme.colors.cardHighlight} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.highlight} />
      {children}
    </AnimatedPressable>
  );
};

const CompassDial: React.FC<{ heading: number; theme: any }> = ({ heading, theme }) => {
  const center = COMPASS_SIZE / 2;
  const rotation = -heading;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  
  return (
    <View style={styles.compassContainer}>
      <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>
        <G rotation={rotation} origin={`${center}, ${center}`}>
          <Circle cx={center} cy={center} r={center - 5} fill="none" stroke={theme.colors.border} strokeWidth={2} />
          <Circle cx={center} cy={center} r={center - 25} fill="none" stroke={theme.colors.border} strokeWidth={1} strokeDasharray="5,5" />

          {directions.map((dir, i) => {
            const angle = ((angles[i] - 90) * Math.PI) / 180;
            const radius = center - 15;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            const isNorth = dir === 'N';
            return (
              <G key={dir}>
                <Line
                  x1={center}
                  y1={center}
                  x2={center + (center - 35) * Math.cos(angle)}
                  y2={center + (center - 35) * Math.sin(angle)}
                  stroke={isNorth ? theme.colors.danger : theme.colors.textSecondary}
                  strokeWidth={isNorth ? 3 : 1}
                />
                <SvgText
                  x={x}
                  y={y + (isNorth ? 0 : 4)}
                  fontSize={isNorth ? 14 : 11}
                  fontWeight={isNorth ? '700' : '400'}
                  fill={isNorth ? theme.colors.danger : theme.colors.textSecondary}
                  textAnchor="middle"
                >
                  {dir}
                </SvgText>
              </G>
            );
          })}
        </G>

        {/* Needle remains fixed while dial rotates */}
        <Path
          d={`M ${center} ${center - 64} L ${center - 8} ${center + 12} L ${center} ${center + 2} L ${center + 8} ${center + 12} Z`}
          fill={theme.colors.danger}
        />
        <Circle cx={center} cy={center} r={10} fill={theme.colors.surface} stroke={theme.colors.danger} strokeWidth={2} />
      </Svg>
      
      {/* Center info */}
      <View style={styles.compassCenterInfo}>
        <Text style={[styles.compassDegrees, { color: theme.colors.textPrimary }]}>{heading}°</Text>
        <Text style={[styles.compassDirection, { color: theme.colors.textSecondary }]}>
          {directions[Math.round(heading / 45) % 8]}
        </Text>
      </View>
    </View>
  );
};

const AlertsScreen: React.FC = () => {
  const { boatClass } = useUser();
  const { zoneData, communityReports } = useWeather();
  const theme = useAppTheme();

  const [heading, setHeading] = useState(0);
  const [distanceFromCoast, setDistanceFromCoast] = useState<number | null>(null);
  const [compassReturnTime, setCompassReturnTime] = useState<number | null>(null);
  const [zoneStatus, setZoneStatus] = useState<'safe' | 'inland' | 'offshore'>('inland');
  const [statusMessage, setStatusMessage] = useState('...');

  const [journeyActive, setJourneyActive] = useState(false);
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [journeySummaries, setJourneySummaries] = useState<JourneySummary[]>([]);

  const headingRef = useRef(0);
  const displayedHeadingRef = useRef(0);
  const lastHeadingUiUpdateRef = useRef(0);
  const headingSmoothingRef = useRef<number | null>(null);
  const headingSamplesRef = useRef<number[]>([]);
  const journeyDataRef = useRef<JourneyData | null>(null);
  const journeyActiveRef = useRef(false);
  const journeySummariesRef = useRef<JourneySummary[]>([]);
  const windSpeedRef = useRef(0);
  const windDirectionRef = useRef(0);
  const boatClassRef = useRef(boatClass);

  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    boatClassRef.current = boatClass;
  }, [boatClass]);

  useEffect(() => {
    windSpeedRef.current =
      Math.round(zoneData?.current_conditions.wind_speed_kmh ?? zoneData?.risk_assessment.conditions.wind_speed ?? 0);
  }, [zoneData]);

  useEffect(() => {
    windDirectionRef.current = normalizeHeading(
      zoneData?.current_conditions.wind_direction_deg ?? 0
    );
  }, [zoneData]);

  useEffect(() => {
    journeyDataRef.current = journeyData;
  }, [journeyData]);

  useEffect(() => {
    journeyActiveRef.current = journeyActive;
  }, [journeyActive]);

  useEffect(() => {
    journeySummariesRef.current = journeySummaries;
  }, [journeySummaries]);

  useEffect(() => {
    loadJourneyFromStorage();
    loadJourneySummariesFromStorage();

    const setupCompassAndTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setStatusMessage('Location permission is required for compass tracking.');
          return;
        }

        headingSubscriptionRef.current = await Location.watchHeadingAsync((headingUpdate) => {
          const rawHeading = headingUpdate.trueHeading >= 0 ? headingUpdate.trueHeading : headingUpdate.magHeading;
          if (!Number.isFinite(rawHeading) || rawHeading < 0) {
            return;
          }

          const normalizedHeading = normalizeHeading(rawHeading);

          headingSamplesRef.current = [
            ...headingSamplesRef.current.slice(-(HEADING_FILTER_WINDOW - 1)),
            normalizedHeading,
          ];
          const filteredHeading = circularMeanAngles(headingSamplesRef.current);

          if (headingSmoothingRef.current === null) {
            headingSmoothingRef.current = filteredHeading;
          } else {
            const delta = shortestHeadingDelta(headingSmoothingRef.current, filteredHeading);
            if (Math.abs(delta) < HEADING_JITTER_DEADBAND_DEG) {
              return;
            }

            const adaptiveAlpha = Math.min(0.35, Math.max(0.08, Math.abs(delta) / 80));
            headingSmoothingRef.current = smoothCircularHeading(
              headingSmoothingRef.current,
              filteredHeading,
              adaptiveAlpha
            );
          }

          const smoothedHeading = normalizeHeading(headingSmoothingRef.current ?? filteredHeading);
          headingRef.current = smoothedHeading;

          const now = Date.now();
          const displayDelta = Math.abs(shortestHeadingDelta(displayedHeadingRef.current, smoothedHeading));
          if (
            displayDelta >= HEADING_FORCE_UPDATE_DEG ||
            now - lastHeadingUiUpdateRef.current >= HEADING_UI_UPDATE_INTERVAL_MS
          ) {
            displayedHeadingRef.current = smoothedHeading;
            lastHeadingUiUpdateRef.current = now;
            setHeading(smoothedHeading);
          }
        });

        startLocationTracking();
      } catch (error) {
        console.log('Compass setup error:', error);
        setStatusMessage('Compass unavailable on this device.');
      }
    };

    setupCompassAndTracking();
    
    return () => {
      if (headingSubscriptionRef.current) {
        headingSubscriptionRef.current.remove();
      }
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, []);

  const loadJourneyFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(JOURNEY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as JourneyData;
        const history = Array.isArray(parsed.headingHistory)
          ? parsed.headingHistory
              .map((entry) => ({
                heading: normalizeHeading(Number(entry.heading) || 0),
                windSpeed: Math.round(Number(entry.windSpeed) || 0),
                windDirection: normalizeHeading(Number(entry.windDirection) || 0),
                timestamp: Number(entry.timestamp) || Date.now(),
              }))
              .sort((a, b) => a.timestamp - b.timestamp)
          : [];

        const normalizedJourneyData: JourneyData = {
          ...parsed,
          headingHistory: history,
        };

        setJourneyData(normalizedJourneyData);
        journeyDataRef.current = normalizedJourneyData;

        // Check if journey is still active (less than 24 hours)
        if (Date.now() - normalizedJourneyData.startTime < 24 * 60 * 60 * 1000) {
          setJourneyActive(true);
          journeyActiveRef.current = true;
        }
      }
    } catch (e) {
      console.log('Error loading journey:', e);
    }
  };

  const saveJourneyToStorage = async (data: JourneyData) => {
    try {
      await AsyncStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.log('Error saving journey:', e);
    }
  };

  const loadJourneySummariesFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(JOURNEY_SUMMARIES_STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return;
      }

      const normalized: JourneySummary[] = parsed
        .map((item: Partial<JourneySummary>) => ({
          id: String(item.id ?? `${Date.now()}-${Math.random()}`),
          endedAt: Number(item.endedAt ?? Date.now()),
          durationMinutes: Number(item.durationMinutes ?? 0),
          logsCaptured: Number(item.logsCaptured ?? 0),
          avgHeading: normalizeHeading(Number(item.avgHeading ?? 0)),
          avgDirection: String(item.avgDirection ?? 'N'),
          avgWindSpeed: Number(item.avgWindSpeed ?? 0),
          distanceFromStartKm:
            item.distanceFromStartKm === null || item.distanceFromStartKm === undefined
              ? null
              : Number(item.distanceFromStartKm),
          returnHeading: normalizeHeading(Number(item.returnHeading ?? 0)),
          returnDirection: String(item.returnDirection ?? 'N'),
          estimatedReturnHours:
            item.estimatedReturnHours === null || item.estimatedReturnHours === undefined
              ? null
              : Number(item.estimatedReturnHours),
        }))
        .sort((a, b) => b.endedAt - a.endedAt)
        .slice(0, MAX_JOURNEY_SUMMARIES);

      setJourneySummaries(normalized);
      journeySummariesRef.current = normalized;
    } catch (e) {
      console.log('Error loading journey summaries:', e);
    }
  };

  const saveJourneySummariesToStorage = async (summaries: JourneySummary[]) => {
    try {
      await AsyncStorage.setItem(JOURNEY_SUMMARIES_STORAGE_KEY, JSON.stringify(summaries));
    } catch (e) {
      console.log('Error saving journey summaries:', e);
    }
  };

  const appendJourneySummary = async (summary: JourneySummary) => {
    const updatedSummaries = [summary, ...journeySummariesRef.current]
      .sort((a, b) => b.endedAt - a.endedAt)
      .slice(0, MAX_JOURNEY_SUMMARIES);

    setJourneySummaries(updatedSummaries);
    journeySummariesRef.current = updatedSummaries;
    await saveJourneySummariesToStorage(updatedSummaries);
  };

  const clearJourneyData = async () => {
    setJourneyActive(false);
    journeyActiveRef.current = false;
    setJourneyData(null);
    journeyDataRef.current = null;
    await AsyncStorage.removeItem(JOURNEY_STORAGE_KEY);
  };

  const appendJourneyLog = async (windSpeedKmh: number, windDirectionDeg: number) => {
    const activeJourney = journeyDataRef.current;
    if (!journeyActiveRef.current || !activeJourney) {
      return;
    }

    const now = Date.now();
    const lastEntry = activeJourney.headingHistory[activeJourney.headingHistory.length - 1];

    if (lastEntry && now - lastEntry.timestamp < JOURNEY_LOG_INTERVAL_MS) {
      return;
    }

    const nextEntry: JourneySample = {
      heading: normalizeHeading(headingRef.current),
      windSpeed: Math.round(windSpeedKmh),
      windDirection: normalizeHeading(windDirectionDeg),
      timestamp: now,
    };

    const updatedData: JourneyData = {
      ...activeJourney,
      headingHistory: [...activeJourney.headingHistory.slice(-(MAX_JOURNEY_LOGS - 1)), nextEntry],
    };

    setJourneyData(updatedData);
    journeyDataRef.current = updatedData;
    await saveJourneyToStorage(updatedData);
  };

  const startLocationTracking = async () => {
    const updateLocation = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude: lat, longitude: lon } = loc.coords;
        
        const zoneResult = getZoneStatus(lat, lon);
        setZoneStatus(zoneResult.status);
        setStatusMessage(zoneResult.message);
        setDistanceFromCoast(Math.round(zoneResult.distance));

        const latestWindSpeed = windSpeedRef.current;
        const latestWindDirection = windDirectionRef.current;
        await appendJourneyLog(latestWindSpeed, latestWindDirection);

        // Estimate return time from current sea state and boat class.
        const time = estimateReturnHours(zoneResult.distance, boatClassRef.current, latestWindSpeed);
        setCompassReturnTime(time);
      } catch (e) {
        console.log('Location error:', e);
      }
    };
    
    updateLocation();
    locationIntervalRef.current = setInterval(updateLocation, 10000);
  };

  const getCompassDirection = (angle: number): string => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(angle / 45) % 8];
  };

  const getDirectionArrow = (angle: number): string => {
    const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
    return arrows[Math.round(normalizeHeading(angle) / 45) % 8];
  };

  const getRiskColor = () => {
    if (zoneStatus === 'offshore') return '#D62828';
    if (zoneStatus === 'inland') return '#2D6A4F';
    if (distanceFromCoast && distanceFromCoast > 40) return '#F77F00';
    return '#2D6A4F';
  };

  const getStatusLabel = () => {
    if (zoneStatus === 'offshore') return 'Beyond Safe Zone';
    if (zoneStatus === 'inland') return 'On Land';
    return 'Within Safe Zone';
  };

  const handleStartJourney = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed');
        return;
      }
      
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const initialWindSpeed = windSpeedRef.current;
      const initialWindDirection = windDirectionRef.current;
      
      const newJourneyData: JourneyData = {
        startTime: Date.now(),
        startLat: loc.coords.latitude,
        startLon: loc.coords.longitude,
        headingHistory: [{
          heading: normalizeHeading(headingRef.current),
          windSpeed: Math.round(initialWindSpeed),
          windDirection: normalizeHeading(initialWindDirection),
          timestamp: Date.now(),
        }],
      };
      
      setJourneyData(newJourneyData);
      journeyDataRef.current = newJourneyData;
      setJourneyActive(true);
      journeyActiveRef.current = true;
      saveJourneyToStorage(newJourneyData);
      
      Alert.alert(
        'Journey Started 🛥️',
        'Heading, wind speed, wind direction, and time logging has started. New logs are saved every 10 minutes.\n\nWhen you tap "End Journey", the app shows the overall return direction.',
        [{ text: 'OK' }]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not start journey tracking');
    }
  };

  const handleEndJourney = async () => {
    const activeJourney = journeyDataRef.current;
    if (!activeJourney || activeJourney.headingHistory.length === 0) {
      Alert.alert('No Data', 'Start a journey first to track your direction');
      return;
    }
    
    const duration = Math.round((Date.now() - activeJourney.startTime) / 60000);
    const history = activeJourney.headingHistory;
    const avgHeading = circularMeanHeading(history);
    const avgWindSpeed = Math.round(
      history.reduce((sum, entry) => sum + (entry.windSpeed || 0), 0) / Math.max(history.length, 1)
    );

    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const distanceFromStart = haversineDistanceKm(
        loc.coords.latitude,
        loc.coords.longitude,
        activeJourney.startLat,
        activeJourney.startLon
      );
      const returnHeading = calculateBearingDegrees(
        loc.coords.latitude,
        loc.coords.longitude,
        activeJourney.startLat,
        activeJourney.startLon
      );
      const estimatedHours = estimateReturnHours(distanceFromStart, boatClassRef.current, avgWindSpeed);
      const avgDirection = getCompassDirection(avgHeading);
      const returnDirection = getCompassDirection(returnHeading);

      const summary: JourneySummary = {
        id: `${Date.now()}-${history.length}`,
        endedAt: Date.now(),
        durationMinutes: duration,
        logsCaptured: history.length,
        avgHeading,
        avgDirection,
        avgWindSpeed,
        distanceFromStartKm: Number(distanceFromStart.toFixed(1)),
        returnHeading,
        returnDirection,
        estimatedReturnHours: Number(estimatedHours.toFixed(1)),
      };

      await appendJourneySummary(summary);
      await clearJourneyData();

      setCompassReturnTime(estimatedHours);
      
      Alert.alert(
        'Journey Ended 🎯',
        `📊 Journey Summary:\n\n• Duration: ${duration} minutes\n• Logs captured: ${history.length} (every 10 minutes)\n• Avg travel heading: ${avgHeading}° (${avgDirection})\n• Avg wind: ${avgWindSpeed} km/h\n• Distance from start: ${distanceFromStart.toFixed(1)} km\n• Estimated return: ${estimatedHours.toFixed(1)} hrs\n\n🧭 Overall direction to go: ${returnHeading}° (${returnDirection})`,
        [{ text: 'OK' }]
      );
    } catch (e) {
      const fallbackReturnHeading = normalizeHeading(avgHeading + 180);
      const fallbackDirection = getCompassDirection(fallbackReturnHeading);

      const summary: JourneySummary = {
        id: `${Date.now()}-${history.length}`,
        endedAt: Date.now(),
        durationMinutes: duration,
        logsCaptured: history.length,
        avgHeading,
        avgDirection: getCompassDirection(avgHeading),
        avgWindSpeed,
        distanceFromStartKm: null,
        returnHeading: fallbackReturnHeading,
        returnDirection: fallbackDirection,
        estimatedReturnHours: null,
      };

      await appendJourneySummary(summary);
      await clearJourneyData();

      Alert.alert(
        'Journey Ended 🎯',
        `📊 Journey Summary:\n\n• Duration: ${duration} minutes\n• Logs captured: ${history.length} (every 10 minutes)\n• Avg travel heading: ${avgHeading}° (${getCompassDirection(avgHeading)})\n• Avg wind: ${avgWindSpeed} km/h\n\n🧭 Overall direction to go: ${fallbackReturnHeading}° (${fallbackDirection})`,
        [{ text: 'OK' }]
      );
    }
  };

  const officialAlerts = zoneData?.official_alerts ?? [];

  const alertItems = useMemo(() => {
    return officialAlerts.map((item, index) => {
      const severityColor = item.severity === 'WARNING' ? '#D62828' : item.severity === 'ADVISORY' ? '#F77F00' : '#2D6A4F';
      return {
        id: `${item.source}-${item.issued_at}-${index}`,
        title: item.title_en,
        description: `${item.source} • ${item.alert_type}`,
        timestamp: new Date(item.issued_at).toLocaleTimeString(),
        severityColor,
        severityText: item.severity,
      };
    });
  }, [officialAlerts]);

  const formatHourLabel = (hour: number): string => {
    const normalized = ((hour % 24) + 24) % 24;
    const suffix = normalized >= 12 ? 'PM' : 'AM';
    const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
    return `${hour12}:00 ${suffix}`;
  };

  const returnPrediction = zoneData?.return_time_prediction;
  const confidencePercent = returnPrediction ? Math.round(returnPrediction.confidence * 100) : null;

  return (
    <ScreenLayout style={{ backgroundColor: theme.colors.background }} withBottomPadding={false}>
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: NAV_BOTTOM_PADDING },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Toolkit</Text>

        {/* Compass Card */}
        <EntryCard theme={theme} delay={20}>
          <View style={styles.compassSection}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>COMPASS</Text>
            
            <CompassDial heading={heading} theme={theme} />
            
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: getRiskColor() + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getRiskColor() }]} />
                <Text style={[styles.statusText, { color: getRiskColor() }]}>{getStatusLabel()}</Text>
              </View>
              {journeyActive && (
                <View style={[styles.journeyBadge, { backgroundColor: theme.colors.safe + '20' }]}>
                  <Text style={[styles.journeyBadgeText, { color: theme.colors.safe }]}>🛥️ Active</Text>
                </View>
              )}
            </View>

            <Text style={[styles.statusMessage, { color: theme.colors.textSecondary }]}>{statusMessage}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Distance</Text>
                <Text style={[styles.statValue, { color: getRiskColor() }]}>
                  {distanceFromCoast !== null ? `${distanceFromCoast} km` : '...'}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Return Time</Text>
                <Text style={[styles.statValue, { color: getRiskColor() }]}>
                  {compassReturnTime !== null ? `${compassReturnTime} hrs` : '...'}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Boat</Text>
                <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>Class {boatClass}</Text>
              </View>
            </View>

            <View style={[styles.logPanel, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}> 
              <Text style={[styles.logTitle, { color: theme.colors.textPrimary }]}>Compass + Wind Logs (Every 10 mins)</Text>
              {journeyData && journeyData.headingHistory.length > 0 ? (
                journeyData.headingHistory
                  .slice(-6)
                  .reverse()
                  .map((entry, index) => (
                    <View key={`${entry.timestamp}-${index}`} style={styles.logRow}>
                      <Text style={[styles.logCell, styles.logTimeCell, { color: theme.colors.textSecondary }]}>
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text style={[styles.logCell, styles.logHeadingCell, { color: theme.colors.textPrimary }]}>
                        {entry.heading}° {getCompassDirection(entry.heading)}
                      </Text>
                      <Text style={[styles.logCell, styles.logWindCell, { color: theme.colors.textSecondary }]}>
                        {Math.round(entry.windSpeed)} km/h
                      </Text>
                      <Text style={[styles.logCell, styles.logDirectionCell, { color: theme.colors.textSecondary }]}>
                        {getDirectionArrow(entry.windDirection)} {entry.windDirection}° {getCompassDirection(entry.windDirection)}
                      </Text>
                    </View>
                  ))
              ) : (
                <Text style={[styles.logEmpty, { color: theme.colors.textSecondary }]}> 
                  Start a journey to record heading, wind speed, wind direction, and time every 10 minutes.
                </Text>
              )}
            </View>
            
            <View style={styles.journeyButtons}>
              {!journeyActive ? (
                <Pressable 
                  style={[styles.journeyBtn, { backgroundColor: theme.colors.safe }]}
                  onPress={handleStartJourney}
                >
                  <Feather name="navigation" size={18} color="#fff" />
                  <Text style={styles.journeyBtnText}>  Start Journey</Text>
                </Pressable>
              ) : (
                <Pressable 
                  style={[styles.journeyBtn, { backgroundColor: '#D62828' }]}
                  onPress={handleEndJourney}
                >
                  <Feather name="square" size={18} color="#fff" />
                  <Text style={styles.journeyBtnText}>  End & Return</Text>
                </Pressable>
              )}
            </View>
          </View>
        </EntryCard>

        {/* Return Estimate */}
        <EntryCard theme={theme} delay={60}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>RETURN ESTIMATE</Text>
          {returnPrediction ? (
            <>
              <Text style={[styles.returnHours, { color: theme.colors.textPrimary }]}>
                {returnPrediction.estimated_hours} hrs
              </Text>
              <Text style={[styles.returnMeta, { color: theme.colors.textSecondary }]}>
                Best departure: {formatHourLabel(returnPrediction.optimal_departure)}
              </Text>
              <Text style={[styles.returnMeta, { color: theme.colors.textSecondary }]}>Confidence: {confidencePercent}%</Text>
            </>
          ) : (
            <Text style={[styles.returnMeta, { color: theme.colors.textSecondary }]}> 
              Pull down to refresh for ML predictions
            </Text>
          )}
        </EntryCard>

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>JOURNEY HISTORY</Text>
        {journeySummaries.length === 0 ? (
          <EntryCard theme={theme} delay={80}>
            <View style={styles.emptyRow}>
              <Feather name="clock" size={18} color={theme.colors.iconMuted} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No completed journeys yet</Text>
            </View>
          </EntryCard>
        ) : (
          journeySummaries.slice(0, 3).map((summary, index) => (
            <EntryCard key={summary.id} theme={theme} delay={80 + index * 30}>
              <View style={styles.historyTopRow}>
                <Text style={[styles.historyTime, { color: theme.colors.textSecondary }]}> 
                  {new Date(summary.endedAt).toLocaleString()}
                </Text>
                <Text style={[styles.historyLogs, { color: theme.colors.textSecondary }]}> 
                  {summary.logsCaptured} logs
                </Text>
              </View>
              <Text style={[styles.historyHeading, { color: theme.colors.textPrimary }]}> 
                Go {summary.returnHeading}° ({summary.returnDirection}) to return
              </Text>
              <Text style={[styles.historyMeta, { color: theme.colors.textSecondary }]}> 
                Duration {summary.durationMinutes} mins • Avg heading {summary.avgHeading}° ({summary.avgDirection}) • Avg wind {summary.avgWindSpeed} km/h
              </Text>
              {summary.distanceFromStartKm !== null && summary.estimatedReturnHours !== null ? (
                <Text style={[styles.historyMeta, { color: theme.colors.textSecondary }]}> 
                  Distance {summary.distanceFromStartKm.toFixed(1)} km • Estimated return {summary.estimatedReturnHours.toFixed(1)} hrs
                </Text>
              ) : (
                <Text style={[styles.historyMeta, { color: theme.colors.textSecondary }]}> 
                  Distance unavailable for this journey
                </Text>
              )}
            </EntryCard>
          ))
        )}

        {/* Official Alerts */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>OFFICIAL ALERTS</Text>
        {alertItems.length === 0 ? (
          <EntryCard theme={theme} delay={100}>
            <View style={styles.emptyRow}>
              <Feather name="shield" size={18} color={theme.colors.iconMuted} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No alerts</Text>
            </View>
          </EntryCard>
        ) : (
          alertItems.map((item, index) => (
            <EntryCard key={item.id} delay={100 + index * 40} style={styles.alertCard}>
              <View style={[styles.severityRail, { backgroundColor: item.severityColor }]} />
              <View style={styles.alertContent}>
                <View style={styles.alertTopRow}>
                  <View style={styles.alertTitleWrap}>
                    <Feather name="alert-circle" size={16} color={item.severityColor} />
                    <Text style={[styles.alertTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                  </View>
                  <Text style={[styles.alertTime, { color: theme.colors.textSecondary }]}>{item.timestamp}</Text>
                </View>
                <Text style={[styles.alertDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
                <Text style={[styles.alertSeverity, { color: item.severityColor }]}>{item.severityText}</Text>
              </View>
            </EntryCard>
          ))
        )}

        {/* Community Reports */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>COMMUNITY REPORTS</Text>
        {communityReports.length === 0 ? (
          <EntryCard theme={theme} delay={200}>
            <View style={styles.emptyRow}>
              <Feather name="users" size={18} color={theme.colors.iconMuted} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No reports yet</Text>
            </View>
          </EntryCard>
        ) : (
          communityReports.map((report, index) => (
            <EntryCard key={`${report.id}-${index}`} delay={200 + index * 40}>
              <View style={styles.alertTopRow}>
                <Text style={[styles.reportZone, { color: theme.colors.textPrimary }]}>{report.zone_id}</Text>
                <Text style={[styles.alertTime, { color: theme.colors.textSecondary }]}>Just now</Text>
              </View>
              <Text style={[styles.alertDescription, { color: theme.colors.textSecondary }]}> 
                Wave: {report.wave_condition} • Wind: {report.wind_strength} • Visibility: {report.visibility}
              </Text>
            </EntryCard>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 54, paddingBottom: NAV_BOTTOM_PADDING },
  headerTitle: { fontSize: 28, fontWeight: '800', marginHorizontal: 16, marginBottom: 18 },
  sectionTitle: { marginHorizontal: 16, marginTop: 22, marginBottom: 10, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  card: { marginHorizontal: 16, marginBottom: 10, borderRadius: 24, padding: 18, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6, overflow: 'hidden' },
  highlight: { ...StyleSheet.absoluteFillObject, height: 78 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 16 },
  compassSection: { alignItems: 'center' },
  compassContainer: { alignItems: 'center', marginBottom: 16 },
  compassCenterInfo: { position: 'absolute', top: COMPASS_SIZE/2 - 15, alignItems: 'center' },
  compassDegrees: { fontSize: 24, fontWeight: '800' },
  compassDirection: { fontSize: 12, fontWeight: '600' },
  statusRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 14, fontWeight: '600' },
  statusMessage: { marginTop: -6, marginBottom: 12, fontSize: 12, fontWeight: '500' },
  journeyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  journeyBadgeText: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: '#e5e2e1' },
  statLabel: { fontSize: 11, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700' },
  logPanel: { width: '100%', borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 14 },
  logTitle: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  logCell: { flex: 1, fontSize: 12, fontWeight: '500' },
  logTimeCell: { flex: 0.95 },
  logHeadingCell: { flex: 1 },
  logWindCell: { flex: 0.95, textAlign: 'right' },
  logDirectionCell: { flex: 1.15, textAlign: 'right' },
  logEmpty: { fontSize: 12, lineHeight: 18 },
  journeyButtons: { width: '100%' },
  journeyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14 },
  journeyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  returnHours: { fontSize: 30, fontWeight: '800', marginBottom: 4 },
  returnMeta: { fontSize: 14, lineHeight: 20 },
  historyTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  historyTime: { fontSize: 12, fontWeight: '500' },
  historyLogs: { fontSize: 12, fontWeight: '600' },
  historyHeading: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  historyMeta: { fontSize: 12, lineHeight: 18 },
  alertCard: { flexDirection: 'row', paddingLeft: 0 },
  severityRail: { width: 4, borderTopLeftRadius: 24, borderBottomLeftRadius: 24 },
  alertContent: { flex: 1, paddingLeft: 14, paddingRight: 4 },
  alertTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alertTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
  alertTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  alertTime: { fontSize: 12 },
  alertDescription: { marginTop: 7, fontSize: 13, lineHeight: 18 },
  alertSeverity: { marginTop: 8, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  reportZone: { fontSize: 14, fontWeight: '700' },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 14 },
});

export default AlertsScreen;