import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

const TRAINOVA_ORIGIN = "https://trainova.vercel.app";
const VERCEL_HOST_SUFFIX = ".vercel.app";

export async function proxy(request: NextRequest) {
  const canonicalRedirect = getCanonicalRedirect(request);

  if (canonicalRedirect) {
    return canonicalRedirect;
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

function getCanonicalRedirect(request: NextRequest) {
  const currentHost = request.nextUrl.hostname.toLowerCase();

  const canonicalOrigin = getCanonicalOrigin();
  const canonicalUrl = new URL(canonicalOrigin);
  const canonicalHost = canonicalUrl.hostname.toLowerCase();

  if (currentHost === canonicalHost || !isLegacyVercelHost(currentHost, canonicalHost)) {
    return null;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.protocol = canonicalUrl.protocol;
  redirectUrl.hostname = canonicalUrl.hostname;
  redirectUrl.port = canonicalUrl.port;

  return NextResponse.redirect(redirectUrl, 308);
}

function getCanonicalOrigin() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!configuredSiteUrl) {
    return TRAINOVA_ORIGIN;
  }

  try {
    const origin = new URL(configuredSiteUrl).origin;
    return isNonCanonicalVercelHost(new URL(origin).hostname.toLowerCase()) ? TRAINOVA_ORIGIN : origin;
  } catch {
    return TRAINOVA_ORIGIN;
  }
}

function isLegacyVercelHost(currentHost: string, canonicalHost: string) {
  return currentHost !== canonicalHost && isNonCanonicalVercelHost(currentHost);
}

function isNonCanonicalVercelHost(hostname: string) {
  return hostname !== "trainova.vercel.app" && hostname.endsWith(VERCEL_HOST_SUFFIX);
}
