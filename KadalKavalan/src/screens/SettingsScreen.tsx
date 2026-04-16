import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../context/UserContext';
import { useWeather } from '../context/WeatherContext';
import { Language, languageNames } from '../i18n';
import { BoatClass } from '../data/zones';
import { ThemeMode, useAppTheme } from '../theme';
import Constants from 'expo-constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SurfaceCard: React.FC<{
  children: React.ReactNode;
  theme: ReturnType<typeof useAppTheme>;
  style?: object;
}> = ({ children, style, theme }) => (
  <View
    style={[
      styles.card,
      {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        shadowOpacity: theme.isDark ? 0.18 : 0.12,
      },
      style,
    ]}
  >
    <LinearGradient
      colors={theme.colors.cardHighlight}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.cardHighlight}
    />
    {children}
  </View>
);

const ToggleSwitch: React.FC<{
  value: boolean;
  onChange: (value: boolean) => void;
  theme: ReturnType<typeof useAppTheme>;
}> = ({ value, onChange, theme }) => {
  const progress = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: value ? theme.colors.safe : theme.colors.surfaceSecondary,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 18 }],
  }));

  return (
    <Pressable onPress={() => onChange(!value)}>
      <Animated.View style={[styles.switchTrack, { borderColor: theme.colors.border }, trackStyle]}>
        <Animated.View style={[styles.switchThumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
};

const SettingsScreen: React.FC = () => {
  const {
    language,
    setLanguage,
    boatClass,
    setBoatClass,
    zone,
    preferences,
    setPreferences,
    setIsOnboarded,
  } = useUser();
  const { zoneData, refreshData } = useWeather();
  const theme = useAppTheme();

  const [whatsappEnabled, setWhatsappEnabled] = useState(preferences.whatsapp_enabled);
  const [whatsappNumber, setWhatsappNumber] = useState(preferences.whatsapp_number);
  const [smsEnabled, setSmsEnabled] = useState(preferences.sms_enabled);
  const [pushEnabled, setPushEnabled] = useState(preferences.notifications_enabled);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showBoatModal, setShowBoatModal] = useState(false);

  const languages: Language[] = ['ta', 'ml', 'te', 'or', 'en'];
  const boatTypes: { id: BoatClass; name: string }[] = [
    { id: 'A', name: 'Small (vallam)' },
    { id: 'B', name: 'Medium (country craft)' },
    { id: 'C', name: 'Large (trawler)' },
  ];

  const themeOptions: { key: ThemeMode; label: string }[] = [
    { key: 'system', label: 'System Default' },
    { key: 'light', label: 'Light Mode' },
    { key: 'dark', label: 'Dark Mode' },
  ];

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleBoatChange = (boat: BoatClass) => {
    setBoatClass(boat);
    setShowBoatModal(false);
    if (zone) {
      refreshData();
    }
  };

  const handleWhatsAppToggle = async (value: boolean) => {
    setWhatsappEnabled(value);
    setPreferences({
      ...preferences,
      whatsapp_enabled: value,
      whatsapp_number: value ? whatsappNumber : '',
    });

    if (value && whatsappNumber && whatsappNumber.length >= 10) {
      try {
        const configuredUrl = Constants.expoConfig?.extra?.mlApiUrl;
        const candidates = configuredUrl ? [configuredUrl] : ['http://10.0.2.2:8000', 'http://localhost:8000', 'http://127.0.0.1:8000'];
        let backendUrl = candidates[0];
        for (const url of candidates) {
          try {
            const res = await fetch(`${url}/health`, { method: 'GET' });
            if (res.ok) {
              backendUrl = url;
              break;
            }
          } catch {}
        }
        await fetch(`${backendUrl}/whatsapp/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: whatsappNumber,
            zone_id: zone?.id || 'TN-01',
            boat_class: boatClass,
            language: language,
          }),
        });
      } catch (e) {
        console.log('[WhatsApp] Subscribe failed:', e);
      }
    }
  };

  const handleWhatsAppNumberChange = (text: string) => {
    const cleaned = text.replace(/[^0-9+]/g, '');
    setWhatsappNumber(cleaned);
    setPreferences({
      ...preferences,
      whatsapp_number: cleaned,
    });
  };

  const handleTestWhatsApp = async () => {
    if (!whatsappNumber || whatsappNumber.length < 10) {
      Alert.alert('Enter Phone Number', 'Please enter a valid WhatsApp number to receive test alerts.');
      return;
    }
    try {
      const configuredUrl = Constants.expoConfig?.extra?.mlApiUrl;
      const candidates = configuredUrl ? [configuredUrl] : ['http://10.0.2.2:8000', 'http://localhost:8000', 'http://127.0.0.1:8000'];
      let backendUrl = candidates[0];
      for (const url of candidates) {
        try {
          const res = await fetch(`${url}/health`, { method: 'GET' });
          if (res.ok) {
            backendUrl = url;
            break;
          }
        } catch {}
      }
      const res = await fetch(`${backendUrl}/whatsapp/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: whatsappNumber }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Test alert sent! Check WhatsApp.');
      } else {
        Alert.alert('Error', 'Failed to send alert.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not connect to server.');
    }
  };

  const handleSmsToggle = (value: boolean) => {
    setSmsEnabled(value);
    setPreferences({
      ...preferences,
      sms_enabled: value,
    });
  };

  const handlePushToggle = (value: boolean) => {
    setPushEnabled(value);
    setPreferences({
      ...preferences,
      notifications_enabled: value,
    });
  };

  const handleEmergency = () => {
    Linking.openURL('tel:1554');
  };

  const handleResetOnboarding = () => {
    setIsOnboarded(false);
    Alert.alert('Reset Complete', 'Restart app to begin onboarding');
  };

  const stylesByTheme = useMemo(
    () => ({
      container: { backgroundColor: theme.colors.background },
      title: { color: theme.colors.textPrimary },
      section: { color: theme.colors.textSecondary },
      label: { color: theme.colors.textPrimary },
      value: { color: theme.colors.textSecondary },
      icon: { color: theme.colors.iconMuted },
    }),
    [theme.colors.background, theme.colors.iconMuted, theme.colors.textPrimary, theme.colors.textSecondary]
  );

  const modalSurface = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  };

  return (
    <View style={[styles.container, stylesByTheme.container]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.headerTitle, stylesByTheme.title]}>Settings</Text>

        <Text style={[styles.sectionTitle, stylesByTheme.section]}>Appearance</Text>
        <SurfaceCard theme={theme}>
          <Text style={[styles.groupLabel, stylesByTheme.section]}>Theme</Text>
          <View style={styles.themeSelectorRow}>
            {themeOptions.map((option) => {
              const selected = theme.mode === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => theme.setMode(option.key)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: selected ? theme.colors.surfaceSecondary : 'transparent',
                      borderColor: selected ? theme.colors.safe : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.themeOptionText, { color: theme.colors.textPrimary }]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </SurfaceCard>

        <Text style={[styles.sectionTitle, stylesByTheme.section]}>Preferences</Text>
        <SurfaceCard theme={theme}>
          <Pressable style={styles.settingRow} onPress={() => setShowLanguageModal(true)}>
            <View style={styles.settingMain}>
              <Text style={[styles.settingLabel, stylesByTheme.label]}>Language</Text>
              <Text style={[styles.settingValue, stylesByTheme.value]}>{languageNames[language]}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.colors.iconMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.settingRow}>
            <View style={styles.settingMain}>
              <Text style={[styles.settingLabel, stylesByTheme.label]}>Location</Text>
              <Text style={[styles.settingValue, stylesByTheme.value]}>{zone?.name_en}</Text>
            </View>
            <Feather name="map-pin" size={16} color={theme.colors.iconMuted} />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <Pressable style={styles.settingRow} onPress={() => setShowBoatModal(true)}>
            <View style={styles.settingMain}>
              <Text style={[styles.settingLabel, stylesByTheme.label]}>Boat Type</Text>
              <Text style={[styles.settingValue, stylesByTheme.value]}>
                {boatTypes.find((b) => b.id === boatClass)?.name}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.colors.iconMuted} />
          </Pressable>
        </SurfaceCard>

        <Text style={[styles.sectionTitle, stylesByTheme.section]}>Notifications</Text>
        <SurfaceCard theme={theme}>
          <View style={styles.settingRow}>
            <View style={styles.settingMain}>
              <Text style={[styles.settingLabel, stylesByTheme.label]}>WhatsApp Alerts</Text>
              <Text style={[styles.settingValue, stylesByTheme.value]}>Daily morning alerts</Text>
            </View>
            <ToggleSwitch value={whatsappEnabled} onChange={handleWhatsAppToggle} theme={theme} />
          </View>
          {whatsappEnabled ? (
            <View style={styles.whatsappInputRow}>
              <TextInput
                style={[styles.phoneInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                value={whatsappNumber}
                onChangeText={handleWhatsAppNumberChange}
                placeholder="+91XXXXXXXXXX"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="phone-pad"
              />
              <Pressable
                style={[styles.testButton, { backgroundColor: theme.colors.safe }]}
                onPress={handleTestWhatsApp}
              >
                <Text style={styles.testButtonText}>Test</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.settingRow}>
            <View style={styles.settingMain}>
              <Text style={[styles.settingLabel, stylesByTheme.label]}>SMS Alerts</Text>
              <Text style={[styles.settingValue, stylesByTheme.value]}>Fallback alerts</Text>
            </View>
            <ToggleSwitch value={smsEnabled} onChange={handleSmsToggle} theme={theme} />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.settingRow}>
            <View style={styles.settingMain}>
              <Text style={[styles.settingLabel, stylesByTheme.label]}>Push Notifications</Text>
              <Text style={[styles.settingValue, stylesByTheme.value]}>In-app alerts</Text>
            </View>
            <ToggleSwitch value={pushEnabled} onChange={handlePushToggle} theme={theme} />
          </View>
        </SurfaceCard>

        <Text style={[styles.sectionTitle, stylesByTheme.section]}>Emergency</Text>
        <SurfaceCard theme={theme}>
          <Pressable style={styles.settingRow} onPress={handleEmergency}>
            <View style={styles.settingMain}>
              <Text style={[styles.settingLabel, stylesByTheme.label]}>Coast Guard</Text>
              <Text style={[styles.settingValue, stylesByTheme.value]}>1554</Text>
            </View>
            <Feather name="phone-call" size={16} color={theme.colors.danger} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <Pressable style={styles.settingRow} onPress={handleResetOnboarding}>
            <View style={styles.settingMain}>
              <Text style={[styles.settingLabel, { color: theme.colors.danger }]}>Reset Onboarding</Text>
              <Text style={[styles.settingValue, stylesByTheme.value]}>Start fresh</Text>
            </View>
            <Feather name="refresh-cw" size={16} color={theme.colors.danger} />
          </Pressable>
        </SurfaceCard>

        {whatsappEnabled ? (
          <SurfaceCard theme={theme}>
            <Text style={[styles.groupLabel, stylesByTheme.section]}>WhatsApp Preview</Text>
            <View style={[styles.previewBubble, { backgroundColor: theme.colors.surfaceSecondary }]}> 
              <Text style={[styles.previewBubbleText, stylesByTheme.label]}>
                Kadal Kavalan{`\n`}
                Zone: {zone?.name_en || 'Rameswaram'}{`\n`}
                Risk: {zoneData?.risk_assessment?.risk_level || 'SAFE'}{`\n`}
                Wave: {zoneData?.current_conditions?.wave_height_m?.toFixed(1) || '-'}m{`\n`}
                Wind: {zoneData?.current_conditions?.wind_speed_kmh?.toFixed(0) || '-'} km/h
              </Text>
            </View>
          </SurfaceCard>
        ) : null}

        <SurfaceCard theme={theme}>
          <Text style={[styles.groupLabel, stylesByTheme.section]}>Disclaimer</Text>
          <Text style={[styles.disclaimerText, stylesByTheme.value]}>
            Kadal Kavalan is an advisory tool. Always verify official coast guard warnings and local guidance before going to sea.
          </Text>
        </SurfaceCard>

        <View style={styles.footer}>
          <Text style={[styles.footerTitle, stylesByTheme.value]}>Kadal Kavalan v1.0</Text>
        </View>

        <View style={{ height: 116 }} />
      </ScrollView>

      {showLanguageModal ? (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowLanguageModal(false)} />
          <View style={[styles.modalContent, modalSurface]}>
            <Text style={[styles.modalTitle, stylesByTheme.label]}>Select Language</Text>
            {languages.map((lang) => {
              const selected = language === lang;
              return (
                <Pressable
                  key={lang}
                  style={[
                    styles.modalOption,
                    {
                      backgroundColor: selected ? theme.colors.surfaceSecondary : theme.colors.background,
                      borderColor: selected ? theme.colors.safe : theme.colors.border,
                    },
                  ]}
                  onPress={() => handleLanguageChange(lang)}
                >
                  <Text style={[styles.modalOptionText, { color: theme.colors.textPrimary }]}> 
                    {languageNames[lang]}
                  </Text>
                  {selected ? <Feather name="check" size={16} color={theme.colors.safe} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {showBoatModal ? (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowBoatModal(false)} />
          <View style={[styles.modalContent, modalSurface]}>
            <Text style={[styles.modalTitle, stylesByTheme.label]}>Select Boat Type</Text>
            {boatTypes.map((boat) => {
              const selected = boatClass === boat.id;
              return (
                <Pressable
                  key={boat.id}
                  style={[
                    styles.modalOption,
                    {
                      backgroundColor: selected ? theme.colors.surfaceSecondary : theme.colors.background,
                      borderColor: selected ? theme.colors.safe : theme.colors.border,
                    },
                  ]}
                  onPress={() => handleBoatChange(boat.id)}
                >
                  <Text style={[styles.modalOptionText, { color: theme.colors.textPrimary }]}>{boat.name}</Text>
                  {selected ? <Feather name="check" size={16} color={theme.colors.safe} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 58 : 42,
    paddingBottom: 120,
  },
  headerTitle: {
    marginHorizontal: 16,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    fontSize: 12,
    letterSpacing: 0.9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  cardHighlight: {
    ...StyleSheet.absoluteFillObject,
    height: 70,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  settingMain: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingValue: {
    marginTop: 2,
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  themeSelectorRow: {
    gap: 8,
  },
  themeOption: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewRow: {
    marginTop: 10,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewText: {
    fontSize: 13,
    fontWeight: '600',
  },
  whatsappInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 2,
    gap: 8,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  testButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  previewBubble: {
    borderRadius: 14,
    padding: 12,
  },
  previewBubbleText: {
    fontSize: 13,
    lineHeight: 20,
  },
  disclaimerText: {
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 12,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    padding: 2,
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalOption: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SettingsScreen;
