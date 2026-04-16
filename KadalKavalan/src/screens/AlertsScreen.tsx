import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
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
import { useUser } from '../context/UserContext';
import { useWeather, CommunityReport } from '../context/WeatherContext';
import { useAppTheme } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
    mount.value = withDelay(
      delay,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, mount]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: mount.value,
    transform: [{ translateY: 16 * (1 - mount.value) }, { scale: pressScale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowOpacity: theme.isDark ? 0.18 : 0.12,
        },
        style,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withTiming(0.96, { duration: 140 });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: 180 });
      }}
    >
      <LinearGradient
        colors={theme.colors.cardHighlight}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.highlight}
      />
      {children}
    </AnimatedPressable>
  );
};

const AlertsScreen: React.FC = () => {
  const { t, zone } = useUser();
  const { zoneData, communityReports, submitReport } = useWeather();
  const theme = useAppTheme();

  const [showReportForm, setShowReportForm] = useState(false);
  const [waveCondition] = useState<CommunityReport['wave_condition']>('moderate');
  const [windStrength] = useState<CommunityReport['wind_strength']>('moderate');
  const [visibility] = useState<CommunityReport['visibility']>('clear');
  const [overall] = useState<CommunityReport['overall']>('safe');
  const [note] = useState('');

  const officialAlerts = zoneData?.official_alerts ?? [];

  const alertItems = useMemo(() => {
    return officialAlerts.map((item, index) => {
      const severityColor =
        item.severity === 'WARNING'
          ? theme.colors.danger
          : item.severity === 'ADVISORY'
            ? theme.colors.warning
            : theme.colors.safe;

      return {
        id: `${item.source}-${item.issued_at}-${index}`,
        title: item.title_en,
        description: `${item.source} • ${item.alert_type}`,
        timestamp: new Date(item.issued_at).toLocaleTimeString(),
        severityColor,
        severityText: item.severity,
      };
    });
  }, [officialAlerts, theme.colors.danger, theme.colors.safe, theme.colors.warning]);

  const formatHourLabel = (hour: number): string => {
    const normalized = ((hour % 24) + 24) % 24;
    const suffix = normalized >= 12 ? 'PM' : 'AM';
    const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
    return `${hour12}:00 ${suffix}`;
  };

  const returnPrediction = zoneData?.return_time_prediction;
  const confidencePercent = returnPrediction ? Math.round(returnPrediction.confidence * 100) : null;

  const handleSubmitReport = async () => {
    await submitReport({
      zone_id: zone?.id || 'TN-01',
      location_lat: zone?.centroid_lat || 9.2876,
      location_lon: zone?.centroid_lon || 79.3129,
      wave_condition: waveCondition,
      wind_strength: windStrength,
      visibility,
      overall,
      note,
    });
    setShowReportForm(false);
    Alert.alert('Report Submitted', 'Thank you for your report!');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Alerts</Text>

        <EntryCard theme={theme} delay={20}>
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
              Return-time prediction not available yet. Refresh dashboard for latest ML data.
            </Text>
          )}
        </EntryCard>

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>OFFICIAL ALERTS</Text>
        {alertItems.length === 0 ? (
          <EntryCard theme={theme} delay={80}>
            <View style={styles.emptyRow}>
              <Feather name="shield" size={18} color={theme.colors.iconMuted} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No official alerts right now</Text>
            </View>
          </EntryCard>
        ) : (
          alertItems.map((item, index) => (
            <EntryCard theme={theme} key={item.id} delay={80 + index * 60} style={styles.alertCard}>
              <View style={[styles.severityRail, { backgroundColor: item.severityColor }]} />
              <View style={styles.alertContent}>
                <View style={styles.alertTopRow}>
                  <View style={styles.alertTitleWrap}>
                    <Feather name="alert-circle" size={16} color={item.severityColor} />
                    <Text style={[styles.alertTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                  <Text style={[styles.alertTime, { color: theme.colors.textSecondary }]}>{item.timestamp}</Text>
                </View>
                <Text style={[styles.alertDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={[styles.alertSeverity, { color: item.severityColor }]}>{item.severityText}</Text>
              </View>
            </EntryCard>
          ))
        )}

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>COMMUNITY REPORTS</Text>
        {communityReports.length === 0 ? (
          <EntryCard theme={theme} delay={220}>
            <View style={styles.emptyRow}>
              <Feather name="users" size={18} color={theme.colors.iconMuted} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No reports submitted yet</Text>
            </View>
          </EntryCard>
        ) : (
          communityReports.map((report, index) => (
            <EntryCard theme={theme} key={`${report.id}-${index}`} delay={220 + index * 60}>
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

        <View style={{ height: 110 }} />
      </ScrollView>

      <Pressable
        style={[styles.fab, { backgroundColor: theme.colors.safe }]}
        onPress={() => setShowReportForm(true)}
      >
        <Feather name="plus" size={22} color="#fff" />
      </Pressable>

      <Modal visible={showReportForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Submit Report</Text>
            <Pressable style={[styles.submitBtn, { backgroundColor: theme.colors.safe }]} onPress={handleSubmitReport}>
              <Text style={styles.submitBtnText}>Submit</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: 54,
    paddingBottom: 100,
  },
  headerTitle: {
    marginHorizontal: 16,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 18,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    height: 78,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  returnHours: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 4,
  },
  returnMeta: {
    fontSize: 14,
    lineHeight: 20,
  },
  alertCard: {
    flexDirection: 'row',
    paddingLeft: 0,
  },
  severityRail: {
    width: 4,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  alertContent: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 4,
  },
  alertTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  alertTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  alertDescription: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 18,
  },
  alertTime: {
    fontSize: 12,
  },
  alertSeverity: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  reportZone: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 92,
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AlertsScreen;
