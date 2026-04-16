import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { useWeather, CommunityReport } from '../context/WeatherContext';

const AlertsScreen: React.FC = () => {
  const { t, zone } = useUser();
  const { zoneData, communityReports, submitReport } = useWeather();
  
  const [showReportForm, setShowReportForm] = useState(false);
  const [waveCondition, setWaveCondition] = useState<CommunityReport['wave_condition']>('moderate');
  const [windStrength, setWindStrength] = useState<CommunityReport['wind_strength']>('moderate');
  const [visibility, setVisibility] = useState<CommunityReport['visibility']>('clear');
  const [overall, setOverall] = useState<CommunityReport['overall']>('safe');
  const [note, setNote] = useState('');

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
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time To Reach Back</Text>
          <View style={styles.returnCard}>
            {returnPrediction ? (
              <>
                <Text style={styles.returnHours}>{returnPrediction.estimated_hours} hrs</Text>
                <Text style={styles.returnMeta}>
                  Best departure: {formatHourLabel(returnPrediction.optimal_departure)}
                </Text>
                <Text style={styles.returnMeta}>
                  Confidence: {confidencePercent}%
                </Text>
              </>
            ) : (
              <Text style={styles.returnEmpty}>
                Return-time prediction not available yet. Refresh the dashboard to fetch latest ML data.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t?.community_reports || 'Community Reports'}
          </Text>
          
          {communityReports.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No reports yet</Text>
            </View>
          ) : (
            <View>
              {communityReports.map((report, index) => (
                <View key={index} style={styles.reportCard}>
                  <Text style={styles.reportTime}>Just now</Text>
                  <Text style={styles.reportZone}>{report.zone_id}</Text>
                  <Text style={styles.reportNote}>{report.wave_condition}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowReportForm(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal visible={showReportForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Submit Report</Text>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReport}>
              <Text style={styles.submitBtnText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcf9f8' },
  scrollView: { flex: 1 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1c1b1b', marginBottom: 12 },
  returnCard: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e2e1',
  },
  returnHours: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0B4F6C',
    marginBottom: 4,
  },
  returnMeta: {
    fontSize: 14,
    color: '#41484d',
    marginTop: 2,
  },
  returnEmpty: {
    fontSize: 14,
    color: '#71787e',
    lineHeight: 20,
  },
  emptyCard: { backgroundColor: '#fff', padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 14, color: '#71787e' },
  reportCard: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10 },
  reportTime: { fontSize: 12, color: '#71787e' },
  reportZone: { fontSize: 12, fontWeight: '600', color: '#0B4F6C' },
  reportNote: { fontSize: 13, color: '#41484d', marginTop: 4 },
  fab: { position: 'absolute', bottom: 80, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0B4F6C', alignItems: 'center', justifyContent: 'center' },
  fabIcon: { fontSize: 28, color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1c1b1b', marginBottom: 16 },
  submitBtn: { backgroundColor: '#0B4F6C', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default AlertsScreen;