import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ user: null, supabaseConfigured: false });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null, supabaseConfigured: true });
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;
  const provider =
    typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : null;

  await supabase.from("profiles").upsert(
    {
      avatar_url: avatarUrl,
      email: user.email,
      full_name: fullName,
      id: user.id,
      provider,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  return NextResponse.json({
    user: {
      avatarUrl,
      email: user.email,
      fullName,
      id: user.id,
    },
    supabaseConfigured: true,
  });
}
