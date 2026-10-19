import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

/**
 * Membuat koneksi sesi admin menggunakan SUPABASE_PUBLISHABLE_KEY dan cookie (@supabase/ssr).
 * Digunakan untuk login, keluar, ganti password, dan aksi admin lainnya.
 */
export async function buatClientAdmin() {
  const cookieStore = await cookies();
  const supabaseUrl = getSupabaseUrl();
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY harus diatur di environment variable."
    );
  }

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Terjadi bila dipanggil dari Server Component saat render
        }
      },
    },
  });
}

export const createServerClientHelper = buatClientServer;
export const buatClientSesiAdmin = buatClientAdmin;
