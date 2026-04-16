import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useUser } from '../context/UserContext';
import { fishingZones, FishingZone } from '../data/zones';
import { fetchAllZonesWeather, calculateRiskScore, MarineWeatherData } from '../services/marineWeather';
import * as Speech from 'expo-speech';

const INITIAL_REGION = {
  latitude: 12.5,
  longitude: 80.0,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

const googleMapsApiKey =
  Constants.expoConfig?.android?.config?.googleMaps?.apiKey?.trim() ?? '';
const hasGoogleMapsApiKey = googleMapsApiKey.length > 0;
const useWebMapFallback = !hasGoogleMapsApiKey;

// Color palette for risk levels
const COLORS = {
  SAFE: '#2D6A4F',
  ADVISORY: '#F77F00', 
  DANGER: '#D62828',
};

interface WebZoneDatum {
  id: string;
  name: string;
  coastal_state: string;
  lat: number;
  lon: number;
  wave_height: number;
  wind_speed: number;
  risk: number;
  color: string;
}

const NauticalMapScreen: React.FC = () => {
  const { language, boatClass } = useUser();
  const mapRef = useRef<MapView>(null);
  const webMapRef = useRef<WebView>(null);
  
  const [selectedZone, setSelectedZone] = useState<FishingZone | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain'>('standard');
  const [showWaves, setShowWaves] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [zoneWeather, setZoneWeather] = useState<Map<string, MarineWeatherData>>(new Map());
  const [loading, setLoading] = useState(true);

  console.log('[Map] Render, zones:', zoneWeather.size);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    console.log('[Map] init called');
    await getLocation();
    await fetchWeather();
    setLoading(false);
    console.log('[Map] init done');
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        console.log('[Map] Location:', loc.coords.latitude, loc.coords.longitude);
      }
    } catch (e) {
      console.log('[Map] Location error:', e);
    }
  };

  const fetchWeather = async () => {
    console.log('[Map] Fetching weather');
    try {
      const weather = await fetchAllZonesWeather();
      setZoneWeather(weather);
      console.log('[Map] Weather fetched:', weather.size);
    } catch (e) {
      console.log('[Map] Weather error:', e);
    }
  };

  const speakZoneWeather = (z: FishingZone) => {
    const w = zoneWeather.get(z.id);
    const risk = w ? calculateRiskScore(w, boatClass) : 0;
    const level = risk >= 55 ? 'Danger' : risk >= 30 ? 'Caution' : 'Safe';
    const langMap: Record<string, string> = { ta: 'ta-IN', ml: 'ml-IN', te: 'te-IN', or: 'or-IN', en: 'en-IN' };
    const lang = langMap[language] || 'en-IN';
    Speech.speak(`${z.name_en}: ${level}. Wave ${w?.wave_height?.toFixed(1) || '0'} m. Wind ${w?.wind_speed?.toFixed(0) || '0'} km/h.`, { language: lang, rate: 0.85 });
  };

  const focusZoneOnMap = (z: FishingZone) => {
    if (useWebMapFallback) {
      webMapRef.current?.injectJavaScript(`window.focusZone(${z.centroid_lat}, ${z.centroid_lon}); true;`);
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: z.centroid_lat,
        longitude: z.centroid_lon,
        latitudeDelta: 2,
        longitudeDelta: 2,
      },
      500
    );
  };

  const handleZonePress = (z: FishingZone) => {
    setSelectedZone(z);
    focusZoneOnMap(z);
    speakZoneWeather(z);
  };

  const getZoneRiskColor = (z: FishingZone): string => {
    const w = zoneWeather.get(z.id);
    const risk = w ? calculateRiskScore(w, boatClass) : 0;
    if (risk >= 55) return COLORS.DANGER;
    if (risk >= 30) return COLORS.ADVISORY;
    return COLORS.SAFE;
  };

  const getWaveColorForZone = (z: FishingZone): string => {
    const w = zoneWeather.get(z.id);
    const wave = w?.wave_height || 0;
    if (wave < 0.5) return 'rgba(45, 106, 79, 0.7)';
    if (wave < 1.0) return 'rgba(118, 168, 132, 0.7)';
    if (wave < 1.5) return 'rgba(247, 127, 0, 0.7)';
    if (wave < 2.5) return 'rgba(214, 40, 40, 0.7)';
    return 'rgba(123, 45, 139, 0.8)';
  };

  const webZoneData: WebZoneDatum[] = useMemo(() => {
    return fishingZones.map((z) => {
      const w = zoneWeather.get(z.id);
      const risk = w ? calculateRiskScore(w, boatClass) : 0;

      return {
        id: z.id,
        name: z.name_en,
        coastal_state: z.coastal_state,
        lat: z.centroid_lat,
        lon: z.centroid_lon,
        wave_height: Number((w?.wave_height || 0).toFixed(1)),
        wind_speed: Math.round(w?.wind_speed || 0),
        risk,
        color: showWaves ? getWaveColorForZone(z) : getZoneRiskColor(z),
      };
    });
  }, [zoneWeather, boatClass, showWaves]);

  const leafletHtml = useMemo(() => {
    const zonePayload = JSON.stringify(webZoneData);
    const userPayload = JSON.stringify(userLocation);
    const initialPayload = JSON.stringify(INITIAL_REGION);

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    <style>
      html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #d8ecf3; }
      .leaflet-container { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
      const zones = ${zonePayload};
      const userLocation = ${userPayload};
      const initial = ${initialPayload};

      const postMessageToReact = (message) => {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        }
      };

      const map = L.map('map', { zoomControl: true }).setView([initial.latitude, initial.longitude], 6);

      const tileProviders = [
        {
          name: 'osm',
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors',
        },
        {
          name: 'carto',
          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        },
      ];

      let providerIndex = 0;
      let switchedProvider = false;

      const createTileLayer = (provider) => {
        return L.tileLayer(provider.url, {
          maxZoom: 19,
          attribution: provider.attribution,
        });
      };

      let baseLayer = createTileLayer(tileProviders[providerIndex]);
      baseLayer.addTo(map);

      baseLayer.on('tileerror', () => {
        if (switchedProvider) {
          return;
        }

        switchedProvider = true;
        map.removeLayer(baseLayer);
        providerIndex = 1;
        baseLayer = createTileLayer(tileProviders[providerIndex]);
        baseLayer.addTo(map);
        postMessageToReact({ type: 'tile-provider', provider: tileProviders[providerIndex].name });
      });

      zones.forEach((z) => {
        const radius = 25000;
        const circle = L.circle([z.lat, z.lon], {
          radius,
          color: z.color,
          fillColor: z.color,
          fillOpacity: 0.35,
          weight: 2,
        }).addTo(map);

        const marker = L.marker([z.lat, z.lon]).addTo(map);
        marker.bindPopup(
          '<b>' + z.id + '</b><br/>' +
          z.name + '<br/>' +
          'Wave: ' + z.wave_height + 'm<br/>' +
          'Wind: ' + z.wind_speed + 'km/h'
        );

        const onZoneSelect = () => postMessageToReact({ type: 'zone-click', zoneId: z.id });
        marker.on('click', onZoneSelect);
        circle.on('click', onZoneSelect);
      });

      if (userLocation && userLocation.latitude && userLocation.longitude) {
        L.circleMarker([userLocation.latitude, userLocation.longitude], {
          radius: 7,
          color: '#1d4ed8',
          fillColor: '#60a5fa',
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(map).bindPopup('Your Location');
      }

      window.focusZone = (lat, lon) => {
        map.flyTo([lat, lon], 8, { duration: 0.8 });
      };

      window.resetView = () => {
        map.flyTo([initial.latitude, initial.longitude], 6, { duration: 0.7 });
      };
    </script>
  </body>
</html>`;
  }, [webZoneData, userLocation]);

  const handleWebMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data || '{}') as {
        type?: string;
        zoneId?: string;
      };

      if (payload.type !== 'zone-click' || !payload.zoneId) {
        return;
      }

      const zone = fishingZones.find((z) => z.id === payload.zoneId);
      if (!zone) {
        return;
      }

      setSelectedZone(zone);
      speakZoneWeather(zone);
    } catch (error) {
      console.log('[Map] Failed to parse WebView message', error);
    }
  };

  // Build zone markers
  const renderZoneMarkers = () => {
    return fishingZones.map(z => {
      const w = zoneWeather.get(z.id);
      const risk = w ? calculateRiskScore(w, boatClass) : 0;
      const isSelected = selectedZone?.id === z.id;
      
      return (
        <Marker
          key={z.id}
          coordinate={{ latitude: z.centroid_lat, longitude: z.centroid_lon }}
          onPress={() => handleZonePress(z)}
          title={z.id}
          description={`${z.coastal_state} • Wave: ${w?.wave_height?.toFixed(1) || '?'}m • Wind: ${w?.wind_speed?.toFixed(0) || '?'}km/h`}
          pinColor={isSelected ? 'red' : risk >= 55 ? 'red' : risk >= 30 ? 'orange' : 'green'}
        />
      );
    });
  };

  // Build risk circles (heatmap)
  const renderRiskCircles = () => {
    if (showWaves) {
      return fishingZones.map(z => (
        <Circle
          key={`wave-${z.id}`}
          center={{ latitude: z.centroid_lat, longitude: z.centroid_lon }}
          radius={30000}
          fillColor={getWaveColorForZone(z)}
          strokeColor={getWaveColorForZone(z)}
          strokeWidth={2}
        />
      ));
    }
    
    return fishingZones.map(z => (
      <Circle
        key={`risk-${z.id}`}
        center={{ latitude: z.centroid_lat, longitude: z.centroid_lon }}
        radius={25000}
        fillColor={getZoneRiskColor(z) + '66'}
        strokeColor={getZoneRiskColor(z)}
        strokeWidth={selectedZone?.id === z.id ? 4 : 2}
      />
    ));
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingTitle}>Loading Sea Conditions...</Text>
        <Text style={styles.loadingSub}>Fetching real-time data from Open-Meteo</Text>
        <Text style={styles.loadingData}>
          {fishingZones.slice(0,3).map(z => {
            const w = zoneWeather.get(z.id);
            return `${z.id}:${w?.wave_height?.toFixed(1)||'?'}m/${w?.wind_speed?.toFixed(0)||'?'}km`;
          }).join(' ')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Kadal Kavalan - Sea Safety Map</Text>
        <Text style={styles.headerSub}>
          Real-time wave & wind conditions for {fishingZones.length} zones
        </Text>
        {useWebMapFallback && (
          <Text style={styles.headerWarning}>
            Using Leaflet + OpenStreetMap fallback (no Google Maps key required).
          </Text>
        )}
      </View>

      {/* Map */}
      {useWebMapFallback ? (
        <WebView
          ref={webMapRef}
          originWhitelist={['*']}
          source={{ html: leafletHtml }}
          style={styles.map}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleWebMessage}
        />
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={INITIAL_REGION}
          mapType={mapType}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          showsBuildings
          showsTraffic
          showsIndoors
        >
          {renderRiskCircles()}
          {renderZoneMarkers()}

          {/* User location marker */}
          {userLocation && <Marker coordinate={userLocation} title="Your Location" pinColor="blue" />}
        </MapView>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, useWebMapFallback && styles.controlBtnDisabled]}
          onPress={() => {
            if (useWebMapFallback) return;
            setMapType((m) => (m === 'standard' ? 'satellite' : 'standard'));
          }}
        >
          <Text style={styles.controlIcon}>🛰️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlBtn, showWaves && styles.controlBtnActive]} 
          onPress={() => setShowWaves(!showWaves)}
        >
          <Text style={styles.controlIcon}>🌊</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlBtn} onPress={getLocation}>
          <Text style={styles.controlIcon}>📍</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlBtn} 
          onPress={() => {
            if (useWebMapFallback) {
              webMapRef.current?.injectJavaScript('window.resetView(); true;');
              return;
            }

            mapRef.current?.animateToRegion(INITIAL_REGION, 500);
          }}
        >
          <Text style={styles.controlIcon}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.SAFE }]} />
          <Text style={styles.legendText}>Safe</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.ADVISORY }]} />
          <Text style={styles.legendText}>Advisory</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.DANGER }]} />
          <Text style={styles.legendText}>Danger</Text>
        </View>
      </View>

      {/* Selected Zone Info */}
      {selectedZone && (
        <View style={styles.popup}>
          <View style={styles.popupHeader}>
            <Text style={styles.popupTitle}>{selectedZone.id}</Text>
            <Text style={styles.popupName}>{selectedZone.name_en}</Text>
            <Text style={styles.popupState}>{selectedZone.coastal_state}</Text>
          </View>
          {(() => {
            const w = zoneWeather.get(selectedZone.id);
            const risk = w ? calculateRiskScore(w, boatClass) : 0;
            const level = risk >= 55 ? '🔴 DANGER' : risk >= 30 ? '🟠 ADVISORY' : '🟢 SAFE';
            const color = risk >= 55 ? COLORS.DANGER : risk >= 30 ? COLORS.ADVISORY : COLORS.SAFE;
            
            return (
              <View style={styles.popupContent}>
                <View style={styles.popupRow}>
                  <Text style={styles.popupLabel}>🌊 Wave</Text>
                  <Text style={styles.popupValue}>{w?.wave_height?.toFixed(1) || '?'}m</Text>
                </View>
                <View style={styles.popupRow}>
                  <Text style={styles.popupLabel}>💨 Wind</Text>
                  <Text style={styles.popupValue}>{w?.wind_speed?.toFixed(0) || '?'}km/h</Text>
                </View>
                <View style={styles.popupRow}>
                  <Text style={styles.popupLabel}>⚠️ Risk</Text>
                  <Text style={[styles.popupValue, { color }]}>{level}</Text>
                </View>
              </View>
            );
          })()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcf9f8' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B4F6C' },
  loadingTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  loadingSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  loadingData: { fontSize: 10, color: '#0f0', marginTop: 20, fontFamily: 'monospace' },
  
  header: { backgroundColor: '#0B4F6C', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  headerWarning: { fontSize: 11, color: '#d5ecff', marginTop: 4 },
  
  map: { flex: 1 },
  
  controls: {
    position: 'absolute',
    top: 110,
    right: 12,
    gap: 8,
  },
  controlBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  controlBtnDisabled: {
    opacity: 0.45,
  },
  controlBtnActive: { backgroundColor: '#0B4F6C' },
  controlIcon: { fontSize: 20 },
  
  legend: {
    position: 'absolute',
    top: 110,
    left: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { fontSize: 11, color: '#333' },
  
  popup: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  popupTitle: { fontSize: 18, fontWeight: 'bold', color: '#0B4F6C' },
  popupName: { fontSize: 14, color: '#333', flex: 1, marginLeft: 8 },
  popupState: { fontSize: 12, color: '#888' },
  popupContent: { flexDirection: 'row', justifyContent: 'space-around' },
  popupRow: { alignItems: 'center' },
  popupLabel: { fontSize: 12, color: '#888' },
  popupValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 4 },
});

export default NauticalMapScreen;