import { supabaseRest } from "../shared/supabase-rest.js";

const toRow = (authUser) => ({
  user_id: authUser.id,
  email: authUser.email || null,
  phone: authUser.phone || null,
  provider: Array.isArray(authUser.app_metadata?.providers)
    ? authUser.app_metadata.providers[0] || null
    : authUser.app_metadata?.provider || null,
  last_sign_in_at: authUser.last_sign_in_at || null,
  last_seen_at: new Date().toISOString(),
  raw_user: authUser,
});

export const authMetadataRepository = {
  async touchFromAuthUser(authUser) {
    const saved = await supabaseRest.upsert("fisher_auth_metadata", toRow(authUser), { onConflict: "user_id" });
    return saved;
  },
};
