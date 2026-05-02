import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TRAINOVA_ORIGIN = "https://trainova.vercel.app";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const siteUrl = getSiteUrl(origin);
  const code = searchParams.get("code");
  const next = normalizeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", siteUrl));
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", siteUrl));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", siteUrl));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const metadata = user.user_metadata ?? {};

    await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        full_name: metadata.full_name ?? metadata.name ?? null,
        avatar_url: metadata.avatar_url ?? metadata.picture ?? null,
        provider: user.app_metadata?.provider ?? "email",
      },
      { onConflict: "id" },
    );
  }

  return NextResponse.redirect(new URL(next, siteUrl));
}

function normalizeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

function getSiteUrl(fallbackOrigin: string) {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const fallback = fallbackOrigin.includes("localhost") ? fallbackOrigin : TRAINOVA_ORIGIN;

  if (!configuredSiteUrl) {
    return fallback;
  }

  try {
    const origin = new URL(configuredSiteUrl).origin;
    return isNonCanonicalVercelOrigin(origin) ? fallback : origin;
  } catch {
    return fallback;
  }
}

function isNonCanonicalVercelOrigin(origin: string) {
  const hostname = new URL(origin).hostname.toLowerCase();
  return hostname !== "trainova.vercel.app" && hostname.endsWith(".vercel.app");
}
