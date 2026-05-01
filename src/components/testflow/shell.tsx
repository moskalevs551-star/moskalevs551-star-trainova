"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LogOut, Settings, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { saveLocalQuizToAccount } from "@/lib/quiz/cloud";
import { loadProgress, loadQuiz, loadSettings, saveQuiz } from "@/lib/quiz/storage";
import { BrandLink } from "./logo";

const navItems = [
  { href: "/#features", label: "Возможности" },
  { href: "/#how-it-works", label: "Как это работает" },
  { href: "/demo", label: "Демо" },
];

type HeaderUser = {
  id: string;
  email: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<HeaderUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { user: HeaderUser | null };
        if (!cancelled) {
          setUser(payload.user);
        }
      } catch {
        // Supabase can be unconfigured in local MVP mode.
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FFFDF8_0%,#FAFAF7_48%,#F8FAFC_100%)] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-900/[0.055] bg-[#FFFDF8]/86 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <BrandLink />
          <nav className="hidden items-center gap-7 text-sm text-slate-500 md:flex">
            {navItems.map((item) => (
              <Link
                className={cn(
                  "transition-colors hover:text-slate-950",
                  pathname === item.href && "font-medium text-slate-950"
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                className="hidden h-10 items-center justify-center rounded-full bg-[#10B981] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(16,185,129,0.16)] transition hover:-translate-y-0.5 hover:bg-[#047857] sm:inline-flex"
                href="/upload"
              >
                Загрузить тест
              </Link>
              <UserMenu user={user} />
            </div>
          ) : (
            <GuestActions />
          )}
        </div>
      </header>
      <main>{children}</main>
      <SaveLocalQuizPrompt user={user} />
    </div>
  );
}

function GuestActions() {
  return (
    <div className="flex items-center gap-2">
      <Link
        className="hidden h-10 items-center justify-center rounded-full px-4 text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:inline-flex"
        href="/login"
      >
        Войти
      </Link>
      <Link
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#10B981] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(16,185,129,0.18)] transition hover:-translate-y-0.5 hover:bg-[#047857]"
        href="/signup?next=%2Fupload"
      >
        Начать бесплатно
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function UserMenu({ user }: { user: HeaderUser }) {
  const initials =
    user.fullName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "T";

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full border border-slate-900/[0.06] bg-white px-2 py-1.5 shadow-sm transition hover:border-emerald-200">
        <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="size-full object-cover" src={user.avatarUrl} />
          ) : (
            initials
          )}
        </span>
        <span className="hidden max-w-36 truncate text-sm font-medium text-slate-700 sm:block">
          {user.email}
        </span>
      </summary>
      <div className="absolute right-0 mt-3 w-64 rounded-3xl border border-slate-900/[0.06] bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
        <div className="px-3 py-3">
          <p className="truncate text-sm font-semibold text-slate-950">{user.fullName || "Аккаунт Trainova"}</p>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
        </div>
        <MenuLink href="/dashboard" label="Мой кабинет" />
        <MenuLink href="/progress" label="Прогресс" />
        <MenuLink href="/settings" label="Настройки" icon={<Settings className="size-4" />} />
        <Link
          className="mt-1 flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
          href="/logout"
        >
          <LogOut className="size-4" />
          Выйти
        </Link>
      </div>
    </details>
  );
}

function MenuLink({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  return (
    <Link
      className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
      href={href}
    >
      {icon ?? <UserRound className="size-4" />}
      {label}
    </Link>
  );
}

function SaveLocalQuizPrompt({ user }: { user: HeaderUser | null }) {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (!user) {
      return;
    }

    const quiz = loadQuiz();
    const dismissed = window.localStorage.getItem("trainova.localSavePromptDismissed");

    void Promise.resolve().then(() => {
      setVisible(Boolean(quiz && !quiz.isDemo && !quiz.cloudId && dismissed !== quiz.id));
    });
  }, [user]);

  async function saveToAccount() {
    const quiz = loadQuiz();
    if (!quiz) {
      return;
    }

    setState("saving");
    try {
      const saved = await saveLocalQuizToAccount({
        quiz,
        settings: loadSettings(quiz),
        progress: loadProgress(quiz.id),
      });
      saveQuiz({ ...quiz, cloudId: saved.id });
      setState("saved");
      window.setTimeout(() => setVisible(false), 1200);
    } catch {
      setState("error");
    }
  }

  function keepLocal() {
    const quiz = loadQuiz();
    if (quiz) {
      window.localStorage.setItem("trainova.localSavePromptDismissed", quiz.id);
    }
    setVisible(false);
  }

  if (!user || !visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-xl rounded-3xl border border-slate-900/[0.08] bg-white/95 p-4 shadow-[0_28px_80px_rgba(15,23,42,0.16)] backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-950">Сохранить этот тест в аккаунт?</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Он уже есть на этом устройстве. После сохранения он появится в кабинете и прогрессе.
          </p>
          {state === "error" ? <p className="mt-1 text-sm text-red-500">Не получилось сохранить. Проверьте Supabase env.</p> : null}
          {state === "saved" ? <p className="mt-1 text-sm text-emerald-700">Сохранено</p> : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            className="h-10 rounded-full px-4 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
            onClick={keepLocal}
            type="button"
          >
            Оставить локально
          </button>
          <button
            className="h-10 rounded-full bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
            disabled={state === "saving"}
            onClick={saveToAccount}
            type="button"
          >
            {state === "saving" ? "Сохраняю" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PageFrame({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={cn("mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:py-16", className)} id={id}>
      {children}
    </section>
  );
}

export function PageTitle({
  title,
  description,
  align = "left",
}: {
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col gap-4",
        align === "center" && "mx-auto items-center text-center"
      )}
    >
      <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
        {title}
      </h1>
      {description ? <p className="text-pretty text-lg leading-8 text-slate-600">{description}</p> : null}
    </div>
  );
}

export function QuietPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[1.75rem] border border-slate-900/[0.045] bg-white/88 shadow-[0_26px_90px_rgba(15,23,42,0.06)]", className)}>
      {children}
    </div>
  );
}
