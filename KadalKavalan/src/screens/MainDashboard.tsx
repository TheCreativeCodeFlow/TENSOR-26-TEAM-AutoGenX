import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useUser } from '../context/UserContext';
import { useWeather } from '../context/WeatherContext';
import { getRiskColor, getRiskBgColor, RiskLevel } from '../utils/riskEngine';

const { width } = Dimensions.get('window');

const MainDashboard: React.FC = () => {
  const { t, zone, language, boatClass } = useUser();
  const { zoneData, isLoading, isOffline, fetchWeatherData, lastFetched } = useWeather();
  const [refreshing, setRefreshing] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);

  useEffect(() => {
    if (zone && boatClass) {
      fetchWeatherData(zone, boatClass);
    }
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

    const text = `${zone?.name_en || 'Your area'}. ${t?.risk_safe || 'Risk level'}: ${level}. Score: ${score}. ${t?.wave_height?.replace('{value}', wave) || 'Wave' + wave + 'm'}. ${t?.wind_speed?.replace('{value}', wind) || 'Wind' + wind + 'km/h'}. ${t?.safe_window?.replace('{start}', window.split(' - ')[0] || '').replace('{end}', window.split(' - ')[1] || '') || window}`;

    setSpeaking(true);
    Speech.speak(text, {
      language: language === 'ta' ? 'ta-IN' : language === 'ml' ? 'ml-IN' : language === 'te' ? 'te-IN' : language === 'or' ? 'or-IN' : 'en-IN',
      rate: 0.85,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const score = riskData?.risk_score || 0;
  const riskColor = getRiskColor(getRiskLevel());
  const bgColor = getRiskBgColor(getRiskLevel());

  const formatTimelineHour = (hour: number): string => {
    const normalized = ((hour % 24) + 24) % 24;
    const suffix = normalized >= 12 ? 'PM' : 'AM';
    const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
    return `${hour12}${suffix}`;
  };

  const getRiskColorFromScore = (value: number): string => {
    if (value >= 55) return '#b42318';
    if (value >= 30) return '#b54708';
    return '#027a48';
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B4F6C']} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: riskColor }]}>
          <View style={styles.headerContent}>
            <Text style={styles.zoneName}>{zone?.name_en}</Text>
            
            <TouchableOpacity style={styles.voiceButton} onPress={handleSpeak}>
              <Text style={styles.voiceIcon}>{speaking ? '🔊' : '🔈'}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Risk Banner */}
          <View style={[styles.riskBanner, { backgroundColor: bgColor }]}>
            <Text style={[styles.riskText, { color: riskColor }]}>{getRiskText()}</Text>
            {riskData?.risk_level !== 'SAFE' && riskData?.reason_text && (
              <Text style={styles.reasonText}>{riskData.reason_text}</Text>
            )}
          </View>
          
          {riskData?.risk_level === 'SAFE' && (
            <Text style={styles.goText}>{t?.go_label || 'Safe to go out today'}</Text>
          )}
        </View>

        {/* Hourly Risk Timeline */}
        <View style={styles.timelineCard}>
          <View style={styles.timelineHeaderRow}>
            <Text style={styles.timelineTitle}>Hourly Risk Timeline</Text>
            <Text style={styles.timelineRange}>12 AM - 12 AM</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timelineTrack}
          >
            {timelineData.map((point) => {
              const barHeight = 8 + Math.round((point.risk / 100) * 112);

              return (
                <View key={point.key} style={styles.timelinePoint}>
                  <View style={styles.timelineBarBackground}>
                    <View
                      style={[
                        styles.timelineBar,
                        {
                          height: barHeight,
                          backgroundColor: getRiskColorFromScore(point.risk),
                        },
                      ]}
                    />
                  </View>
                  {point.hour % 3 === 0 && (
                    <Text style={styles.timelineLabel}>{formatTimelineHour(point.hour)}</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.overallScoreCard}>
          <Text style={styles.overallScoreTitle}>Overall Risk Score</Text>
          <Text style={[styles.overallScoreValue, { color: riskColor }]}>{score}/100</Text>
          <Text style={styles.overallScoreLevel}>{getRiskText()}</Text>
        </View>

        {/* Safe Window Card */}
        <View style={styles.windowCard}>
          <Text style={styles.windowTitle}>{t?.safe_window?.split(':')[0] || 'Safe Window'}</Text>
          {riskData?.safe_departure_window ? (
            <View style={styles.windowPill}>
              <Text style={styles.windowText}>{riskData.safe_departure_window}</Text>
            </View>
          ) : (
            <View style={[styles.windowPill, styles.windowPillDanger]}>
              <Text style={styles.windowTextDanger}>
                {t?.no_safe_window || 'No safe window today'}
              </Text>
            </View>
          )}
          {riskData?.tomorrow_window && (
            <Text style={styles.tomorrowText}>
              {t?.tomorrow_window?.replace('{start}', riskData.tomorrow_window.split(' - ')[0] || '').replace('{end}', riskData.tomorrow_window.split(' - ')[1] || '') || 'Tomorrow: ' + riskData.tomorrow_window}
            </Text>
          )}
        </View>

        {/* Weather Cards Grid */}
        <View style={styles.weatherGrid}>
          <View style={styles.weatherCard}>
            <Text style={styles.weatherIcon}>🌊</Text>
            <Text style={styles.weatherLabel}>{t?.wave_height?.split(':')[0] || 'Wave'}</Text>
            <Text style={styles.weatherValue}>{conditions?.wave_height_m?.toFixed(1) || '-'}m</Text>
          </View>
          
          <View style={styles.weatherCard}>
            <Text style={styles.weatherIcon}>💨</Text>
            <Text style={styles.weatherLabel}>{t?.wind_speed?.split(':')[0] || 'Wind'}</Text>
            <Text style={styles.weatherValue}>{conditions?.wind_speed_kmh?.toFixed(0) || '-'} km/h</Text>
          </View>
          
          <View style={styles.weatherCard}>
            <Text style={styles.weatherIcon}>👁️</Text>
            <Text style={styles.weatherLabel}>{t?.visibility?.split(':')[0] || 'Visibility'}</Text>
            <Text style={styles.weatherValue}>{conditions?.visibility_km?.toFixed(1) || '-'} km</Text>
          </View>
          
          <View style={styles.weatherCard}>
            <Text style={styles.weatherIcon}>🌊</Text>
            <Text style={styles.weatherLabel}>{t?.swell_height?.split(':')[0] || 'Swell'}</Text>
            <Text style={styles.weatherValue}>{conditions?.swell_height_m?.toFixed(1) || '-'}m</Text>
          </View>
        </View>

        {/* Tide Card */}
        <View style={styles.tideCard}>
          <Text style={styles.tideTitle}>{t?.tide || 'Tide'}</Text>
          <View style={styles.tideRow}>
            <View style={styles.tideItem}>
              <Text style={styles.tideLabel}>↑ High</Text>
              <Text style={styles.tideValue}>{tide?.high_tide_time || '--:--'}</Text>
              <Text style={styles.tideHeight}>{tide?.high_tide_height_m?.toFixed(2) || '-'}m</Text>
            </View>
            <View style={styles.tideDivider} />
            <View style={styles.tideItem}>
              <Text style={styles.tideLabel}>↓ Low</Text>
              <Text style={styles.tideValue}>{tide?.low_tide_time || '--:--'}</Text>
              <Text style={styles.tideHeight}>{tide?.low_tide_height_m?.toFixed(2) || '-'}m</Text>
            </View>
          </View>
        </View>

        {/* Offline Indicator */}
        {isOffline && (
          <View style={styles.offlineCard}>
            <Text style={styles.offlineIcon}>📴</Text>
            <Text style={styles.offlineText}>
              {t?.offline_mode || 'Offline mode'} · {t?.using_cached || 'Using cached data'}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf9f8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  zoneName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceIcon: {
    fontSize: 20,
  },
  riskBanner: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  riskText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  reasonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  goText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  timelineCard: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e2e1',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1b1b',
  },
  timelineRange: {
    fontSize: 12,
    color: '#71787e',
  },
  timelineTrack: {
    gap: 8,
    paddingBottom: 6,
  },
  timelinePoint: {
    width: 18,
    alignItems: 'center',
  },
  timelineBarBackground: {
    width: 12,
    height: 124,
    borderRadius: 10,
    backgroundColor: '#f3efee',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  timelineBar: {
    width: '100%',
    borderRadius: 10,
  },
  timelineLabel: {
    marginTop: 6,
    fontSize: 10,
    color: '#71787e',
  },
  overallScoreCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e2e1',
    alignItems: 'center',
  },
  overallScoreTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5c646a',
  },
  overallScoreValue: {
    fontSize: 34,
    fontWeight: '700',
    marginTop: 4,
  },
  overallScoreLevel: {
    fontSize: 14,
    color: '#71787e',
    marginTop: 2,
  },
  windowCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e2e1',
  },
  windowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1c1b1b',
  },
  windowPill: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  windowPillDanger: {
    backgroundColor: '#D62828',
  },
  windowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  windowTextDanger: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tomorrowText: {
    fontSize: 13,
    color: '#71787e',
    marginTop: 8,
    width: '100%',
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  weatherCard: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e2e1',
  },
  weatherIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  weatherLabel: {
    fontSize: 12,
    color: '#71787e',
    marginBottom: 2,
  },
  weatherValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1b1b',
  },
  tideCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e2e1',
  },
  tideTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1c1b1b',
    marginBottom: 12,
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
    height: 40,
    backgroundColor: '#e5e2e1',
  },
  tideLabel: {
    fontSize: 12,
    color: '#71787e',
  },
  tideValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1b1b',
    marginTop: 4,
  },
  tideHeight: {
    fontSize: 13,
    color: '#71787e',
  },
  offlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#f6f3f2',
    padding: 12,
    borderRadius: 8,
  },
  offlineIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  offlineText: {
    fontSize: 13,
    color: '#71787e',
  },
  bottomSpacer: {
    height: 30,
  },
});

export default MainDashboard;