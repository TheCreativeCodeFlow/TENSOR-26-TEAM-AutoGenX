import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useUser } from '../context/UserContext';
import { useWeather } from '../context/WeatherContext';
import { getRiskColor, RiskLevel } from '../utils/riskEngine';
import { useAppTheme } from '../theme';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type MetricIcon = React.ComponentProps<typeof Feather>['name'];

type ThemeRef = ReturnType<typeof useAppTheme>;

function useCountUp(target: number, duration = 1200, decimals = 0): string {
  const [display, setDisplay] = React.useState(target);
  const animated = useSharedValue(target);

  useEffect(() => {
    animated.value = 0;
    animated.value = withTiming(target, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [animated, duration, target]);

  useAnimatedReaction(
    () => animated.value,
    (value) => {
      runOnJS(setDisplay)(value);
    },
    [animated]
  );

  return display.toFixed(decimals);
}

const PremiumCard: React.FC<{
  children: React.ReactNode;
  theme: ThemeRef;
  style?: object;
  delay?: number;
}> = ({ children, style, delay = 0, theme }) => {
  const mount = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    mount.value = withDelay(
      delay,
      withTiming(1, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [delay, mount]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: mount.value,
    transform: [{ translateY: 16 * (1 - mount.value) }, { scale: pressScale.value }],
  }));

  const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.card,
    shadowColor: '#000',
    shadowOpacity: theme.isDark ? 0.18 : 0.12,
  };

  return (
    <AnimatedPressable
      style={[styles.cardBase, cardStyle, style, animatedStyle]}
      onPressIn={() => {
        pressScale.value = withTiming(0.98, { duration: 140, easing: Easing.out(Easing.quad) });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: 190, easing: Easing.out(Easing.quad) });
      }}
    >
      <LinearGradient
        colors={theme.colors.cardHighlight}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.cardHighlight}
      />
      {children}
    </AnimatedPressable>
  );
};

const TimelineCapsule: React.FC<{
  risk: number;
  delay: number;
  label: string;
  active: boolean;
  theme: ThemeRef;
}> = ({ risk, delay, label, active, theme }) => {
  const fillHeight = Math.max(8, Math.round((risk / 100) * 118));
  const fill = useSharedValue(0);
  const pulse = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    fill.value = withDelay(delay, withTiming(fillHeight, { duration: 850, easing: Easing.out(Easing.cubic) }));
  }, [delay, fill, fillHeight]);

  useEffect(() => {
    if (!active) {
      pulse.value = withTiming(0, { duration: 220 });
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [active, pulse]);

  const fillStyle = useAnimatedStyle(() => ({
    height: fill.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: active ? 0.22 + pulse.value * 0.32 : 0,
    transform: [{ scale: 0.8 + pulse.value * 0.3 }],
  }));

  const barColor = risk >= 55 ? theme.colors.danger : risk >= 30 ? theme.colors.warning : theme.colors.safe;

  return (
    <View style={styles.timelinePoint}>
      <View style={[styles.timelineBarBackground, { backgroundColor: theme.colors.surfaceSecondary }]}> 
        <AnimatedView style={[styles.timelineGlow, { backgroundColor: barColor }, pulseStyle]} />
        <AnimatedView style={[styles.timelineBar, { backgroundColor: barColor }, fillStyle]} />
      </View>
      {label ? <Text style={[styles.timelineLabel, { color: theme.colors.textSecondary }]}>{label}</Text> : null}
    </View>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: number;
  unit: string;
  icon: MetricIcon;
  decimals?: number;
  delay?: number;
  theme: ThemeRef;
}> = ({ label, value, unit, icon, decimals = 1, delay = 0, theme }) => {
  const display = useCountUp(Number.isFinite(value) ? value : 0, 1000, decimals);

  return (
    <PremiumCard theme={theme} style={styles.metricCard} delay={delay}>
      <View style={[styles.metricIconWrap, { backgroundColor: theme.colors.surfaceSecondary }]}> 
        <Feather name={icon} size={18} color={theme.colors.iconMuted} />
      </View>
      <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
        {display}
        {unit}
      </Text>
    </PremiumCard>
  );
};

const MainDashboard: React.FC = () => {
  const { t, zone, language, boatClass } = useUser();
  const { zoneData, isOffline, fetchWeatherData, lastFetched } = useWeather();
  const [refreshing, setRefreshing] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const theme = useAppTheme();

  // Premium Voice Button Animations
  const voicePulseAnim = useSharedValue(0);
  const voiceScaleAnim = useSharedValue(1);

  useEffect(() => {
    if (speaking) {
      voicePulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 1200, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      voicePulseAnim.value = withTiming(0, { duration: 300 });
    }
  }, [speaking, voicePulseAnim]);

  const voicePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + voicePulseAnim.value * 0.5 }],
    opacity: (1 - voicePulseAnim.value) * 0.6,
  }));

  const voiceBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: voiceScaleAnim.value }],
  }));

  useEffect(() => {
    if (zone && boatClass) {
      fetchWeatherData(zone, boatClass);
    }
  }, []);

  // ─── Live clock — ticks every second ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWeatherData(zone!, boatClass);
    setRefreshing(false);
  };

  const riskData = zoneData?.risk_assessment;
  const conditions = zoneData?.current_conditions;
  const tide = zoneData?.tidal_data;

  const getRiskText = (): string => {
    const level = riskData?.risk_level;
    if (!level) return t?.risk_safe || 'Safe';
    switch (level) {
      case 'SAFE':
        return t?.risk_safe || 'Safe';
      case 'ADVISORY':
        return t?.risk_advisory || 'Caution';
      case 'DANGER':
        return t?.risk_danger || 'Danger';
      case 'CYCLONE':
        return t?.risk_cyclone || 'Cyclone';
      default:
        return t?.risk_safe || 'Safe';
    }
  };

  const getRiskLevel = (): RiskLevel => {
    return riskData?.risk_level || 'SAFE';
  };

  const handleSpeak = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }

    const level = getRiskText();
    const score = riskData?.risk_score || 0;
    const wave = conditions?.wave_height_m?.toFixed(1) || '-';
    const wind = conditions?.wind_speed_kmh?.toFixed(0) || '-';
    const window = riskData?.safe_departure_window || t?.no_safe_window || 'No safe window';

    const text = `${zone?.name_en || 'Your area'}. ${t?.risk_safe || 'Risk level'}: ${level}. Score: ${score}. ${
      t?.wave_height?.replace('{value}', wave) || 'Wave ' + wave + 'm'
    }. ${t?.wind_speed?.replace('{value}', wind) || 'Wind ' + wind + 'km/h'}. ${
      t?.safe_window
        ?.replace('{start}', window.split(' - ')[0] || '')
        .replace('{end}', window.split(' - ')[1] || '') || window
    }`;

    setSpeaking(true);
    Speech.speak(text, {
      language:
        language === 'ta'
          ? 'ta-IN'
          : language === 'ml'
            ? 'ml-IN'
            : language === 'te'
              ? 'te-IN'
              : language === 'or'
                ? 'or-IN'
                : 'en-IN',
      rate: 0.85,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const score = riskData?.risk_score || 0;
  const scoreValue = useCountUp(score, 1400, 0);
  const riskColor = getRiskColor(getRiskLevel());

  const screenEntry = useSharedValue(0);
  const heroPulse = useSharedValue(0);
  const timelinePulse = useSharedValue(0);
  const ringProgress = useSharedValue(0);
  const unsafeShake = useSharedValue(0);

  useEffect(() => {
    screenEntry.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
    heroPulse.value = withRepeat(withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.quad) }), -1, true);
    timelinePulse.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [heroPulse, screenEntry, timelinePulse]);

  useEffect(() => {
    ringProgress.value = withTiming(score / 100, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [ringProgress, score]);

  const noSafeWindow = !riskData?.safe_departure_window;

  useEffect(() => {
    if (!noSafeWindow) {
      unsafeShake.value = withTiming(0, { duration: 200 });
      return;
    }

    unsafeShake.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(-1, { duration: 120, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) })
        ),
        2,
        false
      )
    );
  }, [noSafeWindow, unsafeShake]);

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenEntry.value,
    transform: [{ translateY: 20 * (1 - screenEntry.value) }],
  }));

  const heroOverlayStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + heroPulse.value * 0.18,
  }));

  const timelineIndicatorStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + timelinePulse.value * 0.45,
    transform: [{ scale: 0.82 + timelinePulse.value * 0.25 }],
  }));

  const unsafeShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: unsafeShake.value * 3 }],
  }));

  const ringSize = 128;
  const ringStroke = 10;
  const radius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const ringAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - ringProgress.value),
  }));

  const formatTimelineHour = (hour: number): string => {
    const normalized = ((hour % 24) + 24) % 24;
    const suffix = normalized >= 12 ? 'PM' : 'AM';
    const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
    return `${hour12}${suffix}`;
  };

  const timelineData = useMemo(() => {
    const source = zoneData?.forecast_48h?.slice(0, 24) ?? [];

    if (source.length === 24) {
      return source
        .map((item, index) => {
          const parsed = new Date(item.hour);
          const hour = Number.isNaN(parsed.getTime()) ? index : parsed.getHours();

          return {
            key: `${hour}-${index}`,
            hour,
            risk: Math.max(0, Math.min(100, Math.round(item.risk_score_computed))),
          };
        })
        .sort((a, b) => a.hour - b.hour);
    }

    return Array.from({ length: 24 }, (_, hour) => ({
      key: `fallback-${hour}`,
      hour,
      risk: Math.max(0, Math.min(100, score)),
    }));
  }, [zoneData?.forecast_48h, score]);

  const heroGradient = theme.isDark
    ? ['#0B1222', '#0F172A']
    : ['#E2E8F0', '#F8FAFC'];

  // ─── Sky icon: time + weather aware ────────────────────────────────────────────
  const getSkyIcon = (): { icon: string; label: string } => {
    const h    = now.getHours();
    const wind = conditions?.wind_speed_kmh ?? 0;
    const vis  = conditions?.visibility_km  ?? 10;
    const lvl  = riskData?.risk_level ?? 'SAFE';
    const isSevere = lvl === 'CYCLONE' || lvl === 'DANGER';
    const isStormy = wind > 40 || vis < 3;
    const isWindy  = wind > 20 || vis < 6;
    const isCloudy = wind > 10 || vis < 8;
    if (isSevere || isStormy)               return { icon: '🌩️', label: 'Storm Alert' };
    if (isWindy && (h >= 20 || h < 5))      return { icon: '🌧️', label: 'Rainy Night' };
    if (isWindy)                             return { icon: '🌦️', label: 'Rainy' };
    if (isCloudy && h >= 5  && h < 7)       return { icon: '🌤️', label: 'Dawn Haze' };
    if (isCloudy && h >= 7  && h < 18)      return { icon: '⛅',    label: 'Partly Cloudy' };
    if (isCloudy && h >= 18 && h < 20)      return { icon: '🌥️', label: 'Cloudy Dusk' };
    if (isCloudy)                            return { icon: '☁️',   label: 'Cloudy Night' };
    if (h >= 5  && h < 7)                   return { icon: '🌅',   label: 'Sunrise' };
    if (h >= 18 && h < 20)                  return { icon: '🌇',   label: 'Sunset' };
    if (h >= 7  && h < 18)                  return { icon: '☀️',   label: 'Clear Day' };
    return                                          { icon: '🌙',   label: 'Clear Night' };
  };
  const pad     = (n: number) => String(n).padStart(2, '0');
  const hh      = now.getHours();
  const ampm    = hh >= 12 ? 'PM' : 'AM';
  const h12     = hh % 12 === 0 ? 12 : hh % 12;
  const timeStr = `${pad(h12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const sky     = getSkyIcon();

  return (
    <AnimatedView style={[styles.container, { backgroundColor: theme.colors.background }, screenAnimatedStyle]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.safe]}
            tintColor={theme.colors.safe}
          />
        }
      >
        <LinearGradient colors={heroGradient} style={styles.heroBackgroundWrap}>
          <PremiumCard theme={theme} style={styles.heroCard}>
            <AnimatedView style={[styles.heroAura, heroOverlayStyle]}>
              <LinearGradient
                colors={[
                  theme.isDark ? 'rgba(22,163,74,0.3)' : 'rgba(21,128,61,0.17)',
                  'rgba(22,163,74,0)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </AnimatedView>

            <View style={styles.heroTopRow}>
              <View>
                <Text style={[styles.heroLabel, { color: theme.colors.textSecondary }]}>Location</Text>
                <Text style={[styles.heroLocation, { color: theme.colors.textPrimary }]}>
                  {zone?.name_en || 'Your Zone'}
                </Text>
              </View>
            </View>

            <Text style={[styles.heroStatusTitle, { color: theme.colors.textPrimary }]}>
              {riskData?.risk_level === 'SAFE' ? 'SAFE TO GO OUT' : getRiskText().toUpperCase()}
            </Text>
            <Text style={[styles.heroStatusSubtitle, { color: theme.colors.textSecondary }]}> 
              {riskData?.risk_level === 'SAFE' ? 'Conditions stable' : riskData?.reason_text || 'Conditions changing'}
            </Text>

            {/* ─── Live Clock Widget ────────────────────────────────────────────────── */}
            <View style={[
              styles.clockWidget,
              { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)',
                borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }
            ]}>
              {/* Sky icon */}
              <View style={styles.clockSkyCol}>
                <Text style={styles.clockSkyIcon}>{sky.icon}</Text>
                <Text style={[styles.clockSkyLabel, { color: theme.colors.textSecondary }]}>{sky.label}</Text>
              </View>
              <View style={[styles.clockDivider, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />
              {/* Time */}
              <View style={styles.clockTimeCol}>
                <View style={styles.clockTimeRow}>
                  <Text style={[styles.clockTimeText, { color: theme.colors.textPrimary }]}>{timeStr}</Text>
                  <Text style={[styles.clockAmPm, { color: theme.colors.textSecondary }]}>{ampm}</Text>
                </View>
                <Text style={[styles.clockDate, { color: theme.colors.textSecondary }]}>{dateStr}</Text>
              </View>
            </View>

            {lastFetched ? (
              <Text style={[styles.heroUpdated, { color: theme.colors.textSecondary }]}> 
                Updated {new Date(lastFetched).toLocaleTimeString()}
              </Text>
            ) : null}
          </PremiumCard>
        </LinearGradient>

        <PremiumCard theme={theme} style={styles.timelineCard} delay={80}>
          <View style={styles.timelineHeaderRow}>
            <Text style={[styles.timelineTitle, { color: theme.colors.textPrimary }]}>Hourly Risk Timeline</Text>
            <View style={styles.timelineIndicatorWrap}>
              <AnimatedView style={[styles.timelineIndicatorDot, { backgroundColor: theme.colors.safe }, timelineIndicatorStyle]} />
              <Text style={[styles.timelineRange, { color: theme.colors.textSecondary }]}>Live</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineTrack}>
            {timelineData.map((point, index) => (
              <TimelineCapsule
                key={point.key}
                risk={point.risk}
                delay={index * 55}
                active={point.hour === new Date().getHours()}
                label={point.hour % 3 === 0 ? formatTimelineHour(point.hour) : ''}
                theme={theme}
              />
            ))}
          </ScrollView>
        </PremiumCard>

        <PremiumCard theme={theme} style={styles.overallScoreCard} delay={150}>
          <Text style={[styles.overallScoreTitle, { color: theme.colors.textSecondary }]}>Overall Risk Score</Text>
          <View style={styles.scoreRingWrap}>
            <Svg width={ringSize} height={ringSize}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={theme.isDark ? 'rgba(148,163,184,0.32)' : 'rgba(100,116,139,0.24)'}
                strokeWidth={ringStroke}
                fill="transparent"
              />
              <AnimatedCircle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={riskColor}
                strokeWidth={ringStroke}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animatedProps={ringAnimatedProps}
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              />
            </Svg>
            <View style={styles.scoreValueWrap}>
              <Text style={[styles.overallScoreValue, { color: riskColor }]}>{scoreValue}</Text>
              <Text style={[styles.scoreScale, { color: theme.colors.textSecondary }]}>/100</Text>
            </View>
          </View>
          <Text style={[styles.overallScoreLevel, { color: theme.colors.textPrimary }]}>{getRiskText()}</Text>
        </PremiumCard>

        <PremiumCard theme={theme} style={styles.windowCard} delay={220}>
          <Text style={[styles.windowTitle, { color: theme.colors.textSecondary }]}> 
            {t?.safe_window?.split(':')[0] || 'Safe Window'}
          </Text>
          <AnimatedView
            style={[
              styles.windowPill,
              {
                backgroundColor: noSafeWindow
                  ? `${theme.colors.danger}22`
                  : `${theme.colors.safe}22`,
                borderColor: noSafeWindow ? `${theme.colors.danger}80` : `${theme.colors.safe}80`,
              },
              unsafeShakeStyle,
            ]}
          >
            <Feather name={noSafeWindow ? 'alert-triangle' : 'clock'} size={14} color={theme.colors.textPrimary} />
            <Text style={[styles.windowText, { color: theme.colors.textPrimary }]}> 
              {riskData?.safe_departure_window || t?.no_safe_window || 'No safe window today'}
            </Text>
          </AnimatedView>
          <Text style={[styles.tomorrowText, { color: theme.colors.textSecondary }]}> 
            {riskData?.tomorrow_window
              ? t?.tomorrow_window
                  ?.replace('{start}', riskData.tomorrow_window.split(' - ')[0] || '')
                  .replace('{end}', riskData.tomorrow_window.split(' - ')[1] || '') ||
                `Tomorrow: ${riskData.tomorrow_window}`
              : 'Recheck in a few hours for safer departure updates.'}
          </Text>
        </PremiumCard>

        <View style={styles.weatherGrid}>
          <MetricCard
            theme={theme}
            icon="droplet"
            label={t?.wave_height?.split(':')[0] || 'Wave'}
            value={conditions?.wave_height_m ?? 0}
            unit="m"
            decimals={1}
            delay={280}
          />
          <MetricCard
            theme={theme}
            icon="wind"
            label={t?.wind_speed?.split(':')[0] || 'Wind'}
            value={conditions?.wind_speed_kmh ?? 0}
            unit=" km/h"
            decimals={0}
            delay={340}
          />
          <MetricCard
            theme={theme}
            icon="eye"
            label={t?.visibility?.split(':')[0] || 'Visibility'}
            value={conditions?.visibility_km ?? 0}
            unit=" km"
            decimals={1}
            delay={400}
          />
          <MetricCard
            theme={theme}
            icon="activity"
            label={t?.swell_height?.split(':')[0] || 'Swell'}
            value={conditions?.swell_height_m ?? 0}
            unit="m"
            decimals={1}
            delay={460}
          />
        </View>

        <PremiumCard theme={theme} style={styles.tideCard} delay={520}>
          <Text style={[styles.tideTitle, { color: theme.colors.textPrimary }]}>{t?.tide || 'Tide'}</Text>
          <View style={styles.tideRow}>
            <View style={styles.tideItem}>
              <Text style={[styles.tideLabel, { color: theme.colors.textSecondary }]}>High</Text>
              <Text style={[styles.tideValue, { color: theme.colors.textPrimary }]}>{tide?.high_tide_time || '--:--'}</Text>
              <Text style={[styles.tideHeight, { color: theme.colors.textSecondary }]}>
                {tide?.high_tide_height_m?.toFixed(2) || '-'}m
              </Text>
            </View>
            <View style={[styles.tideDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.tideItem}>
              <Text style={[styles.tideLabel, { color: theme.colors.textSecondary }]}>Low</Text>
              <Text style={[styles.tideValue, { color: theme.colors.textPrimary }]}>{tide?.low_tide_time || '--:--'}</Text>
              <Text style={[styles.tideHeight, { color: theme.colors.textSecondary }]}>
                {tide?.low_tide_height_m?.toFixed(2) || '-'}m
              </Text>
            </View>
          </View>
        </PremiumCard>

        {isOffline && (
          <PremiumCard theme={theme} style={styles.offlineCard} delay={580}>
            <Feather name="cloud-off" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.offlineText, { color: theme.colors.textSecondary }]}> 
              {t?.offline_mode || 'Offline mode'} - {t?.using_cached || 'Using cached data'}
            </Text>
          </PremiumCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Premium Floating Voice Button */}
      <View style={styles.floatingVoiceWrap}>
        {speaking && (
          <AnimatedView style={[StyleSheet.absoluteFill, styles.voicePulseRing, voicePulseStyle]} />
        )}
        <AnimatedPressable
          style={[styles.floatingVoiceBtnInner, voiceBtnStyle]}
          onPress={handleSpeak}
          onPressIn={() => voiceScaleAnim.value = withTiming(0.92, { duration: 100 })}
          onPressOut={() => voiceScaleAnim.value = withTiming(1, { duration: 150 })}
        >
          <LinearGradient
            colors={theme.isDark ? ['rgba(22,163,74,0.3)', 'rgba(22,163,74,0.15)'] : ['#f0fdf4', '#dcfce7']}
            style={[StyleSheet.absoluteFill, { borderRadius: 30 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Feather name={speaking ? 'volume-2' : 'volume-1'} size={24} color={theme.isDark ? '#4ade80' : '#15803d'} style={styles.voiceIconShadow} />
        </AnimatedPressable>
      </View>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  heroBackgroundWrap: {
    paddingTop: Platform.OS === 'ios' ? 58 : 38,
    paddingBottom: 6,
  },
  cardBase: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  cardHighlight: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    height: 90,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    marginTop: 0,
    minHeight: 210,
  },
  heroAura: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 4,
    fontWeight: '600',
  },
  heroLocation: {
    fontSize: 18,
    fontWeight: '700',
  },
  heroStatusTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 40,
  },
  heroStatusSubtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
  },
  heroUpdated: {
    marginTop: 14,
    fontSize: 12,
  },
  voiceButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  timelineCard: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  timelineIndicatorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelineIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineRange: {
    fontSize: 12,
  },
  timelineTrack: {
    gap: 10,
    paddingBottom: 6,
  },
  timelinePoint: {
    width: 20,
    alignItems: 'center',
  },
  timelineBarBackground: {
    width: 14,
    height: 132,
    borderRadius: 14,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  timelineGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  timelineBar: {
    width: '100%',
    borderRadius: 14,
  },
  timelineLabel: {
    marginTop: 8,
    fontSize: 10,
  },
  overallScoreCard: {
    alignItems: 'center',
    paddingVertical: 22,
  },
  overallScoreTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  scoreRingWrap: {
    marginTop: 14,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValueWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  overallScoreValue: {
    fontSize: 40,
    fontWeight: '800',
  },
  scoreScale: {
    marginTop: -3,
  },
  overallScoreLevel: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: '600',
  },
  windowCard: {
    alignItems: 'flex-start',
    gap: 12,
  },
  windowTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  windowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  windowText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tomorrowText: {
    fontSize: 13,
    lineHeight: 19,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginTop: 8,
    gap: 10,
  },
  metricCard: {
    width: (width - 52) / 2,
    marginHorizontal: 6,
    padding: 16,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  tideCard: {
    marginTop: 8,
  },
  tideTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  tideRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tideItem: {
    flex: 1,
    alignItems: 'center',
  },
  tideDivider: {
    width: 1,
    height: 62,
  },
  tideLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tideValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  tideHeight: {
    fontSize: 13,
    marginTop: 3,
  },
  offlineCard: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  offlineText: {
    fontSize: 13,
  },
  bottomSpacer: {
    height: 34,
  },
  // \u2500\u2500\u2500 Clock Widget \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  clockWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 14,
    borderWidth: 1,
  },
  clockSkyCol: {
    alignItems: 'center',
    minWidth: 64,
  },
  clockSkyIcon: {
    fontSize: 36,
    marginBottom: 2,
  },
  clockSkyLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  clockDivider: {
    width: 1,
    height: 48,
    marginHorizontal: 14,
  },
  clockTimeCol: {
    flex: 1,
  },
  clockTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  clockTimeText: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  clockAmPm: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  clockDate: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  floatingVoiceWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100,
    right: 20,
    width: 60,
    height: 60,
    zIndex: 99,
  },
  voicePulseRing: {
    backgroundColor: '#22c55e',
    borderRadius: 30,
  },
  floatingVoiceBtnInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7', // Ensures solid elevation casting on Android
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  voiceIconShadow: {
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default MainDashboard;
