import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/progress", "/account", "/tests", "/upload"];
const TRAINOVA_ORIGIN = "https://trainova.vercel.app";
const VERCEL_HOST_SUFFIX = ".vercel.app";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (!url || !anonKey) {
    if (isProtected) {
      return redirectToLogin(request, pathname);
    }

    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasUser = Boolean(user);

  if (isProtected && !hasUser) {
    return redirectToLogin(request, pathname);
  }

  return response;
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL("/login", getAuthRedirectOrigin(request));
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

  return new Response(null, {
    status: 307,
    headers: {
      Location: loginUrl.toString(),
    },
  });
}

function getAuthRedirectOrigin(request: NextRequest) {
  const currentHost = request.nextUrl.hostname.toLowerCase();

  if (currentHost === "localhost" || currentHost === "127.0.0.1") {
    return request.nextUrl.origin;
  }

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!configuredSiteUrl) {
    return TRAINOVA_ORIGIN;
  }

  try {
    const configuredOrigin = new URL(configuredSiteUrl).origin;
    const configuredHost = new URL(configuredOrigin).hostname.toLowerCase();

    return configuredHost !== "trainova.vercel.app" && configuredHost.endsWith(VERCEL_HOST_SUFFIX)
      ? TRAINOVA_ORIGIN
      : configuredOrigin;
  } catch {
    return TRAINOVA_ORIGIN;
  }
}
