import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { CSRF_COOKIE_NAME, generateCsrfToken } from "@/lib/security/csrf";

function withCsrfCookie(request: NextRequest, response: NextResponse) {
  if (request.cookies.get(CSRF_COOKIE_NAME)?.value) {
    return response;
  }

  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: generateCsrfToken(),
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

/**
 * Refresh sesi Supabase dan teruskan cookie ke response.
 * Role guard tetap dilakukan di server layout/action, bukan hanya di sini.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return withCsrfCookie(request, response);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return withCsrfCookie(request, response);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
