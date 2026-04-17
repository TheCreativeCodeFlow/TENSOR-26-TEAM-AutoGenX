import { env } from "../../config/env.js";
import { createValidationError } from "./errors.js";

const getServiceKey = () => env.supabaseServiceRoleKey || env.supabaseAnonKey;

const ensureConfigured = () => {
  if (!env.supabaseUrl || !getServiceKey()) {
    throw createValidationError("Supabase REST persistence is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
};

const buildHeaders = (extra = {}) => {
  const key = getServiceKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
};

const restBase = () => `${env.supabaseUrl.replace(/\/$/, "")}/rest/v1`;

export const supabaseRest = {
  async select(table, query = "", { single = false } = {}) {
    ensureConfigured();
    const response = await fetch(`${restBase()}/${table}${query ? `?${query}` : ""}`, {
      method: "GET",
      headers: buildHeaders({ Accept: "application/json" }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw createValidationError(`Supabase select failed for table ${table}`, {
        status: response.status,
        response: details,
      });
    }

    const data = await response.json().catch(() => []);
    if (single) return Array.isArray(data) ? data[0] || null : data;
    return data;
  },

  async upsert(table, payload, { onConflict } = {}) {
    ensureConfigured();
    const query = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : "";
    const response = await fetch(`${restBase()}/${table}${query}`, {
      method: "POST",
      headers: buildHeaders({
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify(Array.isArray(payload) ? payload : [payload]),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw createValidationError(`Supabase upsert failed for table ${table}`, {
        status: response.status,
        response: details,
      });
    }

    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? data[0] || null : data;
  },

  async insert(table, payload) {
    ensureConfigured();
    const response = await fetch(`${restBase()}/${table}`, {
      method: "POST",
      headers: buildHeaders({
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify(Array.isArray(payload) ? payload : [payload]),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw createValidationError(`Supabase insert failed for table ${table}`, {
        status: response.status,
        response: details,
      });
    }

    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? data[0] || null : data;
  },

  async update(table, payload, query) {
    ensureConfigured();
    const response = await fetch(`${restBase()}/${table}?${query}`, {
      method: "PATCH",
      headers: buildHeaders({
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw createValidationError(`Supabase update failed for table ${table}`, {
        status: response.status,
        response: details,
      });
    }

    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? data[0] || null : data;
  },
};
