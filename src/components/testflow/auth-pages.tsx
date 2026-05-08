"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { AppShell, PageFrame, QuietPanel } from "./shell";
import { TrainovaLogo } from "./logo";

const TRAINOVA_ORIGIN = "https://trainova.vercel.app";

export function AuthPage({ mode = "login" }: { mode?: "login" | "signup" }) {
  const searchParams = useSearchParams();
  const next = normalizeNextPath(searchParams.get("next"));
  const errorParam = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(errorParam ? "Не получилось завершить вход. Попробуйте ещё раз." : "");
  const [pending, setPending] = useState(false);
  const configured = hasSupabaseEnv();

  const redirectTo = useMemo(() => {
    const siteUrl = getAuthSiteUrl();
    const callback = new URL("/auth/callback", siteUrl);
    callback.searchParams.set("next", next);
    return callback.toString();
  }, [next]);

  async function signInWithGoogle() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase пока не настроен. Добавьте env variables, и вход заработает.");
      return;
    }

    setPending(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setMessage(error.message);
      setPending(false);
    }
  }

  async function continueWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase пока не настроен. Добавьте env variables, и email-вход заработает.");
      return;
    }

    setPending(true);
    setMessage("");

    const result =
      password.length >= 6
        ? mode === "signup"
          ? await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: redirectTo },
            })
          : await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: redirectTo },
          });

    if (result.error) {
      setMessage(result.error.message);
      setPending(false);
      return;
    }

    setMessage(
      password.length >= 6
        ? mode === "signup"
          ? "Проверьте почту, чтобы подтвердить аккаунт."
          : "Готово. Перенаправляем в кабинет."
        : "Мы отправили magic link на почту."
    );

    if (password.length >= 6 && mode === "login") {
      window.location.href = next;
    } else {
      setPending(false);
    }
  }

  return (
    <AppShell>
      <PageFrame className="py-14 lg:py-20">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[1fr_430px]"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hidden flex-col gap-8 lg:flex">
            <TrainovaLogo className="h-16" />
            <div>
              <h1 className="max-w-xl text-balance text-[44px] font-bold leading-[1.12] tracking-normal text-[#282e3e] dark:text-white">
                Войдите, чтобы сохранять тренажёры и прогресс
              </h1>
              <p className="mt-6 max-w-lg text-xl leading-[1.4] text-[#586380] dark:text-[#c7cce0]">
                Trainova продолжит с того же вопроса, сохранит попытки и соберёт ошибки для следующей короткой сессии.
              </p>
            </div>
          </div>

          <QuietPanel className="overflow-hidden p-6 sm:p-8">
            <div className="mb-7 flex flex-col gap-5">
              <TrainovaLogo className="h-12 lg:hidden" />
              <div>
                <h2 className="text-[32px] font-bold leading-[1.25] tracking-normal text-[#282e3e] dark:text-white">
                  {mode === "signup" ? "Создать аккаунт" : "Войти"}
                </h2>
                <p className="mt-2 text-sm leading-[1.43] text-[#586380] dark:text-[#c7cce0]">
                  Войдите через Google или используйте email.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <AuthButton disabled={pending || !configured} icon={<GoogleIcon />} onClick={signInWithGoogle}>
                Continue with Google
              </AuthButton>
            </div>

            <div className="my-7 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.12em] text-[#939bb4]">
              <span className="h-px flex-1 bg-[#d9dde8] dark:bg-white/[0.12]" />
              Email
              <span className="h-px flex-1 bg-[#d9dde8] dark:bg-white/[0.12]" />
            </div>

            <form className="flex flex-col gap-4" onSubmit={continueWithEmail}>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]">Email</span>
                <input
                  className="trainova-input h-12 px-4 text-base outline-none transition"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]">
                  Пароль, если хотите войти без magic link
                </span>
                <input
                  className="trainova-input h-12 px-4 text-base outline-none transition"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Можно оставить пустым"
                  type="password"
                  value={password}
                />
              </label>
              <Button className="trainova-primary trainova-pill h-12 text-base font-bold" disabled={pending || !configured} type="submit">
                {password ? (mode === "signup" ? "Создать аккаунт" : "Войти с паролем") : "Continue with Email"}
              </Button>
            </form>

            {!configured ? (
              <p className="mt-4 rounded-lg bg-[#ffc38c]/35 p-3 text-sm leading-6 text-[#282e3e]">
                Auth UI готов. Для реального входа добавьте Supabase переменные окружения.
              </p>
            ) : null}
            {message ? <p className="mt-4 text-sm leading-6 text-[#586380] dark:text-[#c7cce0]">{message}</p> : null}

            <p className="mt-7 text-center text-sm text-[#586380] dark:text-[#c7cce0]">
              {mode === "signup" ? (
                <>
                  Уже есть аккаунт?{" "}
                  <Link className="font-bold text-[#4255ff]" href={`/login?next=${encodeURIComponent(next)}`}>
                    Войти
                  </Link>
                </>
              ) : (
                <>
                  Нет аккаунта?{" "}
                  <Link className="font-bold text-[#4255ff]" href={`/signup?next=${encodeURIComponent(next)}`}>
                    Создать
                  </Link>
                </>
              )}
            </p>
          </QuietPanel>
        </motion.div>
      </PageFrame>
    </AppShell>
  );
}

function normalizeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

function getAuthSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const browserOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const fallback = browserOrigin.includes("localhost") ? browserOrigin : TRAINOVA_ORIGIN;

  if (!configuredSiteUrl) {
    return fallback || "http://localhost:3000";
  }

  try {
    const origin = new URL(configuredSiteUrl).origin;
    return isNonCanonicalVercelOrigin(origin) ? fallback : origin;
  } catch {
    return fallback || "http://localhost:3000";
  }
}

function isNonCanonicalVercelOrigin(origin: string) {
  const hostname = new URL(origin).hostname.toLowerCase();
  return hostname !== "trainova.vercel.app" && hostname.endsWith(".vercel.app");
}

function AuthButton({
  children,
  disabled,
  icon,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="trainova-lift flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#d9dde8] bg-white px-4 text-base font-bold text-[#282e3e] transition hover:border-[#4255ff]/40 hover:bg-[#eef0ff] disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.10]"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.25c1.9-1.75 2.97-4.33 2.97-7.52Z" fill="#4285F4" />
      <path d="M12 22c2.7 0 4.96-.9 6.62-2.45l-3.25-2.51c-.9.6-2.06.96-3.37.96-2.6 0-4.8-1.76-5.6-4.12H3.05v2.6A9.99 9.99 0 0 0 12 22Z" fill="#34A853" />
      <path d="M6.4 13.88A6 6 0 0 1 6.08 12c0-.65.11-1.29.32-1.88v-2.6H3.05A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.05 4.48l3.35-2.6Z" fill="#FBBC05" />
      <path d="M12 6c1.47 0 2.8.51 3.84 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2a9.99 9.99 0 0 0-8.95 5.52l3.35 2.6C7.2 7.76 9.4 6 12 6Z" fill="#EA4335" />
    </svg>
  );
}
