export interface Zone {
  id: string;
  name_en: string;
  name_ta: string;
  name_ml: string;
  name_te: string;
  name_or: string;
  centroid_lat: number;
  centroid_lon: number;
  coastal_state: string;
  primary_language: string;
  imd_zone_code: string;
  incois_zone_code: string;
}

export type FishingZone = Zone;

export const fishingZones: Zone[] = [
  { id: 'TN-01', name_en: 'Rameswaram / Gulf of Mannar North', name_ta: 'இராமேஸ்வரம் / வடக்கு மன்னார் வளைகுடா', name_ml: 'രാമേശ്വരം / വടക്കൻ മന്നാറിനു കടലിനപ്പുറം', name_te: 'రామేశ్వరం / గల్ఫ్ ఆఫ్‌ మనార్‌ ఉత్తరం', name_or: 'ରାମେଶ୍ଵର / ଗଲ୍ଫ ଅଫ୍‌ ମାନର ଉତ୍ତର', centroid_lat: 9.2876, centroid_lon: 79.3129, coastal_state: 'Tamil Nadu', primary_language: 'ta', imd_zone_code: 'SOUTH_TN_COAST', incois_zone_code: 'TN_N_MANNAR' },
  { id: 'TN-02', name_en: 'Gulf of Mannar South / Thoothukudi', name_ta: 'தென் மன்னார் வளைகுடா / தூத்துக்குடம்', name_ml: 'തെക്കൻ മന്നാറിനു കടലിനപ്പുറം / തൂത്തുക്കുട', name_te: 'దక్షిణ గల్ఫ్ ఆఫ్‌ మనార్ / थूதुगुडि', name_or: 'ଦକ୍ଷିଣ ଗଲ୍ଫ ଅଫ୍‌ ମାନର / ଠୁତୁଗୁଡି', centroid_lat: 9.0, centroid_lon: 78.5, coastal_state: 'Tamil Nadu', primary_language: 'ta', imd_zone_code: 'SOUTH_TN_COAST', incois_zone_code: 'TN_S_MANNAR' },
  { id: 'TN-03', name_en: 'Palk Strait / Nagapattinam', name_ta: 'பாக் ஸ்ட்ரைட் / நாகப்பட்டினம்', name_ml: 'പാക്ക് സ്ട്രെയിറ്റ് / നാഗപട്ടിണം', name_te: 'পাল্ক్ স্ট্রেইট / নাগপট্টিনাম', name_or: 'ପାଲକ୍ ସ୍ଟ୍ରେଟ / ନାଗପଟ୍ଟିନାମ', centroid_lat: 10.5, centroid_lon: 79.8, coastal_state: 'Tamil Nadu', primary_language: 'ta', imd_zone_code: 'SOUTH_TN_COAST', incois_zone_code: 'TN_PALK' },
  { id: 'TN-04', name_en: 'North Tamil Nadu / Chennai-Puducherry', name_ta: 'வட தமிழ்நாடு / சென்னை-புதுச்செரி', name_ml: 'വടക്ക് തമിഴ്നാട് / ചെന്നൈ-പുതുച്ചേരി', name_te: 'ఉత్తర తమిళనాడు / చెన్నై-పుదucherry', name_or: 'ଉତ୍ତର ତାମିଲନାଡୁ / ଚେନ୍ନାଇ-ପୁଦୁଚେରୀ', centroid_lat: 12.9, centroid_lon: 80.2, coastal_state: 'Tamil Nadu', primary_language: 'ta', imd_zone_code: 'NORTH_TN_COAST', incois_zone_code: 'TN_N_COAST' },
  { id: 'KL-01', name_en: 'Lakshadweep Sea / Thiruvananthapuram', name_ta: 'லக্ষத்வீப் கடல் / திருவனந்தபுரம்', name_ml: 'ലക്ഷദ്വീപ് കടല്‍ / തിരുവനന്തപുരം', name_te: 'लक्षद्वीप समुद्र / तिरुवनन्तपुरम', name_or: 'ଲକ୍ଷଦ୍ବୀପ ସମୁଦ୍ର / ତିରୁବନନ୍ତପୁରମ', centroid_lat: 8.3, centroid_lon: 76.9, coastal_state: 'Kerala', primary_language: 'ml', imd_zone_code: 'KERALA_COAST', incois_zone_code: 'KL_LAKSHADWEEP' },
  { id: 'KL-02', name_en: 'Kerala coast central / Kochi', name_ta: 'மத்திய கேரள கடல் / கொச்சி', name_ml: 'കേരള തീരം മധ്യഭാഗം / കൊച്ചി', name_te: 'కేరళ తీరం మధ్య / Kochi', name_or: 'କେରଳ ତୀର ମଧ୍ୟ / କୋଚି', centroid_lat: 9.9, centroid_lon: 76.2, coastal_state: 'Kerala', primary_language: 'ml', imd_zone_code: 'KERALA_COAST', incois_zone_code: 'KL_CENTRAL' },
  { id: 'KL-03', name_en: 'North Kerala / Kozhikode', name_ta: 'வட கேரளா / கோழிக்கோடு', name_ml: 'വടക്കന്‍ കേരളം / കോഴിക്കോട്', name_te: 'ఉత్తర కేరళ / Kozhikode', name_or: 'ଉତ୍ତର କେରଳ / କୋଜିକୋଡେ', centroid_lat: 11.2, centroid_lon: 75.7, coastal_state: 'Kerala', primary_language: 'ml', imd_zone_code: 'NORTH_KERALA_COAST', incois_zone_code: 'KL_NORTH' },
  { id: 'AP-01', name_en: 'South Andhra / Krishna-Godavari delta', name_ta: 'தெ ஆந்திரா / கிருஷ்ணா-கோதாவரி', name_ml: 'ദക്ഷിണ ആന്ധ്ര / കൃഷ്ണ-ഗോദാവരി', name_te: 'దక్షిణ ఆంధ్ర / కృష్ణ-గుండావరి', name_or: 'ଦକ୍ଷିଣ ଆନ୍ଧ୍ର / କୃଷ୍ଣ-ଗୋଦାବରୀ', centroid_lat: 16.5, centroid_lon: 81.5, coastal_state: 'Andhra Pradesh', primary_language: 'te', imd_zone_code: 'SOUTH_AP_COAST', incois_zone_code: 'AP_SOUTH' },
  { id: 'AP-02', name_en: 'North Andhra / Visakhapatnam', name_ta: 'வட ஆந்திரா / விசாகப்பட்டினம்', name_ml: 'വടക്കന്‍ ആന്ധ്ര / വിശാഖപട്ടണം', name_te: 'ఉత్తర ఆంధ్ర / విశాఖapatnam', name_or: 'ଉତ୍ତର ଆନ୍ଧ୍ର / ବିଶାଖପଟ୍ଟିନାମ', centroid_lat: 17.7, centroid_lon: 83.3, coastal_state: 'Andhra Pradesh', primary_language: 'te', imd_zone_code: 'NORTH_AP_COAST', incois_zone_code: 'AP_NORTH' },
  { id: 'OD-01', name_en: 'South Odisha coast / Gopalpur', name_ta: 'தென் ஒடிசா கடல் / கோபல்பூர்', name_ml: 'തെക്കന്‍ ഒഡിഷക്കടല്‍ / ഗോപാല്‍പുര്‍', name_te: 'దక్షిణ ఒడిషా / గోపల్‌পుర్', name_or: 'ଦକ୍ଷିଣ ଓଡ଼ିଶା ତୀର / ଗୋପାଲପୁର', centroid_lat: 19.2, centroid_lon: 84.8, coastal_state: 'Odisha', primary_language: 'or', imd_zone_code: 'SOUTH_ODISHA_COAST', incois_zone_code: 'OD_SOUTH' },
  { id: 'OD-02', name_en: 'North Odisha coast / Paradip', name_ta: 'வட ஒடிசா கடல் / பரதீப்', name_ml: 'വടക്കന്‍ ഒഡിഷക്കടല്‍ / പരദീപ്', name_te: 'ఉత్తర ఒడిషా / Paradip', name_or: 'ଉତ୍ତର ଓଡ଼ିଶା ତୀର / ପରଦୀପ', centroid_lat: 20.3, centroid_lon: 86.6, coastal_state: 'Odisha', primary_language: 'or', imd_zone_code: 'NORTH_ODISHA_COAST', incois_zone_code: 'OD_NORTH' },
];

export type BoatClass = 'A' | 'B' | 'C';

export type Language = 'ta' | 'ml' | 'te' | 'or' | 'en';

export interface UserPreferences {
  zone_id: string;
  boat_class: BoatClass;
  language: Language;
  notifications_enabled: boolean;
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
  morning_alert_time: string;
}

export const defaultPreferences: UserPreferences = {
  zone_id: 'TN-01',
  boat_class: 'A',
  language: 'ta',
  notifications_enabled: true,
  whatsapp_enabled: true,
  sms_enabled: false,
  morning_alert_time: '05:00',
};

export const BOAT_CLASSES = {
  A: { name_en: 'Small (vallam/catamaran)', max_wave_height: 1.0, max_wind_speed: 28, max_wind_gust: 35, min_visibility: 3, max_swell_height: 0.8 },
  B: { name_en: 'Medium (country craft)', max_wave_height: 2.0, max_wind_speed: 40, max_wind_gust: 50, min_visibility: 2, max_swell_height: 1.5 },
  C: { name_en: 'Large (trawler/mechanized)', max_wave_height: 3.5, max_wind_speed: 55, max_wind_gust: 65, min_visibility: 1, max_swell_height: 2.5 },
};

export const LANGUAGES = [
  { code: 'ta', name: 'தமிழ்', name_en: 'Tamil' },
  { code: 'ml', name: 'മലയാളം', name_en: 'Malayalam' },
  { code: 'te', name: 'తెలుగు', name_en: 'Telugu' },
  { code: 'or', name: 'ଓଡ଼ିଶା', name_en: 'Odia' },
  { code: 'en', name: 'English', name_en: 'English' },
];

export const BOAT_TYPES = [
  { id: 'A', name_en: 'Small (vallam/catamaran)', name_ta: 'சிறிய படகு', name_ml: 'ചെറിയ വള്ളം', name_te: '.small boat', name_or: 'ଛୋଟା ନାଆ' },
  { id: 'B', name_en: 'Medium (country craft)', name_ta: 'மத்திய படகு', name_ml: 'മധ്യത്തിലെ വള്ളം', name_te: 'medium boat', name_or: 'ମଧ୍ଯମ ନାଆ' },
  { id: 'C', name_en: 'Large (trawler/mechanized)', name_ta: 'பெரிய படகு', name_ml: 'വലിയ വള്ളം', name_te: 'large boat', name_or: 'ବଡ଼ ନାଆ' },
];

export const getZoneById = (id: string): Zone | undefined => {
  return fishingZones.find((zone) => zone.id === id);
};

export const findNearestZone = (lat: number, lon: number): Zone => {
  let minDistance = Infinity;
  let nearestZone = fishingZones[0];
  for (const zone of fishingZones) {
    const distance = Math.sqrt(
      Math.pow(zone.centroid_lat - lat, 2) + Math.pow(zone.centroid_lon - lon, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestZone = zone;
    }
  }
  return nearestZone;
};

export const defaultZone = fishingZones[0];