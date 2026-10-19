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

/**
 * Server Action untuk mengganti password admin yang sedang login.
 * Memeriksa sesi login terlebih dahulu sesuai aturan keamanan AGENTS.md.
 */
export async function gantiPassword(prevState, formData) {
  const data =
    formData instanceof FormData
      ? formData
      : prevState instanceof FormData
        ? prevState
        : null;

  const passwordBaru = data ? data.get("password_baru") : null;
  const konfirmasiPassword = data ? data.get("konfirmasi_password") : null;

  if (!passwordBaru || !konfirmasiPassword) {
    return { error: "Password baru dan konfirmasi password wajib diisi." };
  }

  if (String(passwordBaru).length < 8) {
    return { error: "Password baru minimal 8 karakter." };
  }

  if (passwordBaru !== konfirmasiPassword) {
    return { error: "Password baru dan konfirmasi password tidak sama." };
  }

  try {
    const supabase = await buatClientAdmin();

    // Wajib memeriksa di server bahwa admin sudah login sebelum mengubah data
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error:
          "Sesi telah berakhir atau kamu belum login. Silakan masuk terlebih dahulu.",
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: String(passwordBaru),
    });

    if (error) {
      return {
        error: error.message || "Gagal mengganti password. Silakan coba lagi.",
      };
    }

    return { sukses: true, message: "Password berhasil diganti." };
  } catch (err) {
    return { error: err.message || "Terjadi kesalahan pada server." };
  }
}
