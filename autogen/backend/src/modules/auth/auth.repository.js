import { supabaseRest } from "../shared/supabase-rest.js";

const toDomain = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    phone: row.phone,
    fullName: row.full_name || "",
    role: row.role || "fisherfolk",
    preferredLanguage: row.preferred_language || "en",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const authRepository = {
  async assertReady() {
    await supabaseRest.select("fisher_users", "select=id&limit=1");
    return true;
  },
  async findUserByPhone(phone) {
    const row = await supabaseRest.select(
      "fisher_users",
      `select=*&phone=eq.${encodeURIComponent(phone)}&limit=1`,
      { single: true },
    );
    return toDomain(row);
  },
  async findUserById(userId) {
    const row = await supabaseRest.select(
      "fisher_users",
      `select=*&id=eq.${encodeURIComponent(userId)}&limit=1`,
      { single: true },
    );
    return toDomain(row);
  },
  async createUser({ phone, fullName = "", preferredLanguage = "en" }) {
    const row = await supabaseRest.insert("fisher_users", {
      phone,
      full_name: fullName,
      role: "fisherfolk",
      preferred_language: preferredLanguage,
    });
    return toDomain(row);
  },
  async touchUser(userId) {
    const row = await supabaseRest.update(
      "fisher_users",
      { updated_at: new Date().toISOString() },
      `id=eq.${encodeURIComponent(userId)}`,
    );
    return toDomain(row);
  }
};
