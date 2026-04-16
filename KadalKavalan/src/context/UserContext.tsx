import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, translations } from '../i18n';
import { FishingZone, defaultZone, getZoneById, findNearestZone } from '../data/zones';
import { BoatClass, UserPreferences, defaultPreferences } from '../data/zones';

interface UserContextType {
  // User preferences
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  
  // Zone
  zone: FishingZone;
  setZone: (zone: FishingZone) => void;
  userLatLon: { lat: number; lon: number } | null;
  setUserLatLon: (lat: number, lon: number) => void;
  
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['ta'];
  
  // Boat
  boatClass: BoatClass;
  setBoatClass: (boatClass: BoatClass) => void;
  
  // Onboarding
  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
  
  // First launch
  isFirstLaunch: boolean;
  completeOnboarding: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = '@kadal_kavalan_prefs';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferencesState] = useState<UserPreferences>(defaultPreferences);
  const [zone, setZoneState] = useState<FishingZone>(defaultZone);
  const [userLatLon, setUserLatLonState] = useState<{ lat: number; lon: number } | null>(null);
  const [language, setLanguageState] = useState<Language>('ta');
  const [boatClass, setBoatClassState] = useState<BoatClass>('A');
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);

  // Load saved preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    console.log('[UserContext] loadPreferences called');
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('[UserContext] Saved preferences:', saved ? 'yes' : 'no');
      if (saved) {
        const prefs = JSON.parse(saved) as UserPreferences;
        console.log('[UserContext] Loaded prefs - zone:', prefs.zone_id, 'boat:', prefs.boat_class, 'lang:', prefs.language);
        setPreferencesState(prefs);
        setLanguageState(prefs.language);
        setBoatClassState(prefs.boat_class);
        
        const zoneData = getZoneById(prefs.zone_id);
        if (zoneData) {
          console.log('[UserContext] Found zone:', zoneData.id, zoneData.name_en);
          setZoneState(zoneData);
        }
        
        setIsOnboarded(true);
        setIsFirstLaunch(false);
        console.log('[UserContext] Set isOnboarded=true');
      } else {
        console.log('[UserContext] No saved prefs, will show onboarding');
      }
    } catch (error) {
      console.error('[UserContext] Error loading preferences:', error);
    }
  };

  const setPreferences = async (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferencesState(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const setZone = (newZone: FishingZone) => {
    setZoneState(newZone);
    setPreferences({ zone_id: newZone.id });
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setPreferences({ language: lang });
  };

  const setBoatClass = (boat: BoatClass) => {
    setBoatClassState(boat);
    setPreferences({ boat_class: boat });
  };

  const setUserLatLon = (lat: number, lon: number) => {
    setUserLatLonState({ lat, lon });
    // Auto-detect nearest zone
    const nearest = findNearestZone(lat, lon);
    setZoneState(nearest);
    setPreferences({ zone_id: nearest.id });
  };

  const completeOnboarding = () => {
    setIsOnboarded(true);
    setIsFirstLaunch(false);
    setPreferences({});
  };

  const t = translations[language];

  const value: UserContextType = {
    preferences,
    setPreferences,
    zone,
    setZone,
    userLatLon,
    setUserLatLon,
    language,
    setLanguage,
    t,
    boatClass,
    setBoatClass,
    isOnboarded,
    setIsOnboarded,
    isFirstLaunch,
    completeOnboarding,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};