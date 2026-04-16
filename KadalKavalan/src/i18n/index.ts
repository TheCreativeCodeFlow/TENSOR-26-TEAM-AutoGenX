// i18n translations for Kadal Kavalan
// Supports: Tamil (ta), Malayalam (ml), Telugu (te), Odia (or), English (en)

export type Language = 'ta' | 'ml' | 'te' | 'or' | 'en';

export interface Translations {
  // App branding
  app_name: string;
  app_tagline: string;
  
  // Risk levels
  risk_safe: string;
  risk_advisory: string;
  risk_danger: string;
  risk_cyclone: string;
  
  // Dashboard
  go_label: string;
  no_go_label: string;
  safe_window: string;
  no_safe_window: string;
  tomorrow_window: string;
  
  // Weather parameters
  wave_height: string;
  wind_speed: string;
  wind_gust: string;
  visibility: string;
  swell_height: string;
  tide: string;
  
  // Boat types
  boat_class_a: string;
  boat_class_b: string;
  boat_class_c: string;
  
  // Location
  current_location: string;
  fishing_zones: string;
  select_zone: string;
  use_gps_location: string;
  
  // Alerts
  official_alerts: string;
  community_reports: string;
  submit_report: string;
  sea_conditions: string;
  
  // Voice
  listen_alert: string;
  stop_reading: string;
  
  // Settings
  settings: string;
  language: string;
  notifications: string;
  whatsapp_alerts: string;
  sms_alerts: string;
  push_alerts: string;
  emergency: string;
  coast_guard: string;
  
  // Onboarding
  welcome: string;
  select_language: string;
  select_boat_type: string;
  get_started: string;
  next: string;
  back: string;
  
  // Data status
  data_from: string;
  no_internet: string;
  using_cached: string;
  offline_mode: string;
  
  // Errors
  error_loading: string;
  try_again: string;
  location_permission: string;
  
  // Validation
  upvote: string;
  downvote: string;
  hours_ago: string;
}

const ta: Translations = {
  app_name: 'கடல் காவலன்',
  app_tagline: 'கடல் பாதுகாப்பு ஆலோசனை',
  risk_safe: 'பாதுகாப்பானது',
  risk_advisory: 'எச்சரிக்கை',
  risk_danger: 'ஆபத்து',
  risk_cyclone: 'சூறாவளி எச்சரிக்கை',
  go_label: 'கடலுக்கு செல்லலாம்',
  no_go_label: 'கடலுக்கு செல்லாதீர்கள்',
  safe_window: 'பாதுகாப்பான நேரம்: {start} - {end}',
  no_safe_window: 'இன்று பாதுகாப்பான நேரம் இல்லை',
  tomorrow_window: 'நாளை: {start} - {end}',
  wave_height: 'அலை உயரம்: {value}m',
  wind_speed: 'காற்று வேகம்: {value} கிமீ/மணி',
  wind_gust: 'காற்று துரிதம்: {value} கிமீ/மணி',
  visibility: 'தெளிவு: {value} கிமீ',
  swell_height: 'அலையின் உயரம்: {value}m',
  tide: 'இரு நீரோட்டம்',
  boat_class_a: 'சிறிய படகு (வல்லம்)',
  boat_class_b: 'மிதவை படகு',
  boat_class_c: 'பெரிய படகு (டிராவ்லர்)',
  current_location: 'தற்போதைய இடம்',
  fishing_zones: 'மீன்பிடி பகுதிகள்',
  select_zone: 'உங்கள் மீன்பிடி பகுதியைத் தேர்ந்தெடுக்கவும்',
  use_gps_location: 'என் இடத்தைப் பயன்படுத்தவும்',
  official_alert: 'அதிகாரப்பூர்வ எச்சரிக்கைகள்',
  community_reports: 'சமூக அறிக்கைகள்',
  submit_report: 'அறிக்கை அனுப்பவும்',
  sea_conditions: 'கடல் நிலை',
  listen_alert: 'கவனமாகக் கேட்கவும்',
  stop_reading: 'நிறுத்தவும்',
  settings: 'அமைப்புகள்',
  language: 'மொழி',
  notifications: 'அறிவிப்புகள்',
  whatsapp_alerts: 'வாட்ஸ்அப்',
  sms_alerts: 'எஸ்எம்எஸ்',
  push_alerts: 'புஷ்',
  emergency: 'அவசரநிலை',
  coast_guard: 'கடலோரப் பாதுகாப்பு: 1554',
  welcome: 'கடல் காவலனுக்கு வரவேற்கிறோம்',
  select_language: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
  select_boat_type: 'உங்கள் படகு வகையைத் தேர்ந்தெடுக்கவும்',
  get_started: 'தொடங்கவும்',
  next: 'அடுத்தது',
  back: 'முன்',
  data_from: 'தரவு: {time}',
  no_internet: 'இணைப்பு இல்லை',
  using_cached: 'முன் சேமித்த தரவு',
  offline_mode: 'ஆஃப்லைன் முறை',
  error_loading: 'தரவு ஏற்கப்படவில்லை',
  try_again: 'மீண்டும் முயற்சிக்கவும்',
  location_permission: 'இடம் அனுமதி தேவை',
  upvote: 'ஆமோட்',
  downvote: 'எதிர்',
  hours_ago: '{hours} மணி நேரம் முன்',
};

const ml: Translations = {
  app_name: 'കടൽ കാവൽ',
  app_tagline: 'കടൽ സുരക്ഷാ ഉപദേശം',
  risk_safe: 'സുരക്ഷിതമാണ്',
  risk_advisory: 'മുന്നറിയിപ്പ്',
  risk_danger: 'അപകടം',
  risk_cyclone: 'ചുഴല്ലി മുന്നറിയിപ്പ്',
  go_label: 'കടലിലേക്ക് പോകാം',
  no_go_label: 'കടലിലേക്ക് പോകരുത്',
  safe_window: 'സുരക്ഷിത സമയം: {start} - {end}',
  no_safe_window: 'ഇന്ന് സുരക്ഷിത സമയമില്ല',
  tomorrow_window: 'നാളെ: {start} - {end}',
  wave_height: 'തിരമാലയുടെ ഉയരം: {value}m',
  wind_speed: 'കാറിന്റെ വേഗം: {value} കിമി/മണി',
  wind_gust: 'കാറിന്റെ തീവ്രത: {value} കിമി/മണി',
  visibility: 'ദൃശ്യത: {value} കിമി',
  swell_height: 'സമുദ്ര തിരമാല: {value}m',
  tide: 'വേലിക്കടല്',
  boat_class_a: 'ചെറിയ വള്ളം',
  boat_class_b: 'ഇടത്തരം വള്ളം',
  boat_class_c: 'വലിയ ബോട്ട്',
  current_location: 'നിലവിലെ സ്ഥാനം',
  fishing_zones: 'മീന് പിടിക്കുന്ന മേഖലകള്‍',
  select_zone: 'നിങ്ങളുടെ മീന് പിടിക്കുന്ന മേഖല തിരഞ്ഞെടുക്കുക',
  use_gps_location: 'എന്റെ സ്ഥാനം ഉപയോഗിക്കുക',
  official_alert: 'ഔദ്യോഗിക മുന്നറിയിപ്പുകള്‍',
  community_reports: 'സമൂഹ റിപ്പോര്‍ട്ടുകള്‍',
  submit_report: 'റിപ്പോര്‍ട്ട് സമര്‍പ്പിക്കുക',
  sea_conditions: 'കടലിന്റെ അവസ്ഥ',
  listen_alert: 'ശബരിക്കാന്‍ കേട്ടോട്ടം',
  stop_reading: 'നിര്‍ത്തുക',
  settings: 'ക്രമീകരണങ്ങള്‍',
  language: 'ഭാഷ',
  notifications: 'അറിയിപ്പുകള്‍',
  whatsapp_alerts: 'വാട്സപ്പ്',
  sms_alerts: 'എസ്എംഎ���്',
  push_alerts: 'പുഷ്',
  emergency: 'അടിയന്തരാവസ്ഥ',
  coast_guard: 'തീരസേന: 1554',
  welcome: 'കടൽ കാവലിലേക്ക് സ്വാഗതം',
  select_language: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക',
  select_boat_type: 'നിങ്ങളുടെ ബോട്ട് തരം തിരഞ്ഞെടുക്കുക',
  get_started: 'ആരംഭിക്കുക',
  next: 'അടുത്തത്',
  back: 'മുന്‍പ്',
  data_from: 'ഡാറ്റ: {time}',
  no_internet: 'ഇന്റര്‍നെറ്റ് ഇല്ല',
  using_cached: 'കാഷേഡ് ഡാറ്റ ഉപയോഗിക്കുന്നു',
  offline_mode: 'ഓഫ്‌ലൈന്‍ മോഡ്',
  error_loading: 'ലോഡ് ചെയ്യാനായില്ല',
  try_again: 'വീണ്ടും ശ്രമിക്കുക',
  location_permission: 'സ്ഥാന അനുമതി ആവശ്യമാണ്',
  upvote: 'അനുമതി',
  downvote: 'എതിര്‍',
  hours_ago: '{hours} മണിക്കാല്‍ മുമ്പ്',
};

const te: Translations = {
  app_name: 'కదల్ कावలన्',
  app_tagline: 'సముద్రం భద్రత/sense',
  risk_safe: 'భద్రం',
  risk_advisory: 'హెచ్చరిక',
  risk_danger: 'అపాయం',
  risk_cyclone: 'తుఫాను హెచ్చరిక',
  go_label: 'చదలిపోకు',
  no_go_label: 'చదలకు',
  safe_window: 'భద्र समయ: {start} - {end}',
  no_safe_window: 'आज भद्र समञ्चले',
  tomorrow_window: 'ఉన్నాడు: {start} - {end}',
  wave_height: 'తరంగం ఎత్తు: {value}m',
  wind_speed: 'కఱ्ह скорост: {value} km/h',
  wind_gust: '风 gust: {value} km/h',
  visibility: 'दृश्यता: {value} km',
  swell_height: 'Swell ఎత్తు: {value}m',
  tide: 'उబలा',
  boat_class_a: 'Small boat (vallam)',
  boat_class_b: 'Country craft',
  boat_class_c: 'Trawler',
  current_location: '_present location',
  fishing_zones: 'fishing zones',
  select_zone: 'Your zone selection',
  use_gps_location: 'Use GPS',
  official_alerts: 'official alerts',
  community_reports: 'community reports',
  submit_report: 'Submit report',
  sea_conditions: 'Sea conditions',
  listen_alert: 'Listen',
  stop_reading: 'Stop',
  settings: 'Settings',
  language: 'Language',
  notifications: 'Notifications',
  whatsapp_alerts: 'WhatsApp',
  sms_alerts: 'SMS',
  push_alerts: 'Push',
  emergency: 'Emergency',
  coast_guard: 'Coast Guard: 1554',
  welcome: 'Welcome to Kadal Kavalan',
  select_language: 'Select language',
  select_boat_type: 'select boat type',
  get_started: 'Get Started',
  next: 'Next',
  back: 'Back',
  data_from: 'Data from {time}',
  no_internet: 'No internet',
  using_cached: 'Cached data',
  offline_mode: 'Offline mode',
  error_loading: 'Error loading',
  try_again: 'Try again',
  location_permission: 'Location permission',
  upvote: 'Upvote',
  downvote: 'Downvote',
  hours_ago: '{hours}h ago',
};

const or: Translations = {
  app_name: 'କଦଲ କାଵଲନ୍',
  app_tagline: 'ସମୁଦ୍ର ସୁରକ୍ଷା ପରାମର୍ଶ',
  risk_safe: 'ସୁରକ୍ଷିତ',
  risk_advisory: 'ଚେତାଵନ୍',
  risk_danger: 'ବିପଦ',
  risk_cyclone: 'ବିଂଶାଣୀ ଚେତାଵନ୍',
  go_label: 'ଯାଇପାରିବ',
  no_go_label: 'ଯାଇନୁବ',
  safe_window: 'ସୁରକ୍ଷିତ ସମୟ: {start} - {end}',
  no_safe_window: 'ଆଜ କୌଣୀ ସୁରକ୍ଷିତ ସମୟ ନା',
  tomorrow_window: 'କାଲି: {start} - {end}',
  wave_height: 'ଲେଣା ଉଚତ: {value}m',
  wind_speed: 'ପବନ ଗତି: {value} km/h',
  wind_gust: 'ପବନ ଝୁମ: {value} km/h',
  visibility: 'ଦୃଶ୍ଯତା: {value} km',
  swell_height: 'ସାଲ ଉଚତ: {value}m',
  tide: 'ଜୁଆର',
  boat_class_a: 'ଛୋଟ ନାକ',
  boat_class_b: 'country craft',
  boat_class_c: 'trawler',
  current_location: 'ବର୍ତ୍ମାନ ସ୍ଥାନ',
  fishing_zones: 'ମାଛି ଧରା ଅଞ୍ଚ',
  select_zone: 'select zone',
  use_gps_location: 'use GPS',
  official_alerts: 'official alerts',
  community_reports: 'community reports',
  submit_report: 'submit',
  sea_conditions: 'sea conditions',
  listen_alert: 'listen',
  stop_reading: 'stop',
  settings: 'settings',
  language: 'language',
  notifications: 'notifications',
  whatsapp_alerts: 'WhatsApp',
  sms_alerts: 'SMS',
  push_alerts: 'Push',
  emergency: 'Emergency',
  coast_guard: 'Coast Guard: 1554',
  welcome: 'Welcome',
  select_language: 'Select language',
  select_boat_type: 'select boat type',
  get_started: 'Get Started',
  next: 'Next',
  back: 'Back',
  data_from: 'Data: {time}',
  no_internet: 'No internet',
  using_cached: 'Cached',
  offline_mode: 'Offline',
  error_loading: 'error',
  try_again: 'try',
  location_permission: 'permission',
  upvote: 'upvote',
  downvote: 'down',
  hours_ago: '{hours}h ago',
};

const en: Translations = {
  app_name: 'Kadal Kavalan',
  app_tagline: 'Sea Guardian',
  risk_safe: 'Safe',
  risk_advisory: 'Caution',
  risk_danger: 'Danger',
  risk_cyclone: 'Cyclone Warning',
  go_label: 'Safe to go out',
  no_go_label: 'Do not go out',
  safe_window: 'Safe window: {start} - {end}',
  no_safe_window: 'No safe window today',
  tomorrow_window: 'Tomorrow: {start} - {end}',
  wave_height: 'Wave: {value}m',
  wind_speed: 'Wind: {value} km/h',
  wind_gust: 'Gusts: {value} km/h',
  visibility: 'Visibility: {value} km',
  swell_height: 'Swell: {value}m',
  tide: 'Tide',
  boat_class_a: 'Small (vallam)',
  boat_class_b: 'Medium (country craft)',
  boat_class_c: 'Large (trawler)',
  current_location: 'Current Location',
  fishing_zones: 'Fishing Zones',
  select_zone: 'Select your fishing zone',
  use_gps_location: 'Use My Location',
  official_alerts: 'Official Alerts',
  community_reports: 'Community Reports',
  submit_report: 'Submit Report',
  sea_conditions: 'Sea Conditions',
  listen_alert: 'Listen',
  stop_reading: 'Stop',
  settings: 'Settings',
  language: 'Language',
  notifications: 'Notifications',
  whatsapp_alerts: 'WhatsApp',
  sms_alerts: 'SMS',
  push_alerts: 'Push',
  emergency: 'Emergency',
  coast_guard: 'Coast Guard: 1554',
  welcome: 'Welcome to Kadal Kavalan',
  select_language: 'Select your language',
  select_boat_type: 'Select your boat type',
  get_started: 'Get Started',
  next: 'Next',
  back: 'Back',
  data_from: 'Data from {time}',
  no_internet: 'No internet',
  using_cached: 'Using cached data',
  offline_mode: 'Offline mode',
  error_loading: 'Error loading data',
  try_again: 'Try again',
  location_permission: 'Location permission needed',
  upvote: 'Agree',
  downvote: 'Disagree',
  hours_ago: '{hours}h ago',
};

export const translations: Record<Language, Translations> = {
  ta,
  ml,
  te,
  or,
  en,
};

export const languageNames: Record<Language, string> = {
  ta: 'தமிழ்',
  ml: 'മലയാളം',
  te: 'తెలుగు',
  or: 'ଓଡିଆ',
  en: 'English',
};

export const getLanguageFromCode = (code: string): Language => {
  const lang = code.split('-')[0] as Language;
  return translations[lang] ? lang : 'en';
};