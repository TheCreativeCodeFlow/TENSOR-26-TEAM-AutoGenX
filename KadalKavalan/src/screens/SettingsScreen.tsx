import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { useWeather } from '../context/WeatherContext';
import { Language, languageNames } from '../i18n';
import { BoatClass, BoatType, FishingZone } from '../data/zones';

const SettingsScreen: React.FC = () => {
  const { t, language, setLanguage, boatClass, setBoatClass, zone, setZone, preferences, setPreferences, setIsOnboarded } = useUser();
  const { zoneData, refreshData } = useWeather();
  
  const [whatsappEnabled, setWhatsappEnabled] = useState(preferences.whatsapp_enabled);
  const [smsEnabled, setSmsEnabled] = useState(preferences.sms_enabled);
  const [pushEnabled, setPushEnabled] = useState(preferences.notifications_enabled);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showBoatModal, setShowBoatModal] = useState(false);

  const languages: Language[] = ['ta', 'ml', 'te', 'or', 'en'];
  const boatTypes: { id: BoatClass; name: string }[] = [
    { id: 'A', name: t?.boat_class_a || 'Small (vallam)' },
    { id: 'B', name: t?.boat_class_b || 'Medium (country craft)' },
    { id: 'C', name: t?.boat_class_c || 'Large (trawler)' },
  ];

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleBoatChange = (boat: BoatClass) => {
    setBoatClass(boat);
    setShowBoatModal(false);
    // Refresh data with new boat class
    if (zone) {
      refreshData();
    }
  };

  const handleWhatsApp = () => {
    Alert.alert(
      'WhatsApp Alerts',
      'To receive WhatsApp alerts, add +91 98765 43210 to your contacts and message "START" to opt-in.',
      [{ text: 'OK' }]
    );
  };

  const handleEmergency = () => {
    Linking.openURL('tel:1554');
  };

  const handleResetOnboarding = () => {
    setIsOnboarded(false);
    Alert.alert('Reset Complete', 'Restart app to begin onboarding');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Settings Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t?.settings || 'Settings'}</Text>
        </View>

        {/* Language Setting */}
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t?.language || 'Language'}</Text>
              <Text style={styles.settingValue}>{languageNames[language]}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowLanguageModal(true)}>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Setting */}
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t?.current_location || 'Location'}</Text>
              <Text style={styles.settingValue}>{zone?.name_en}</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Boat Type Setting */}
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t?.select_boat_type?.replace('your ', '') || 'Boat Type'}</Text>
              <Text style={styles.settingValue}>
                {boatTypes.find(b => b.id === boatClass)?.name}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowBoatModal(true)}>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <Text style={styles.sectionTitle}>{t?.notifications || 'Notifications'}</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t?.whatsapp_alerts || 'WhatsApp Alerts'}</Text>
              <Text style={styles.settingHint}>Daily morning alerts via WhatsApp</Text>
            </View>
            <Switch
              value={whatsappEnabled}
              onValueChange={setWhatsappEnabled}
              trackColor={{ false: '#e5e2e1', true: '#2D6A4F' }}
              thumbColor="#fff"
            />
          </View>
          {whatsappEnabled && (
            <TouchableOpacity style={styles.previewButton} onPress={handleWhatsApp}>
              <Text style={styles.previewText}>Preview WhatsApp Message →</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t?.sms_alerts || 'SMS Alerts'}</Text>
              <Text style={styles.settingHint}>Fallback via SMS (premium)</Text>
            </View>
            <Switch
              value={smsEnabled}
              onValueChange={setSmsEnabled}
              trackColor={{ false: '#e5e2e1', true: '#2D6A4F' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t?.push_alerts || 'Push Notifications'}</Text>
              <Text style={styles.settingHint}>In-app alerts</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#e5e2e1', true: '#2D6A4F' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* WhatsApp Preview */}
        {whatsappEnabled && (
          <View style={styles.whatsappPreview}>
            <View style={styles.whatsappHeader}>
              <Text style={styles.whatsappTitle}>WhatsApp Preview</Text>
            </View>
            <View style={styles.whatsappBubble}>
              <Text style={styles.whatsappText}>
                🌊 KADAL KAVALAN{'\n'}
                📍 {zone?.name_en || 'Rameswaram'}{'\n'}
                ⚠️ Risk: {zoneData?.risk_assessment?.risk_level || 'SAFE'}{'\n'}
                🌊 Wave: {zoneData?.current_conditions?.wave_height_m?.toFixed(1) || '-'}m{'\n'}
                💨 Wind: {zoneData?.current_conditions?.wind_speed_kmh?.toFixed(0) || '-'} km/h{'\n'}
                ⏰ Safe Window: {zoneData?.risk_assessment?.safe_departure_window || 'None'}
              </Text>
              <Text style={styles.whatsappTime}>Now</Text>
            </View>
          </View>
        )}

        {/* Emergency Section */}
        <Text style={styles.sectionTitle}>{t?.emergency || 'Emergency'}</Text>

        <TouchableOpacity style={styles.emergencyCard} onPress={handleEmergency}>
          <Text style={styles.emergencyIcon}>🆘</Text>
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyLabel}>{t?.coast_guard || 'Coast Guard'}</Text>
            <Text style={styles.emergencyNumber}>1554</Text>
          </View>
          <Text style={styles.emergencyArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.emergencyCard, { marginTop: 8, backgroundColor: '#D62828' }]} onPress={handleResetOnboarding}>
          <Text style={styles.emergencyIcon}>🔄</Text>
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyLabel}>Reset Onboarding</Text>
            <Text style={styles.emergencyNumber}>Start fresh</Text>
          </View>
          <Text style={styles.emergencyArrow}>→</Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            Kadal Kavalan is an advisory tool that combines weather model data with official IMD and INCOIS bulletins. It is not a replacement for official coast guard warnings, your personal judgment, or local knowledge. Always check official channels before going to sea.
          </Text>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Kadal Kavalan v1.0</Text>
          <Text style={styles.appTagline}>{t?.app_tagline || 'Sea Guardian'}</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Language Modal */}
      {showLanguageModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowLanguageModal(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.modalOption,
                  language === lang && styles.modalOptionActive,
                ]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text style={[
                  styles.modalOptionText,
                  language === lang && styles.modalOptionTextActive,
                ]}>
                  {languageNames[lang]}
                </Text>
                {language === lang && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Boat Type Modal */}
      {showBoatModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowBoatModal(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Boat Type</Text>
            {boatTypes.map((boat) => (
              <TouchableOpacity
                key={boat.id}
                style={[
                  styles.modalOption,
                  boatClass === boat.id && styles.modalOptionActive,
                ]}
                onPress={() => handleBoatChange(boat.id)}
              >
                <Text style={[
                  styles.modalOptionText,
                  boatClass === boat.id && styles.modalOptionTextActive,
                ]}>
                  {boat.name}
                </Text>
                {boatClass === boat.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1c1b1b',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71787e',
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e2e1',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1c1b1b',
  },
  settingValue: {
    fontSize: 13,
    color: '#71787e',
    marginTop: 2,
  },
  settingHint: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 18,
    color: '#71787e',
  },
  previewButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  previewText: {
    fontSize: 14,
    color: '#0B4F6C',
    fontWeight: '500',
  },
  whatsappPreview: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e2e1',
  },
  whatsappHeader: {
    backgroundColor: '#075E54',
    padding: 12,
  },
  whatsappTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  whatsappBubble: {
    backgroundColor: '#DCF8C6',
    padding: 12,
    margin: 12,
    marginTop: 0,
    borderRadius: 8,
    maxWidth: '85%',
  },
  whatsappText: {
    fontSize: 13,
    color: '#1c1b1b',
    lineHeight: 20,
  },
  whatsappTime: {
    fontSize: 10,
    color: '#71787e',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D62828',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
  },
  emergencyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  emergencyNumber: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  emergencyArrow: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
  },
  disclaimer: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f6f3f2',
    borderRadius: 12,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1b1b',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#71787e',
    lineHeight: 18,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71787e',
  },
  appTagline: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  bottomSpacer: {
    height: 30,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1b1b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f6f3f2',
  },
  modalOptionActive: {
    backgroundColor: '#0B4F6C',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1c1b1b',
  },
  modalOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default SettingsScreen;