"use server";

import { redirect } from "next/navigation";
import { buatClientAdmin } from "@/lib/supabase/server";

/**
 * Server Action untuk memproses login admin dengan Supabase Auth.
 */
export async function loginAdmin(prevState, formData) {
  const data =
    formData instanceof FormData
      ? formData
      : prevState instanceof FormData
        ? prevState
        : null;

  const email = data ? data.get("email") : null;
  const password = data ? data.get("password") : null;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  let errorPesan = null;

  try {
    const supabase = await buatClientAdmin();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(password),
    });

    if (error) {
      if (
        error.code === "invalid_credentials" ||
        error.message?.toLowerCase().includes("invalid login credentials")
      ) {
        errorPesan = "Email atau password salah. Silakan periksa kembali.";
      } else {
        errorPesan = error.message || "Gagal masuk. Silakan coba lagi.";
      }
    }
  } catch (err) {
    errorPesan = err.message || "Terjadi kesalahan pada server.";
  }

  if (errorPesan) {
    return { error: errorPesan };
  }

  redirect("/admin");
}

/**
 * Server Action untuk mengakhiri sesi admin (logout) lalu kembali ke halaman login.
 */
export async function keluarAdmin() {
  try {
    const supabase = await buatClientAdmin();
    await supabase.auth.signOut();
  } catch (err) {
    // Tetap arahkan ke login jika terjadi error
  }

  redirect("/admin/login");
}

