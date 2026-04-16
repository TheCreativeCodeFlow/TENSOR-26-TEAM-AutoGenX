import { supabase } from "../lib/supabase.js";

const hasConfig = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = hasConfig;

export const requireSupabase = () => {
  if (!hasConfig) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.",
    );
  }
  return supabase;
};

export { supabase };
