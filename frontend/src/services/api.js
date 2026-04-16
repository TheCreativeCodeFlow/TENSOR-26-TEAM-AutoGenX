import { requireSupabase, supabase } from "./supabase.js";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1").replace(/\/$/, "");

const parseResponse = async (response) => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.error?.message ||
      (typeof payload?.error === "string" ? payload.error : null) ||
      payload?.message ||
      `API error: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return payload?.data ?? payload;
};

const request = async (endpoint, { method = "GET", body, includeAuth = true } = {}) => {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (includeAuth) {
    try {
      const sb = requireSupabase();
      const { data } = await sb.auth.getSession();
      const session = data?.session;
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      if (session?.user?.id) headers["x-user-id"] = session.user.id;
    } catch {
      const fallbackUserId = localStorage.getItem("auth_user_id");
      if (fallbackUserId) headers["x-user-id"] = fallbackUserId;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parseResponse(response);
};

const pickAdvisory = (payload, language = "en") => {
  const advisory = payload?.advisory || payload || {};
  const summary = advisory.localizedMessage || advisory.summary || {};
  return {
    ...advisory,
    level: advisory.level || advisory.riskLevel || "SAFE",
    summary,
    preferredMessage: summary[language] || summary.en || advisory.message || "",
  };
};

export const api = {
  get: (endpoint, includeAuth = true) => request(endpoint, { method: "GET", includeAuth }),
  post: (endpoint, body, includeAuth = true) => request(endpoint, { method: "POST", body, includeAuth }),
  put: (endpoint, body, includeAuth = true) => request(endpoint, { method: "PUT", body, includeAuth }),
  patch: (endpoint, body, includeAuth = true) => request(endpoint, { method: "PATCH", body, includeAuth }),
};

export const authApi = {
  supabase,
  signInWithOtp: (phone) => requireSupabase().auth.signInWithOtp({ phone }),
  verifyOtp: async (phone, token) => {
    const result = await requireSupabase().auth.verifyOtp({ phone, token, type: "sms" });
    if (!result.error) {
      const userId = result?.data?.user?.id || result?.data?.session?.user?.id;
      if (userId) localStorage.setItem("auth_user_id", userId);
      localStorage.setItem("auth_phone", phone);
    }
    return result;
  },
  signInWithGoogle: () =>
    requireSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    }),
  signOut: () => requireSupabase().auth.signOut(),
  session: async () => {
    const { data } = await requireSupabase().auth.getSession();
    return data.session;
  },
  currentUser: async () => {
    const { data } = await requireSupabase().auth.getUser();
    return data.user;
  },
  me: () => request("/auth/me"),
};

export const profileApi = {
  getMine: () => request("/profiles/me"),
  saveMine: (data) => request("/profiles/me", { method: "PUT", body: data }),
};

export const zonesApi = {
  getAll: () => request("/zones"),
  locate: (lat, lng) => request("/zones/locate", { method: "POST", body: { lat, lng } }),
};

export const marineApi = {
  overview: (zoneId) => request(`/marine/conditions?zoneId=${encodeURIComponent(zoneId)}`),
  forecast: (zoneId, hours = 12) =>
    request(`/marine/forecast?zoneId=${encodeURIComponent(zoneId)}&hours=${encodeURIComponent(hours)}`),
  tides: (zoneId) => request(`/marine/tides?zoneId=${encodeURIComponent(zoneId)}`),
};

export const advisoriesApi = {
  current: async (zoneId, language = "en") => {
    const payload = await request(`/advisories/current/${encodeURIComponent(zoneId)}`);
    return pickAdvisory(payload, language);
  },
  history: async (zoneId) => {
    const payload = await request(`/advisories/history/${encodeURIComponent(zoneId)}`);
    return payload?.advisories || payload || [];
  },
  assess: async (data, language = "en") => {
    const payload = await request("/advisories/assessments", { method: "POST", body: data });
    return pickAdvisory(payload, language);
  },
};

export const alertsApi = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const payload = await request(`/alerts${query ? `?${query}` : ""}`);
    return payload?.alerts || payload || [];
  },
  async getById(id) {
    const rows = await alertsApi.getAll();
    return rows.find((row) => row.id === id) || null;
  },
  create: (data) => request("/alerts", { method: "POST", body: data }),
};

export const noticesApi = {
  async get() {
    const payload = await request("/notices");
    return payload?.notices || payload || [];
  },
};

export const emergencyApi = {
  sos: (data) => request("/emergency/sos", { method: "POST", body: data }),
  listMine: () => request("/emergency/sos/mine"),
};
