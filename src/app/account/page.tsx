import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountProfileForm } from "@/components/testflow/account-profile-form";
import { AppShell, PageFrame, PageTitle, QuietPanel } from "@/components/testflow/shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatDate(value?: string | null) {
  if (!value) {
    return "пока нет";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function statNumber(value: number | null | undefined, suffix = "") {
  if (!value) {
    return "0";
  }

  return `${Math.round(value)}${suffix}`;
}

export default async function Page() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <AppShell>
        <PageFrame>
          <QuietPanel className="mx-auto max-w-2xl p-8">
            <PageTitle
              description="Добавьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY, чтобы включить аккаунты."
              title="Supabase пока не настроен"
            />
          </QuietPanel>
        </PageFrame>
      </AppShell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const [{ data: profile }, { count: testsCount }, { data: attempts }, { data: wrongQuestions }] = await Promise.all([
    supabase.from("profiles").select("email,full_name,avatar_url,provider,created_at").eq("id", user.id).maybeSingle(),
    supabase.from("tests").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("attempts")
      .select("score_percent,correct_count,wrong_count,skipped_count")
      .eq("user_id", user.id),
    supabase.from("wrong_questions").select("id").eq("user_id", user.id),
  ]);

  const provider = profile?.provider ?? (typeof user.app_metadata.provider === "string" ? user.app_metadata.provider : "email");
  const fullName =
    profile?.full_name ??
    (typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null) ??
    (typeof user.user_metadata.name === "string" ? user.user_metadata.name : null);
  const avatarUrl =
    profile?.avatar_url ?? (typeof user.user_metadata.avatar_url === "string" ? user.user_metadata.avatar_url : null);
  const bestScore = Math.max(0, ...(attempts ?? []).map((attempt) => Number(attempt.score_percent || 0)));
  const solvedQuestions = (attempts ?? []).reduce(
    (sum, attempt) =>
      sum + Number(attempt.correct_count ?? 0) + Number(attempt.wrong_count ?? 0) + Number(attempt.skipped_count ?? 0),
    0
  );

  return (
    <AppShell>
      <PageFrame>
        <div className="mx-auto flex max-w-5xl flex-col gap-10">
          <PageTitle
            description="Профиль, вход и реальная статистика вашего аккаунта Trainova."
            title="Аккаунт"
          />

          <QuietPanel className="p-7 sm:p-8">
            <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
              <div className="flex flex-col items-start gap-4">
                <div className="flex size-24 items-center justify-center overflow-hidden rounded-lg bg-[#eeaaff]/45 text-3xl font-bold text-[#423ed8]">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="size-full object-cover" src={avatarUrl} />
                  ) : (
                    (fullName?.[0] ?? user.email?.[0] ?? "T").toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]">Email</p>
                  <p className="mt-1 break-all text-lg font-bold text-[#282e3e] dark:text-white">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]">Провайдер</p>
                  <p className="mt-1 text-base font-bold capitalize text-[#282e3e] dark:text-white">{provider}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]">Дата регистрации</p>
                  <p className="mt-1 text-base font-bold text-[#282e3e] dark:text-white">
                    {formatDate(profile?.created_at ?? user.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-8">
                <AccountProfileForm initialName={fullName} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <AccountStat label="Всего тестов" value={statNumber(testsCount)} />
                  <AccountStat label="Всего попыток" value={statNumber(attempts?.length)} />
                  <AccountStat label="Лучший результат" value={statNumber(bestScore, "%")} />
                  <AccountStat label="Вопросов решено" value={statNumber(solvedQuestions)} />
                  <AccountStat label="Ошибок в повторении" value={statNumber(wrongQuestions?.length)} tone="coral" />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link className="trainova-primary trainova-pill inline-flex h-11 items-center justify-center px-5 font-bold" href="/dashboard">
                    Мой кабинет
                  </Link>
                  <Link className="trainova-secondary trainova-pill inline-flex h-11 items-center justify-center px-5 font-bold" href="/logout">
                    Выйти
                  </Link>
                </div>
              </div>
            </div>
          </QuietPanel>
        </div>
      </PageFrame>
    </AppShell>
  );
}

function AccountStat({
  label,
  value,
  tone = "violet",
}: {
  label: string;
  value: string;
  tone?: "violet" | "coral";
}) {
  return (
    <div className="rounded-lg bg-[#f6f7fb] p-5 dark:bg-white/[0.06]">
      <p className={tone === "coral" ? "text-sm font-bold text-[#d85d4e] dark:text-[#ff9a8f]" : "text-sm font-bold text-[#4255ff] dark:text-[#aeb7ff]"}>
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-normal text-[#282e3e] dark:text-white">{value}</p>
    </div>
  );
}
