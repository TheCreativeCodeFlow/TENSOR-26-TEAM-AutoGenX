import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { useUser } from '../context/UserContext';
import { useWeather } from '../context/WeatherContext';
import { FishingZone, fishingZones, BoatClass } from '../data/zones';
import { Language, languageNames } from '../i18n';

const OnboardingScreen: React.FC = () => {
  const { completeOnboarding, setLanguage, setZone, setBoatClass, setUserLatLon, language, setIsOnboarded } = useUser();
  const { fetchWeatherData } = useWeather();
  
  const [step, setStep] = useState(0);
  console.log('[Onboarding] Rendering step:', step);
  const [selectedLang, setSelectedLang] = useState<Language>('ta');
  const [selectedZone, setSelectedZone] = useState<FishingZone | null>(null);
  const [selectedBoat, setSelectedBoat] = useState<BoatClass>('A');
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLang(lang);
    setLanguage(lang);
  };

  const handleContinue = () => {
    console.log('[Onboarding] Continue pressed, was at step:', step);
    setStep(currentStep => {
      const newStep = currentStep + 1;
      console.log('[Onboarding] Moving to step:', newStep);
      return newStep;
    });
  };

  const handleUseMyLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = location.coords;
        setUserLatLon(latitude, longitude);
        
        let minDist = Infinity;
        let nearest = fishingZones[0];
        for (const zone of fishingZones) {
          const dist = Math.sqrt(Math.pow(zone.centroid_lat - latitude, 2) + Math.pow(zone.centroid_lon - longitude, 2));
          if (dist < minDist) { minDist = dist; nearest = zone; }
        }
        setSelectedZone(nearest);
        setStep(2);
      }
    } catch (error) {
      console.error('Location error:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSelectZone = (zone: FishingZone) => { setSelectedZone(zone); };

  const handleFinishOnboarding = async () => {
    console.log('[Onboarding] Finishing, zone:', selectedZone?.id, 'boat:', selectedBoat);
    if (selectedZone) setZone(selectedZone);
    setBoatClass(selectedBoat);
    if (selectedZone) {
      console.log('[Onboarding] Fetching weather for zone:', selectedZone.id);
      await fetchWeatherData(selectedZone, selectedBoat);
    }
    console.log('[Onboarding] Calling completeOnboarding');
    completeOnboarding();
  };

  const speakText = (lang: string) => {
    Speech.speak(languageNames[lang], { 
      language: lang === 'ta' ? 'ta-IN' : lang === 'ml' ? 'ml-IN' : lang === 'te' ? 'te-IN' : lang === 'or' ? 'or-IN' : 'en-IN', 
      rate: 0.85 
    });
  };

  const texts: Record<Language, { continue: string; next: string; back: string; locTitle: string; locSubtitle: string; useGPS: string; finding: string; or: string; boatTitle: string; boatSubtitle: string; getReport: string }> = {
    ta: { continue: 'தொடரவும் →', next: 'அடுத்தது →', back: 'முன்', locTitle: 'எங்கு மீன் பிடிக்கிறீர்கள்?', locSubtitle: 'உங்கள் மீன் பிடி பகுதியைத் தேர்ந்தெடுக்கவ���ம்', useGPS: 'என் இடத்தைப் பயன்படுத்தவும்', finding: 'இடம் கண்டடையபடுகிறது...', or: 'அல்லது', boatTitle: 'உங்கள் படகு வகை?', boatSubtitle: 'பாதுகாப்பு வரம்புகளைத் தீர்மானிக்கிறது', getReport: 'பாதுகாப்பு அறிக்கை பெறவும்' },
    ml: { continue: 'തുടരുക →', next: 'അടുത്തത് →', back: 'മുന്‍പ്', locTitle: 'എവിടെ മീന് പിടിക്കണം?', locSubtitle: 'നിങ്ങളുടെ മേഖല തിരഞ്ഞെടുക്കുക', useGPS: 'എന്റെ സ്ഥാനം ഉപയോഗിക്കുക', finding: 'Getting location...', or: 'or', boatTitle: 'ബോട്ട് തരം?', boatSubtitle: 'സുരക്ഷാ പരിധികള്‍ നിശ്ചയിക്കുന്നു', getReport: 'സുരക്ഷാ റിപ്പോര്‍ട്ട് വാങ്ങാന്‍ ആരംഭിക്കുക' },
    te: { continue: 'తదల్ →', next: 'Next →', back: 'Back', locTitle: 'Ekkadi min pidikthunnav?', locSubtitle: 'Niku fishing zone choosanko?', useGPS: 'Naaku location use cheyyali', finding: 'Location...', or: 'or', boatTitle: 'Boat type?', boatSubtitle: 'Safety limits decide aipothundi', getReport: 'Safety report' },
    or: { continue: 'Continue →', next: 'Next →', back: 'Back', locTitle: 'Kothae min dhari?', locSubtitle: 'Tumi fishing zone select kara?', useGPS: 'Amara location use kariba', finding: 'Getting...', or: 'or', boatTitle: 'Boat type?', boatSubtitle: 'E determine safe limits', getReport: 'Safety report' },
    en: { continue: 'Continue →', next: 'Next →', back: 'Back', locTitle: 'Where do you fish?', locSubtitle: 'Select your fishing zone', useGPS: 'Use My Current Location', finding: 'Getting location...', or: 'or', boatTitle: 'What boat do you use?', boatSubtitle: 'This determines your safety limits', getReport: 'Get My Safety Report' },
  };

  const t = texts[selectedLang];

  const getBoatOptions = () => [
    { id: 'A' as BoatClass, name: selectedLang === 'ta' ? 'சிறிய படகு (வல்லம்)' : selectedLang === 'ml' ? 'ചെറിയ വള്ളം' : 'Small (vallam)', limits: 'Wave: 1.0m | Wind: 28 km/h', emoji: '🚤' },
    { id: 'B' as BoatClass, name: selectedLang === 'ta' ? 'மத்திய படகு' : selectedLang === 'ml' ? 'മധ്യത്തിലെ വള്ളം' : 'Medium (country)', limits: 'Wave: 2.0m | Wind: 40 km/h', emoji: '🛶' },
    { id: 'C' as BoatClass, name: selectedLang === 'ta' ? 'பெரிய படகு' : selectedLang === 'ml' ? 'വലിയ വള്ളം' : 'Large (trawler)', limits: 'Wave: 3.5m | Wind: 55 km/h', emoji: '🚢' },
  ];

  if (step === 0) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" />
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
          <Text style={styles.logoIcon}>⚓</Text>
          <Text style={styles.logoTitle}>KADAL KAVALAN</Text>
          <Text style={styles.logoSubtitle}>கடல் காவலன் · Sea Guardian</Text>
          <Text style={styles.logoSubtitleEn}>Hyperlocal Marine Safety Advisory</Text>
        </Animated.View>
        
        <Animated.View style={[styles.glassCard, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.selectLangTitle}>Select Your Language</Text>
          <View style={styles.langGrid}>
            {(Object.keys(languageNames) as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langPill, selectedLang === lang && styles.langPillSelected]}
                onPress={() => handleLanguageSelect(lang)}
                onLongPress={() => speakText(lang)}
              >
                <Text style={[styles.langText, selectedLang === lang && styles.langTextSelected]}>{languageNames[lang]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.contBtn} onPress={handleContinue}>
            <Text style={styles.contBtnText}>{t.continue}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  if (step === 1) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>{t.locTitle}</Text>
          <Text style={styles.stepSubtitle}>{t.locSubtitle}</Text>
          
          <TouchableOpacity style={styles.gpsBtn} onPress={handleUseMyLocation} disabled={loadingLocation}>
            <Text style={styles.gpsIcon}>📍</Text>
            <Text style={styles.gpsText}>{loadingLocation ? t.finding : t.useGPS}</Text>
          </TouchableOpacity>
          
          <Text style={styles.orText}>— {t.or} —</Text>
          
          <View style={styles.zoneList}>
            {fishingZones.map((zone) => (
              <TouchableOpacity key={zone.id} style={[styles.zoneCard, selectedZone?.id === zone.id && styles.zoneCardSelected]} onPress={() => handleSelectZone(zone)}>
                <View style={styles.zoneInfo}>
                  <Text style={[styles.zoneName, selectedZone?.id === zone.id && styles.zoneNameSelected]}>
                    {selectedLang === 'ta' ? zone.name_ta : selectedLang === 'ml' ? zone.name_ml : zone.name_en}
                  </Text>
                  <Text style={styles.zoneState}>{zone.coastal_state}</Text>
                </View>
                {selectedZone?.id === zone.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}><Text style={styles.backBtnText}>← {t.back}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.nextBtn, !selectedZone && styles.nextBtnDisabled]} onPress={handleContinue} disabled={!selectedZone}>
            <Text style={styles.nextBtnText}>{t.next}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{t.boatTitle}</Text>
        <Text style={styles.stepSubtitle}>{t.boatSubtitle}</Text>
        
        <View style={styles.boatList}>
          {getBoatOptions().map((boat) => (
            <TouchableOpacity key={boat.id} style={[styles.boatCard, selectedBoat === boat.id && styles.boatCardSelected]} onPress={() => setSelectedBoat(boat.id)}>
              <Text style={styles.boatEmoji}>{boat.emoji}</Text>
              <View style={styles.boatInfo}>
                <Text style={[styles.boatName, selectedBoat === boat.id && styles.boatNameSelected]}>{boat.name}</Text>
                <Text style={styles.boatLimits}>{boat.limits}</Text>
              </View>
              {selectedBoat === boat.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity style={styles.startBtn} onPress={handleFinishOnboarding}>
          <Text style={styles.startBtnText}>{t.getReport}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}><Text style={styles.backBtnText}>← {t.back}</Text></TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcf9f8' },
  splashContainer: { flex: 1, backgroundColor: '#0B4F6C' },
  logoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  logoIcon: { fontSize: 80, marginBottom: 20 },
  logoTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 3 },
  logoSubtitle: { fontSize: 20, color: 'rgba(255,255,255,0.9)', marginTop: 8 },
  logoSubtitleEn: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  
  glassCard: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 24, margin: 20, marginBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  selectLangTitle: { fontSize: 16, fontWeight: '600', color: '#fff', textAlign: 'center', marginBottom: 16 },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20 },
  langPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)' },
  langPillSelected: { backgroundColor: '#fff' },
  langText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  langTextSelected: { color: '#0B4F6C' },
  contBtn: { backgroundColor: '#fff', padding: 14, borderRadius: 12, alignItems: 'center' },
  contBtnText: { color: '#0B4F6C', fontSize: 16, fontWeight: '600' },
  
  stepContent: { flex: 1, padding: 20, paddingTop: 60 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#1c1b1b', textAlign: 'center', marginBottom: 8 },
  stepSubtitle: { fontSize: 14, color: '#71787e', textAlign: 'center', marginBottom: 24 },
  
  gpsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B4F6C', padding: 16, borderRadius: 14, marginBottom: 16 },
  gpsIcon: { fontSize: 22, marginRight: 10 },
  gpsText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  orText: { textAlign: 'center', color: '#71787e', marginBottom: 16 },
  
  zoneList: { flex: 1 },
  zoneCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e5e2e1' },
  zoneCardSelected: { borderColor: '#0B4F6C', backgroundColor: '#f0f4f6' },
  zoneInfo: { flex: 1 },
  zoneName: { fontSize: 14, fontWeight: '500', color: '#1c1b1b' },
  zoneNameSelected: { color: '#0B4F6C' },
  zoneState: { fontSize: 11, color: '#71787e', marginTop: 2 },
  checkmark: { fontSize: 16, color: '#0B4F6C', fontWeight: 'bold' },
  
  boatList: { flex: 1, justifyContent: 'center' },
  boatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e5e2e1' },
  boatCardSelected: { borderColor: '#0B4F6C', backgroundColor: '#f0f4f6' },
  boatEmoji: { fontSize: 32, marginRight: 14 },
  boatInfo: { flex: 1 },
  boatName: { fontSize: 15, fontWeight: '600', color: '#1c1b1b' },
  boatNameSelected: { color: '#0B4F6C' },
  boatLimits: { fontSize: 12, color: '#71787e', marginTop: 2 },
  
  startBtn: { backgroundColor: '#0B4F6C', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  
  navRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingBottom: 30 },
  backBtn: { padding: 12 },
  backBtnText: { color: '#0B4F6C', fontSize: 15, fontWeight: '500' },
  nextBtn: { backgroundColor: '#0B4F6C', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  nextBtnDisabled: { backgroundColor: '#ccc' },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default OnboardingScreen;