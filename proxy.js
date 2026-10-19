import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

function getSupabaseUrl() {
  const url = process.env.SUPABASE_URL || "";
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

/**
 * Proxy untuk memproteksi rute /admin di Next.js 16.
 * Memeriksa sesi Supabase Auth sebelum mengizinkan akses ke halaman admin.
 */
export async function proxy(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = getSupabaseUrl();
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Ambil user yang sedang login dari Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Aturan keamanan 4: Semua halaman di bawah /admin (kecuali /admin/login) hanya boleh dibuka admin yang sudah login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Jika sudah login dan mencoba mengakses /admin/login, alihkan ke /admin
  if (pathname === "/admin/login" && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export default proxy;

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

