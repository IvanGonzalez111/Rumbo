import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(url && serviceRoleKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export const storageBucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "rumbo-evidence";
