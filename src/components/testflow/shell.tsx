"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LogOut, Menu, Moon, Settings, Sun, UserRound } from "lucide-react";

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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    queueMicrotask(() => {
      const nextTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      setTheme(nextTheme);
    });
  }, []);

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

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("trainova.theme", next);
      return next;
    });
  }

  return (
    <div className="trainova-page min-h-screen dark:bg-[#10142a] dark:text-white">
      <header className="sticky top-0 z-30 border-b border-[#d9dde8]/80 bg-[#f6f7fb]/92 backdrop-blur-xl transition-colors duration-200 dark:border-white/[0.10] dark:bg-[#10142a]/92">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
          <BrandLink />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#586380] md:flex">
            {navItems.map((item) => (
              <Link
                className={cn(
                  "transition-colors hover:text-[#4255ff]",
                  pathname === item.href && "text-[#282e3e] dark:text-white"
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                className="trainova-primary trainova-pill trainova-lift hidden h-10 items-center justify-center px-4 text-sm font-bold sm:inline-flex"
                href="/upload"
              >
                Загрузить тест
              </Link>
              <div className="md:hidden">
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
              </div>
              <UserMenu user={user} />
            </div>
          ) : (
            <GuestActions theme={theme} onToggleTheme={toggleTheme} />
          )}
        </div>
      </header>
      <main>{children}</main>
      <SaveLocalQuizPrompt user={user} />
    </div>
  );
}

function ThemeToggle({ theme, onToggle }: { theme: "light" | "dark"; onToggle: () => void }) {
  const isDark = theme === "dark";

  return (
    <button
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      className="trainova-lift flex size-10 shrink-0 items-center justify-center rounded-full border border-[#d9dde8] bg-white text-[#586380] shadow-[var(--shadow-soft)] transition dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.12]"
      onClick={onToggle}
      type="button"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function GuestActions({ theme, onToggleTheme }: { theme: "light" | "dark"; onToggleTheme: () => void }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link
        className="hidden h-10 items-center justify-center rounded-full px-4 text-sm font-bold text-[#586380] transition hover:text-[#4255ff] sm:inline-flex"
        href="/login"
      >
        Войти
      </Link>
      <Link
        className="trainova-primary trainova-pill trainova-lift inline-flex h-10 items-center justify-center gap-1.5 px-3 text-xs font-bold sm:gap-2 sm:px-4 sm:text-sm"
        href="/upload"
      >
        <span>Начать</span>
        <ArrowRight className="size-4" />
      </Link>
      <div className="md:hidden">
        <MobileMenu theme={theme} onToggleTheme={onToggleTheme} />
      </div>
    </div>
  );
}

function MobileMenu({ theme, onToggleTheme }: { theme: "light" | "dark"; onToggleTheme: () => void }) {
  return (
    <details className="group relative">
      <summary className="trainova-lift flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-[#d9dde8] bg-white text-[#586380] shadow-[var(--shadow-soft)] dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white">
        <Menu className="size-5" />
      </summary>
      <div className="trainova-card absolute right-0 mt-3 w-64 p-3 dark:border-white/[0.12] dark:bg-[#1f2540]">
        {navItems.map((item) => (
          <Link
            className="block rounded-lg px-3 py-3 text-sm font-bold text-[#586380] transition hover:bg-[#eef0ff] hover:text-[#4255ff] dark:text-[#c7cce0] dark:hover:bg-white/[0.08]"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
        <Link
          className="block rounded-lg px-3 py-3 text-sm font-bold text-[#586380] transition hover:bg-[#eef0ff] hover:text-[#4255ff] dark:text-[#c7cce0] dark:hover:bg-white/[0.08]"
          href="/login"
        >
          Войти
        </Link>
        <button
          className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-bold text-[#586380] transition hover:bg-[#eef0ff] hover:text-[#4255ff] dark:text-[#c7cce0] dark:hover:bg-white/[0.08]"
          onClick={onToggleTheme}
          type="button"
        >
          {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>
    </details>
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
      <summary className="trainova-lift flex cursor-pointer list-none items-center gap-3 rounded-full border border-[#d9dde8] bg-white px-2 py-1.5 shadow-[var(--shadow-soft)] transition dark:border-white/[0.12] dark:bg-white/[0.06]">
        <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-[#eef0ff] text-sm font-bold text-[#4255ff]">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="size-full object-cover" src={user.avatarUrl} />
          ) : (
            initials
          )}
        </span>
        <span className="hidden max-w-36 truncate text-sm font-bold text-[#586380] sm:block">
          {user.email}
        </span>
      </summary>
      <div className="trainova-card absolute right-0 mt-3 w-64 p-2 dark:border-white/[0.12] dark:bg-[#1f2540]">
        <div className="px-3 py-3">
          <p className="truncate text-sm font-bold text-[#282e3e] dark:text-white">{user.fullName || "Аккаунт Trainova"}</p>
          <p className="truncate text-sm text-[#586380] dark:text-[#c7cce0]">{user.email}</p>
        </div>
        <MenuLink href="/dashboard" label="Мой кабинет" />
        <MenuLink href="/progress" label="Прогресс" />
        <MenuLink href="/settings" label="Настройки" icon={<Settings className="size-4" />} />
        <Link
          className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-[#586380] transition hover:bg-[#eef0ff] hover:text-[#4255ff] dark:text-[#c7cce0] dark:hover:bg-white/[0.08]"
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
      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-[#586380] transition hover:bg-[#eef0ff] hover:text-[#4255ff] dark:text-[#c7cce0] dark:hover:bg-white/[0.08]"
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
    <div className="trainova-card fixed inset-x-4 bottom-4 z-40 mx-auto max-w-xl p-4 backdrop-blur dark:border-white/[0.12] dark:bg-[#1f2540]/95">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-[#282e3e] dark:text-white">Сохранить этот тест в аккаунт?</p>
          <p className="mt-1 text-sm leading-6 text-[#586380] dark:text-[#c7cce0]">
            Он уже есть на этом устройстве. После сохранения он появится в кабинете и прогрессе.
          </p>
          {state === "error" ? <p className="mt-1 text-sm text-red-500">Не получилось сохранить. Проверьте Supabase env.</p> : null}
          {state === "saved" ? <p className="mt-1 text-sm text-[#4255ff]">Сохранено</p> : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            className="h-10 rounded-full px-4 text-sm font-bold text-[#586380] transition hover:bg-[#eef0ff] hover:text-[#4255ff] dark:hover:bg-white/[0.08]"
            onClick={keepLocal}
            type="button"
          >
            Оставить локально
          </button>
          <button
            className="trainova-primary trainova-pill h-10 px-4 text-sm font-bold transition disabled:opacity-60"
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
    <section className={cn("mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-12 lg:py-16", className)} id={id}>
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
      <h1 className="text-balance text-[32px] font-bold leading-[1.15] tracking-normal text-[#282e3e] sm:text-[44px] sm:leading-[1.25] dark:text-white">
        {title}
      </h1>
      {description ? <p className="text-pretty text-base leading-[1.5] text-[#586380] sm:text-xl sm:leading-[1.4] dark:text-[#c7cce0]">{description}</p> : null}
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
    <div className={cn("trainova-card dark:border-white/[0.12] dark:bg-[#1f2540]", className)}>
      {children}
    </div>
  );
}
