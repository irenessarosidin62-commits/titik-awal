import { createClient } from "@supabase/supabase-js";

/**
 * Membersihkan URL Supabase dari trailing slash atau path /rest/v1
 * agar createClient selalu menerima root project URL yang valid.
 */
function getSupabaseUrl() {
  const url = process.env.SUPABASE_URL || "";
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

/**
 * Membuat koneksi Supabase di sisi server menggunakan SUPABASE_SECRET_KEY.
 * Digunakan untuk membaca data publik (katalog dan detail produk)
 * yang melewati aturan Row Level Security (RLS).
 */
export function buatClientServer() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "SUPABASE_URL dan SUPABASE_SECRET_KEY harus diatur di environment variable."
    );
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const createServerClient = buatClientServer;

