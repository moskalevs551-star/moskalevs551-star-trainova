import Link from "next/link";
import { redirect } from "next/navigation";

import { CloudTestActions } from "@/components/testflow/cloud-test-actions";
import { AppShell, PageFrame, PageTitle, QuietPanel } from "@/components/testflow/shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "пока нет";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function score(value?: number | string | null) {
  const numeric = Number(value ?? 0);
  return numeric > 0 ? `${Math.round(numeric)}%` : "пока нет";
}

export default async function Page({ params }: PageProps) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <AppShell>
        <PageFrame>
          <QuietPanel className="mx-auto max-w-2xl p-8">
            <PageTitle
              title="Supabase пока не настроен"
              description="Добавьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY, чтобы открыть личные тренажёры."
            />
          </QuietPanel>
        </PageFrame>
      </AppShell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { id } = await params;

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/tests/${id}`)}`);
  }

  const { data: test } = await supabase
    .from("tests")
    .select("id,title,source_format,question_count,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!test) {
    redirect("/dashboard");
  }

  const [{ data: progress }, { data: attempts }, { data: wrongQuestions }] = await Promise.all([
    supabase
      .from("user_progress")
      .select("progress_percent,best_score_percent,updated_at,wrong_question_ids")
      .eq("test_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("attempts")
      .select("id,score_percent,correct_count,wrong_count,skipped_count,time_spent_seconds,created_at")
      .eq("test_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("wrong_questions").select("question_id").eq("test_id", id).eq("user_id", user.id),
  ]);

  const wrongCount = wrongQuestions?.length || (Array.isArray(progress?.wrong_question_ids) ? progress.wrong_question_ids.length : 0);
  const progressPercent = Number(progress?.progress_percent ?? 0);

  return (
    <AppShell>
      <PageFrame>
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <PageTitle
              description={`${test.question_count ?? 0} вопросов · ${String(test.source_format || "qst").toUpperCase()} · создан ${formatDate(test.created_at)}`}
              title={test.title}
            />
            <Link className="trainova-secondary trainova-pill inline-flex h-12 items-center justify-center px-6 font-bold" href="/dashboard">
              В кабинет
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <QuietPanel className="p-7 sm:p-8">
              <div className="grid gap-4 md:grid-cols-3">
                <DetailStat label="Прогресс" value={`${Math.round(progressPercent)}%`} />
                <DetailStat label="Лучший результат" value={score(progress?.best_score_percent)} />
                <DetailStat label="Ошибки" value={wrongCount || "нет"} tone="coral" />
              </div>
              <div className="mt-8 h-2 overflow-hidden rounded-full bg-[#e6e9f2] dark:bg-white/[0.12]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#4255ff_0%,#98e3ff_55%,#eeaaff_100%)]"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-[#586380] dark:text-[#c7cce0]">
                {progress?.updated_at
                  ? `Обновлено ${formatDate(progress.updated_at)}.`
                  : "Прогресс появится после первой тренировки."}
              </p>
            </QuietPanel>

            <QuietPanel className="p-5">
              <CloudTestActions testId={id} hasWrongQuestions={wrongCount > 0} />
            </QuietPanel>
          </div>

          <QuietPanel className="p-7 sm:p-8">
            <h2 className="text-3xl font-bold tracking-normal text-[#282e3e] dark:text-white">Последние попытки</h2>
            {attempts?.length ? (
              <div className="mt-6 flex flex-col divide-y divide-[#d9dde8] dark:divide-white/[0.12]">
                {attempts.map((attempt) => (
                  <div className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[1fr_120px] md:items-center" key={attempt.id}>
                    <div>
                      <p className="font-bold text-[#282e3e] dark:text-white">{formatDate(attempt.created_at)}</p>
                      <p className="mt-1 text-sm text-[#586380] dark:text-[#c7cce0]">
                        правильно {attempt.correct_count}, ошибок {attempt.wrong_count}, пропущено {attempt.skipped_count}
                      </p>
                    </div>
                    <p className="text-left text-2xl font-bold text-[#282e3e] dark:text-white md:text-right">
                      {score(attempt.score_percent)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-lg bg-[#f6f7fb] p-6 text-center dark:bg-white/[0.06]">
                <p className="text-lg font-bold text-[#282e3e] dark:text-white">Вы ещё не проходили этот тест.</p>
                <p className="mt-2 text-sm leading-6 text-[#586380] dark:text-[#c7cce0]">
                  Начните тренировку, и здесь появится история попыток.
                </p>
              </div>
            )}
          </QuietPanel>
        </div>
      </PageFrame>
    </AppShell>
  );
}

function DetailStat({
  label,
  value,
  tone = "violet",
}: {
  label: string;
  value: string | number;
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
