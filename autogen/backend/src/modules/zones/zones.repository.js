import { supabaseRest } from "../shared/supabase-rest.js";

const DEFAULT_ZONES = [
  {
    id: "zone-gujarat-kutch-01",
    name: "Gujarat Kutch Coast",
    state: "Gujarat",
    center: { lat: 22.9, lng: 69.3 },
    polygon: [[23.2, 68.9], [23.3, 69.8], [22.5, 69.9], [22.4, 68.8]],
    maxSafeWaveHeightM: 1.8,
    maxSafeWindKmph: 32,
  },
  {
    id: "zone-gujarat-saurashtra-01",
    name: "Gujarat Saurashtra Coast",
    state: "Gujarat",
    center: { lat: 21.6, lng: 70.3 },
    polygon: [[22.0, 69.8], [22.1, 70.9], [21.2, 71.0], [21.1, 69.9]],
    maxSafeWaveHeightM: 1.8,
    maxSafeWindKmph: 32,
  },
  {
    id: "zone-maharashtra-konkan-north-01",
    name: "Maharashtra North Konkan",
    state: "Maharashtra",
    center: { lat: 19.4, lng: 72.9 },
    polygon: [[19.8, 72.4], [19.9, 73.3], [19.0, 73.4], [18.9, 72.5]],
    maxSafeWaveHeightM: 1.7,
    maxSafeWindKmph: 30,
  },
  {
    id: "zone-maharashtra-konkan-south-01",
    name: "Maharashtra South Konkan",
    state: "Maharashtra",
    center: { lat: 17.1, lng: 73.3 },
    polygon: [[17.6, 72.8], [17.7, 73.8], [16.7, 73.9], [16.6, 72.9]],
    maxSafeWaveHeightM: 1.7,
    maxSafeWindKmph: 30,
  },
  {
    id: "zone-goa-01",
    name: "Goa Coast",
    state: "Goa",
    center: { lat: 15.4, lng: 73.8 },
    polygon: [[15.8, 73.5], [15.8, 74.1], [15.1, 74.1], [15.1, 73.5]],
    maxSafeWaveHeightM: 1.8,
    maxSafeWindKmph: 30,
  },
  {
    id: "zone-karnataka-karwar-01",
    name: "Karnataka Karwar Coast",
    state: "Karnataka",
    center: { lat: 14.9, lng: 74.1 },
    polygon: [[15.4, 73.7], [15.4, 74.5], [14.4, 74.5], [14.4, 73.7]],
    maxSafeWaveHeightM: 2.0,
    maxSafeWindKmph: 34,
  },
  {
    id: "zone-karnataka-mangaluru-01",
    name: "Karnataka Mangaluru Coast",
    state: "Karnataka",
    center: { lat: 12.9, lng: 74.7 },
    polygon: [[13.3, 74.3], [13.4, 75.1], [12.4, 75.1], [12.3, 74.3]],
    maxSafeWaveHeightM: 2.0,
    maxSafeWindKmph: 34,
  },
  {
    id: "zone-kerala-malabar-01",
    name: "Kerala Malabar Coast",
    state: "Kerala",
    center: { lat: 11.6, lng: 75.4 },
    polygon: [[12.2, 74.9], [12.2, 75.9], [11.0, 75.9], [11.0, 74.9]],
    maxSafeWaveHeightM: 2.1,
    maxSafeWindKmph: 36,
  },
  {
    id: "zone-kerala-kochi-01",
    name: "Kerala Kochi Coast",
    state: "Kerala",
    center: { lat: 9.9, lng: 76.2 },
    polygon: [[10.5, 75.7], [10.5, 76.7], [9.3, 76.7], [9.3, 75.7]],
    maxSafeWaveHeightM: 2.1,
    maxSafeWindKmph: 36,
  },
  {
    id: "zone-tamilnadu-chennai-01",
    name: "Tamil Nadu Chennai Coast",
    state: "Tamil Nadu",
    center: { lat: 13.1, lng: 80.3 },
    polygon: [[13.6, 79.8], [13.6, 80.9], [12.7, 80.9], [12.7, 79.8]],
    maxSafeWaveHeightM: 1.7,
    maxSafeWindKmph: 30,
  },
  {
    id: "zone-tamilnadu-nagapattinam-01",
    name: "Tamil Nadu Nagapattinam Coast",
    state: "Tamil Nadu",
    center: { lat: 10.8, lng: 79.9 },
    polygon: [[11.2, 79.4], [11.3, 80.4], [10.4, 80.4], [10.3, 79.4]],
    maxSafeWaveHeightM: 1.6,
    maxSafeWindKmph: 28,
  },
  {
    id: "zone-tamilnadu-kanyakumari-01",
    name: "Tamil Nadu Kanyakumari Coast",
    state: "Tamil Nadu",
    center: { lat: 8.1, lng: 77.5 },
    polygon: [[8.5, 77.0], [8.5, 78.0], [7.7, 78.0], [7.7, 77.0]],
    maxSafeWaveHeightM: 1.9,
    maxSafeWindKmph: 32,
  },
  {
    id: "zone-andhra-visakhapatnam-01",
    name: "Andhra Visakhapatnam Coast",
    state: "Andhra Pradesh",
    center: { lat: 17.7, lng: 83.4 },
    polygon: [[18.1, 82.9], [18.2, 84.0], [17.3, 84.0], [17.2, 82.9]],
    maxSafeWaveHeightM: 1.8,
    maxSafeWindKmph: 30,
  },
  {
    id: "zone-andhra-kakinada-01",
    name: "Andhra Kakinada Coast",
    state: "Andhra Pradesh",
    center: { lat: 16.9, lng: 82.3 },
    polygon: [[17.3, 81.8], [17.3, 82.8], [16.5, 82.8], [16.5, 81.8]],
    maxSafeWaveHeightM: 1.8,
    maxSafeWindKmph: 30,
  },
  {
    id: "zone-andhra-nellore-01",
    name: "Andhra Nellore Coast",
    state: "Andhra Pradesh",
    center: { lat: 14.5, lng: 80.1 },
    polygon: [[14.9, 79.6], [14.9, 80.6], [14.1, 80.6], [14.1, 79.6]],
    maxSafeWaveHeightM: 1.7,
    maxSafeWindKmph: 29,
  },
  {
    id: "zone-odisha-balasore-01",
    name: "Odisha Balasore Coast",
    state: "Odisha",
    center: { lat: 21.6, lng: 87.0 },
    polygon: [[22.0, 86.5], [22.0, 87.5], [21.2, 87.5], [21.2, 86.5]],
    maxSafeWaveHeightM: 1.8,
    maxSafeWindKmph: 31,
  },
  {
    id: "zone-odisha-paradip-01",
    name: "Odisha Paradip Coast",
    state: "Odisha",
    center: { lat: 20.3, lng: 86.8 },
    polygon: [[20.7, 86.3], [20.7, 87.3], [19.9, 87.3], [19.9, 86.3]],
    maxSafeWaveHeightM: 1.8,
    maxSafeWindKmph: 31,
  },
  {
    id: "zone-odisha-gopalpur-01",
    name: "Odisha Gopalpur Coast",
    state: "Odisha",
    center: { lat: 19.3, lng: 84.9 },
    polygon: [[19.7, 84.4], [19.7, 85.4], [18.9, 85.4], [18.9, 84.4]],
    maxSafeWaveHeightM: 1.9,
    maxSafeWindKmph: 32,
  },
  {
    id: "zone-westbengal-sundarbans-01",
    name: "West Bengal Sundarbans Coast",
    state: "West Bengal",
    center: { lat: 21.9, lng: 88.6 },
    polygon: [[22.3, 88.1], [22.4, 89.1], [21.5, 89.1], [21.4, 88.1]],
    maxSafeWaveHeightM: 1.7,
    maxSafeWindKmph: 30,
  },
  {
    id: "zone-andaman-north-01",
    name: "Andaman North Coast",
    state: "Andaman and Nicobar",
    center: { lat: 12.6, lng: 92.9 },
    polygon: [[13.1, 92.3], [13.1, 93.5], [12.1, 93.5], [12.1, 92.3]],
    maxSafeWaveHeightM: 2.0,
    maxSafeWindKmph: 34,
  },
  {
    id: "zone-andaman-south-01",
    name: "Andaman South Coast",
    state: "Andaman and Nicobar",
    center: { lat: 11.6, lng: 92.7 },
    polygon: [[12.0, 92.1], [12.0, 93.3], [11.1, 93.3], [11.1, 92.1]],
    maxSafeWaveHeightM: 2.0,
    maxSafeWindKmph: 34,
  },
  {
    id: "zone-nicobar-01",
    name: "Nicobar Coast",
    state: "Andaman and Nicobar",
    center: { lat: 8.2, lng: 93.1 },
    polygon: [[8.6, 92.5], [8.6, 93.7], [7.8, 93.7], [7.8, 92.5]],
    maxSafeWaveHeightM: 2.1,
    maxSafeWindKmph: 36,
  },
  {
    id: "zone-lakshadweep-north-01",
    name: "Lakshadweep North",
    state: "Lakshadweep",
    center: { lat: 11.2, lng: 72.6 },
    polygon: [[11.6, 72.0], [11.6, 73.1], [10.8, 73.1], [10.8, 72.0]],
    maxSafeWaveHeightM: 2.0,
    maxSafeWindKmph: 34,
  },
  {
    id: "zone-lakshadweep-south-01",
    name: "Lakshadweep South",
    state: "Lakshadweep",
    center: { lat: 10.2, lng: 72.7 },
    polygon: [[10.6, 72.1], [10.6, 73.2], [9.8, 73.2], [9.8, 72.1]],
    maxSafeWaveHeightM: 2.0,
    maxSafeWindKmph: 34,
  },
];

const toDomain = (row) => ({
  id: row.id,
  name: row.name,
  state: row.state,
  center: row.center,
  polygon: row.polygon,
  maxSafeWaveHeightM: row.max_safe_wave_height_m,
  maxSafeWindKmph: row.max_safe_wind_kmph,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRow = (zone) => ({
  id: zone.id,
  name: zone.name,
  state: zone.state,
  center: zone.center,
  polygon: zone.polygon,
  max_safe_wave_height_m: zone.maxSafeWaveHeightM,
  max_safe_wind_kmph: zone.maxSafeWindKmph,
});

const INDIAN_COASTAL_STATES = new Set([
  "Gujarat",
  "Maharashtra",
  "Goa",
  "Karnataka",
  "Kerala",
  "Tamil Nadu",
  "Andhra Pradesh",
  "Odisha",
  "West Bengal",
  "Andaman and Nicobar",
  "Lakshadweep",
]);

const isIndianZone = (row) => {
  const state = String(row?.state || "").trim();
  const lat = Number(row?.center?.lat);
  const lng = Number(row?.center?.lng);
  if (!INDIAN_COASTAL_STATES.has(state)) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  // Broad India maritime bounds to reject accidental non-India rows.
  return lat >= 5 && lat <= 25 && lng >= 66 && lng <= 94;
};

export const zonesRepository = {
  async ensureSeeded() {
    await supabaseRest.upsert(
      "fishing_zones",
      DEFAULT_ZONES.map(toRow),
      { onConflict: "id" },
    );
  },
  async list() {
    let rows = await supabaseRest.select("fishing_zones", "select=*&order=name.asc");
    if (!rows.length) {
      await this.ensureSeeded();
      rows = await supabaseRest.select("fishing_zones", "select=*&order=name.asc");
    }
    return rows.filter(isIndianZone).map(toDomain);
  },
  async findById(zoneId) {
    const zones = await this.list();
    return zones.find((zone) => zone.id === zoneId) || null;
  }
};
