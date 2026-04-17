import { supabaseRest } from "../shared/supabase-rest.js";

const toDomain = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    fisherName: row.fisher_name,
    vesselId: row.vessel_id,
    safetyPhone: row.safety_phone,
    locationLabel: row.location_label,
    coastGuardNumber: row.coast_guard_number,
    zoneId: row.zone_id,
    location: row.location,
    message: row.message,
    distressType: row.distress_type,
    escalationPlan: row.escalation_plan,
    dispatch: row.dispatch,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const toRow = (payload) => ({
  user_id: payload.userId,
  fisher_name: payload.fisherName,
  vessel_id: payload.vesselId,
  safety_phone: payload.safetyPhone,
  location_label: payload.locationLabel,
  coast_guard_number: payload.coastGuardNumber,
  zone_id: payload.zoneId,
  location: payload.location,
  message: payload.message,
  distress_type: payload.distressType,
  escalation_plan: payload.escalationPlan,
  dispatch: payload.dispatch,
  status: payload.status || "OPEN",
});

export const emergencySosRepository = {
  async create(payload) {
    const row = await supabaseRest.insert("sos_events", toRow(payload));
    return toDomain(row);
  },
  async list(query = {}) {
    const filters = ["select=*", "order=created_at.desc"];
    if (query.userId) filters.push(`user_id=eq.${encodeURIComponent(query.userId)}`);
    if (query.status) filters.push(`status=eq.${encodeURIComponent(query.status)}`);
    const rows = await supabaseRest.select("sos_events", filters.join("&"));
    return rows.map(toDomain);
  },
  async updateStatus(eventId, status) {
    const row = await supabaseRest.update(
      "sos_events",
      { status, updated_at: new Date().toISOString() },
      `id=eq.${encodeURIComponent(eventId)}`,
    );
    return toDomain(row);
  }
};
