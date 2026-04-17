import { supabaseRest } from "../shared/supabase-rest.js";

const toDomain = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    age: row.age,
    coastalArea: row.coastal_area,
    primaryZoneId: row.primary_zone_id,
    locationLabel: row.location_label,
    latitude: row.latitude,
    longitude: row.longitude,
    language: row.language,
    boatType: row.boat_type,
    phone: row.phone,
    safetyPhone: row.safety_phone,
    village: row.village,
    district: row.district,
    state: row.state,
    pincode: row.pincode,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    relationship: row.relationship,
    yearsOfExperience: row.years_of_experience,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const toRow = (userId, data) => ({
  user_id: userId,
  full_name: data.fullName,
  age: data.age,
  coastal_area: data.coastalArea,
  primary_zone_id: data.primaryZoneId || null,
  location_label: data.locationLabel,
  latitude: data.latitude,
  longitude: data.longitude,
  language: data.language,
  boat_type: data.boatType,
  phone: data.phone,
  safety_phone: data.safetyPhone || null,
  village: data.village || null,
  district: data.district || null,
  state: data.state || null,
  pincode: data.pincode || null,
  emergency_contact_name: data.emergencyContactName || null,
  emergency_contact_phone: data.emergencyContactPhone || null,
  relationship: data.relationship || null,
  years_of_experience: data.yearsOfExperience ?? null,
});

export const profilesRepository = {
  async findByUserId(userId) {
    const row = await supabaseRest.select(
      "fisher_profiles",
      `select=*&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
      { single: true },
    );
    return toDomain(row);
  },
  async upsertByUserId(userId, data) {
    const row = await supabaseRest.upsert("fisher_profiles", toRow(userId, data), {
      onConflict: "user_id",
    });
    return toDomain(row);
  }
};
