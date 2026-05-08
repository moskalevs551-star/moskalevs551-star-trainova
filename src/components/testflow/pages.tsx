"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  GraduationCap,
  Save,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { extractImportCandidates, parseImportCandidate } from "@/lib/quiz/parser";
import { createDemoQuiz, createSampleQuiz, getSampleQuizzes, type SampleQuizKey } from "@/lib/quiz/sample";
import {
  fetchCloudTests,
  saveAttemptToAccount,
  saveLocalQuizToAccount,
  saveProgressStepToAccount,
  type CloudTestSummary,
} from "@/lib/quiz/cloud";
import { questionLimit, settingsForQuiz } from "@/lib/quiz/settings";
import {
  clearAttempt,
  ensureProgress,
  loadAttempt,
  loadProgress,
  loadQuiz,
  loadSettings,
  saveAttempt,
  saveProgress,
  saveQuiz,
  saveSettings,
} from "@/lib/quiz/storage";
import type {
  AttemptAnswer,
  ImportCandidate,
  QuizAnswer,
  QuizDocument,
  QuizQuestion,
  TestAttempt,
  TestMode,
  TestSettings,
} from "@/lib/quiz/types";
import { AppShell, PageFrame, PageTitle, QuietPanel } from "./shell";
import { TrainovaLogo } from "./logo";

const pageMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

const modeLabels: Record<TestMode, string> = {
  training: "Тренировка",
  exam: "Экзамен",
  quick: "Быстрый режим",
  mistakes: "Только ошибки",
  review: "Повторение",
  control: "Контрольная попытка",
  no_hints: "Без подсказок",
};

function useClientReady() {
  return useSyncExternalStore(
    (notify) => {
      queueMicrotask(notify);
      return () => undefined;
    },
    () => true,
    () => false
  );
}

export function LandingPage() {
  const router = useRouter();

  function startDemo() {
    const quiz = createDemoQuiz();
    saveQuiz(quiz);
    saveSettings(settingsForQuiz(quiz));
    router.push("/parse-result");
  }

  return (
    <AppShell>
      <PageFrame className="pb-8 pt-12 sm:pb-10 sm:pt-18 lg:pt-22">
        <motion.div {...pageMotion} className="mx-auto flex max-w-6xl flex-col items-center gap-10 text-center">
          <div className="flex max-w-4xl flex-col items-center gap-5 sm:gap-6">
            <h1 className="text-balance text-[40px] font-bold leading-[1.08] tracking-normal text-[#282e3e] sm:text-[56px] lg:text-[64px] dark:text-white">
              Загрузите тест — Trainova соберёт тренажёр
            </h1>
            <p className="max-w-3xl text-pretty text-base leading-7 text-[#586380] sm:text-xl sm:leading-8 dark:text-[#c7cce0]">
              Загрузите QST, TXT или ZIP — Trainova найдёт вопросы, ответы и поможет начать тренировку с сохранением прогресса.
            </p>
          </div>
          <div className="flex w-full max-w-lg flex-col justify-center gap-3 sm:flex-row">
              <Link
                className="trainova-primary trainova-pill trainova-lift inline-flex h-[52px] items-center justify-center gap-2 px-7 text-base font-bold"
                href="/upload"
              >
                Загрузить тест
                <ArrowRight className="size-5" />
              </Link>
              <Button
                className="trainova-secondary trainova-pill h-[52px] px-7 text-base font-bold"
                onClick={startDemo}
                variant="outline"
              >
                Попробовать демо
              </Button>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[#586380] dark:text-[#c7cce0]">
            Один главный сценарий: загрузить файл, проверить распознавание, настроить сессию и начать.
          </p>

          <CategoryCards />
          <HeroProductVisual />
        </motion.div>
      </PageFrame>
      <PageFrame className="pt-8" id="how-it-works">
        <div className="grid gap-4 py-12 md:grid-cols-3">
          {[
            ["Распознать", "QST/TXT/ZIP превращаются в единый JSON с проверкой структуры."],
            ["Проверить", "Ошибки формата видны спокойно: только то, что стоит поправить."],
            ["Учиться", "Один вопрос на экране, мягкая обратная связь и сохранение прогресса."],
          ].map(([title, text]) => (
            <div className="trainova-card trainova-lift flex flex-col gap-3 p-6" key={title}>
              <h2 className="text-xl font-bold tracking-normal text-[#282e3e] dark:text-white">{title}</h2>
              <p className="max-w-sm text-base leading-7 text-[#586380] dark:text-[#c7cce0]">{text}</p>
            </div>
          ))}
        </div>
      </PageFrame>
      <DemoPreviewSection />
      <SiteFooter />
    </AppShell>
  );
}

function CategoryCards() {
  const items = [
    ["Создать тренажёр", "Файл превращается в понятные вопросы", "#98e3ff"],
    ["Практика", "Короткие сессии без перегруза", "#ffc38c"],
    ["Повтор ошибок", "Возвращайтесь только к сложному", "#eeaaff"],
    ["Быстрый режим", "Темп, таймер и очки", "#423ed8"],
  ];

  return (
    <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([title, text, color], index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "trainova-lift rounded-lg p-5 text-left shadow-[0_4px_16px_rgba(40,46,62,0.1)]",
            color === "#423ed8" ? "text-white" : "text-[#282e3e]"
          )}
          initial={{ opacity: 0, y: 14 }}
          key={title}
          style={{ backgroundColor: color }}
          transition={{ delay: 0.12 + index * 0.06, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-lg font-bold leading-tight">{title}</p>
          <p className={cn("mt-2 text-sm leading-6", color === "#423ed8" ? "text-white/82" : "text-[#282e3e]/72")}>
            {text}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

function HeroProductVisual() {
  const files = [
    [".qst", "bg-[#eeaaff] text-[#282e3e]"],
    [".txt", "bg-[#98e3ff] text-[#282e3e]"],
    [".zip", "bg-[#ffc38c] text-[#282e3e]"],
  ];

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="relative mx-auto w-full max-w-[760px]"
      initial={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,#eeaaff_0%,rgba(238,170,255,0)_55%)] opacity-30" />
      <div className="relative overflow-hidden rounded-lg border border-[#d9dde8] bg-white p-5 shadow-[0_4px_16px_rgba(40,46,62,0.1)] dark:border-white/[0.12] dark:bg-[#1f2540]">
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 430 520">
          <path d="M72 92C160 72 196 130 215 194C238 274 304 288 360 258" stroke="#eeaaff" strokeDasharray="7 9" strokeLinecap="round" strokeWidth="2" />
          <path d="M70 342C132 298 190 326 229 374C260 411 309 423 371 395" stroke="#4255ff" strokeLinecap="round" strokeOpacity="0.38" strokeWidth="2" />
          <circle cx="72" cy="92" fill="#eeaaff" r="5" />
          <circle cx="360" cy="258" fill="#4255ff" r="6" />
          <circle cx="371" cy="395" fill="#ffc38c" r="5" />
        </svg>

        <div className="relative grid gap-4">
          <div className="grid grid-cols-[1fr_auto] items-start gap-4">
            <div className="space-y-3">
              {files.map(([label, tone], index) => (
                <motion.div
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-lg border border-[#d9dde8] bg-white p-3 shadow-[0_4px_16px_rgba(40,46,62,0.06)] dark:border-white/[0.12] dark:bg-white/[0.06]"
                  initial={{ opacity: 0, x: -12 }}
                  key={label}
                  transition={{ delay: 0.16 + index * 0.08, duration: 0.32 }}
                >
                  <span className={cn("flex size-9 items-center justify-center rounded-xl text-sm font-semibold", tone)}>
                    {label}
                  </span>
                  <span className="h-2 w-20 rounded-full bg-[#eef0f6] dark:bg-white/[0.14]" />
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex size-16 items-center justify-center rounded-full border border-[#d9dde8] bg-white shadow-[0_4px_16px_rgba(40,46,62,0.1)] dark:border-white/[0.12] dark:bg-white/[0.06]">
              <UploadCloud className="size-7 text-[#4255ff]" />
            </div>
          </div>

          <div className="ml-auto w-[82%] rounded-lg border border-[#d9dde8] bg-white p-4 shadow-[0_4px_16px_rgba(40,46,62,0.08)] dark:border-white/[0.12] dark:bg-white/[0.06]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#4255ff]" />
                <span className="h-2 w-20 rounded-full bg-[#eef0f6] dark:bg-white/[0.14]" />
              </div>
              <span className="rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-bold text-[#4255ff]">готово</span>
            </div>
            <div className="mt-5 space-y-3">
              <div className="h-3 w-3/4 rounded-full bg-[#d9dde8] dark:bg-white/[0.18]" />
              <div className="h-3 w-11/12 rounded-full bg-[#eef0f6] dark:bg-white/[0.12]" />
              <div className="grid gap-2 pt-2">
                <div className="h-10 rounded-lg border border-[#98e3ff] bg-[#98e3ff]/35" />
                <div className="h-10 rounded-lg border border-[#d9dde8] bg-[#f6f7fb] dark:bg-white/[0.06]" />
                <div className="h-10 rounded-lg border border-[#d9dde8] bg-[#f6f7fb] dark:bg-white/[0.06]" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#d9dde8] bg-white p-4 dark:border-white/[0.12] dark:bg-white/[0.06]">
              <p className="text-xs font-bold text-[#423ed8] dark:text-[#aeb7ff]">вопросы</p>
              <p className="mt-3 text-2xl font-bold tracking-normal text-[#282e3e] dark:text-white">24</p>
            </div>
            <div className="rounded-lg border border-[#d9dde8] bg-white p-4 dark:border-white/[0.12] dark:bg-white/[0.06]">
              <p className="text-xs font-bold text-[#4255ff] dark:text-[#aeb7ff]">ответы</p>
              <p className="mt-3 text-2xl font-bold tracking-normal text-[#282e3e] dark:text-white">96</p>
            </div>
            <div className="rounded-lg border border-[#d9dde8] bg-white p-4 dark:border-white/[0.12] dark:bg-white/[0.06]">
              <p className="text-xs font-bold text-[#d85d4e] dark:text-[#ff9a8f]">ошибки</p>
              <p className="mt-3 text-2xl font-bold tracking-normal text-[#282e3e] dark:text-white">3</p>
            </div>
          </div>

          <div className="rounded-lg border border-[#d9dde8] bg-white p-4 dark:border-white/[0.12] dark:bg-white/[0.06]">
            <div className="mb-3 flex items-center justify-between">
              <span className="h-2 w-24 rounded-full bg-[#eef0f6] dark:bg-white/[0.14]" />
              <span className="rounded-full bg-[#ffc38c]/45 px-3 py-1 text-xs font-bold text-[#9a4a18] dark:text-[#ffd8b7]">повтор ошибок</span>
            </div>
            <FlowProgress value={72} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DemoPreviewSection() {
  return (
    <PageFrame className="pt-8" id="features">
      <div className="mb-10 flex flex-col gap-4">
        <h2 className="text-balance text-[32px] font-bold leading-[1.27] tracking-normal text-[#282e3e] sm:text-[44px] dark:text-white">
          Как может выглядеть ваш тренажёр
        </h2>
        <p className="max-w-2xl text-lg leading-8 text-[#586380] dark:text-[#c7cce0]">
          После загрузки файла Trainova превращает вопросы в понятный интерактивный формат. Эти карточки — демо, не пользовательские данные.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <QuietPanel className="trainova-lift p-5 lg:col-span-2">
          <FlowProgress value={42} />
          <h3 className="mt-7 text-2xl font-bold tracking-normal text-[#282e3e] dark:text-white">
            Какой вариант лучше описывает активное повторение?
          </h3>
          <div className="mt-6 grid gap-3">
            {["Возвращаться к сложным вопросам", "Читать все ответы подряд", "Проходить только полный экзамен", "Не смотреть результат"].map((answer, index) => (
              <div
                className={cn(
                  "rounded-lg px-4 py-3 text-sm font-bold",
                  index === 0 ? "bg-[#98e3ff]/45 text-[#282e3e]" : "bg-[#f6f7fb] text-[#586380] dark:bg-white/[0.06] dark:text-[#c7cce0]"
                )}
                key={answer}
              >
                {answer}
              </div>
            ))}
          </div>
        </QuietPanel>
        <QuietPanel className="trainova-lift p-5">
          <p className="text-sm font-bold text-[#9a4a18] dark:text-[#ffd8b7]">Только ошибки</p>
          <h3 className="mt-4 text-3xl font-bold tracking-normal text-[#282e3e] dark:text-white">
            Повторяем 12 сложных вопросов
          </h3>
          <FlowProgress className="mt-8" value={58} />
        </QuietPanel>
        <QuietPanel className="trainova-lift p-5">
          <p className="text-sm font-bold text-[#4255ff] dark:text-[#aeb7ff]">Результат</p>
          <h3 className="mt-4 text-6xl font-bold tracking-normal text-[#282e3e] dark:text-white">86%</h3>
          <p className="mt-3 text-sm leading-6 text-[#586380] dark:text-[#c7cce0]">Правильно 26, ошибок 4</p>
          <div className="mt-7 inline-flex h-10 items-center rounded-full bg-[#4255ff] px-4 text-sm font-bold text-white">
            Повторить ошибки
          </div>
        </QuietPanel>
        <QuietPanel className="p-5 lg:col-span-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Режим", "Тренировка"],
              ["Вопросов", "20"],
              ["Порядок", "Случайно"],
              ["Таймер", "Без таймера"],
            ].map(([label, value]) => (
              <div className="rounded-lg bg-[#f6f7fb] p-4 dark:bg-white/[0.06]" key={label}>
                <p className="text-sm text-[#586380] dark:text-[#c7cce0]">{label}</p>
                <p className="mt-2 text-lg font-bold text-[#282e3e] dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        </QuietPanel>
      </div>
    </PageFrame>
  );
}

function SiteFooter() {
  const columns = [
    {
      title: "Product",
      links: [
        ["Возможности", "/#features"],
        ["Как это работает", "/#how-it-works"],
        ["Демо", "/demo"],
        ["Документация", "/docs"],
      ],
    },
    {
      title: "Resources",
      links: [
        ["Блог", "/blog"],
        ["Помощь", "/help"],
        ["Форматы файлов", "/formats"],
        ["Безопасность", "/security"],
      ],
    },
  ];

  return (
    <footer className="mt-12 border-t border-[#d9dde8] bg-white/80 dark:border-white/[0.12] dark:bg-[#1f2540]/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <BrandFooter />
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#586380] dark:text-[#c7cce0]">
            Trainova превращает старые файлы с тестами в современные интерактивные тренажёры.
          </p>
          <p className="mt-5 text-sm text-[#939bb4]">Created by M. Stanislav and G. Kutsenko</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-bold text-[#282e3e] dark:text-white">{column.title}</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-[#586380] dark:text-[#c7cce0]">
                {column.links.map(([item, href]) => (
                  <Link className="transition hover:text-[#4255ff]" href={href} key={href}>
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div>
            <h3 className="text-sm font-bold text-[#282e3e] dark:text-white">Authors</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[#586380] dark:text-[#c7cce0]">
              <span>M. Stanislav</span>
              <span>G. Kutsenko</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function BrandFooter() {
  return (
    <Link aria-label="Trainova" className="-ml-2 inline-flex rounded-lg px-2 py-1 transition hover:bg-white dark:hover:bg-white/[0.06]" href="/">
      <TrainovaLogo className="h-11" />
    </Link>
  );
}

function FlowProgress({ value, className }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      aria-label="Прогресс"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(safeValue)}
      className={cn("h-2 overflow-hidden rounded-full bg-[#e6e9f2] dark:bg-white/[0.12]", className)}
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#4255ff_0%,#98e3ff_42%,#eeaaff_72%,#ffc38c_100%)] transition-all duration-700"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export function AboutPage() {
  return (
    <AppShell>
      <PageFrame>
        <motion.div {...pageMotion} className="mx-auto flex max-w-4xl flex-col gap-10">
          <PageTitle
            description="Trainova создан как простой инструмент для превращения старых файлов с тестами в современные интерактивные тренажёры."
            title="О проекте"
          />
          <QuietPanel className="p-8 sm:p-10">
            <p className="text-xl leading-9 text-[#586380] dark:text-[#c7cce0]">
              Проект помогает быстро загрузить файл, проверить вопросы, настроить тренировку и сохранить прогресс. Главная идея — убрать ручную рутину и оставить понятный путь: импорт, проверка, тренировка, результат.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {["M. Stanislav", "G. Kutsenko"].map((author) => (
                <div className="rounded-lg bg-[#f6f7fb] p-5 dark:bg-white/[0.06]" key={author}>
                  <p className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]">Автор</p>
                  <p className="mt-2 text-2xl font-bold tracking-normal text-[#282e3e] dark:text-white">{author}</p>
                </div>
              ))}
            </div>
          </QuietPanel>
        </motion.div>
      </PageFrame>
    </AppShell>
  );
}

export function DemoPage() {
  const router = useRouter();
  const samples = getSampleQuizzes();

  function openDemo(key: SampleQuizKey) {
    const quiz = createSampleQuiz(key);
    saveQuiz(quiz);
    saveSettings(settingsForQuiz(quiz));
    router.push("/parse-result");
  }

  return (
    <AppShell>
      <PageFrame>
        <motion.div {...pageMotion} className="mx-auto flex max-w-5xl flex-col gap-10">
          <PageTitle
            description="Демо-тесты read-only и не попадают в личный кабинет, пока вы не сохраните копию в аккаунт."
            title="Попробуйте демо-тренажёр"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {samples.map((sample) => (
              <QuietPanel className="trainova-lift p-6" key={sample.key}>
                <p className="text-sm font-bold text-[#4255ff] dark:text-[#aeb7ff]">Демо</p>
                <h2 className="mt-4 text-3xl font-bold tracking-normal text-[#282e3e] dark:text-white">{sample.title}</h2>
                <p className="mt-3 text-sm text-[#586380] dark:text-[#c7cce0]">{sample.fileName}</p>
                <button
                  className="trainova-primary trainova-pill mt-8 inline-flex h-11 items-center justify-center px-5 text-sm font-bold"
                  onClick={() => openDemo(sample.key)}
                  type="button"
                >
                  Открыть демо
                </button>
              </QuietPanel>
            ))}
          </div>
        </motion.div>
      </PageFrame>
    </AppShell>
  );
}

export function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [status, setStatus] = useState<"idle" | "reading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");

  async function readFile(file: File) {
    if (file.size === 0) {
      setStatus("error");
      setMessage("Файл пустой. Выберите другой QST, TXT или ZIP.");
      return;
    }

    setStatus("reading");
    setMessage("Читаю файл и ищу тесты внутри.");

    try {
      const nextCandidates = await extractImportCandidates(file);
      const usableCandidates = nextCandidates.filter((candidate) => !candidate.ignored);
      setCandidates(nextCandidates);
      setStatus("ready");

      if (usableCandidates.length === 1) {
        await importCandidate(usableCandidates[0]);
      } else if (usableCandidates.length > 1) {
        setMessage("Нашёл несколько файлов. Выберите тот, который нужно распознать.");
      } else {
        setStatus("error");
        setMessage(nextCandidates[0]?.reason ?? "Поддерживаются только QST, TXT и ZIP.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Не получилось прочитать файл.");
    }
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (file) {
      void readFile(file);
    }
  }

  async function importCandidate(candidate: ImportCandidate) {
    setStatus("reading");
    setMessage("Распознаю вопросы и варианты ответов.");
    const quiz = await parseImportCandidate(candidate);
    saveQuiz(quiz);
    saveSettings(settingsForQuiz(quiz));
    router.push("/parse-result");
  }

  function startDemo() {
    const quiz = createDemoQuiz();
    saveQuiz(quiz);
    saveSettings(settingsForQuiz(quiz));
    router.push("/parse-result");
  }

  return (
    <AppShell>
      <PageFrame>
        <motion.div {...pageMotion} className="mx-auto flex max-w-3xl flex-col gap-7 sm:gap-10">
          <PageTitle
            align="center"
            description="Один спокойный шаг: выберите файл, а детали проверки появятся после распознавания."
            title="Загрузите тест"
          />
          <div
            className={cn(
              "group trainova-card flex min-h-[300px] flex-col items-center justify-center border-dashed px-4 text-center transition sm:min-h-[340px] sm:px-6",
              dragging && "border-[#4255ff] bg-[#eef0ff]",
              status === "reading" && "cursor-wait border-[#4255ff] bg-[#eef0ff]/80"
            )}
            onDragLeave={() => setDragging(false)}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files[0];
              if (file) {
                void readFile(file);
              }
            }}
          >
            <input
              className="sr-only"
              id="trainova-file-upload"
              onChange={handleFileInputChange}
              ref={inputRef}
              accept=".qst,.txt,.zip,text/plain,application/zip,application/x-zip-compressed"
              type="file"
            />
            <label
              className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg px-3 py-5 outline-none transition focus-within:ring-4 focus-within:ring-[#4255ff]/20 sm:px-5"
              htmlFor="trainova-file-upload"
            >
              <UploadCloud className="mb-5 size-11 text-[#4255ff] sm:mb-7 sm:size-12" />
              <h2 className="text-2xl font-bold tracking-normal text-[#282e3e] sm:text-3xl dark:text-white">
                <span className="sm:hidden">Выберите файл с телефона</span>
                <span className="hidden sm:inline">Перетащите файл сюда</span>
              </h2>
              <p className="mt-3 max-w-sm text-base leading-7 text-[#586380] dark:text-[#c7cce0]">
                Поддерживаются .qst, .txt и .zip. На телефоне откройте «Файлы» или «Проводник».
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#586380] dark:text-[#c7cce0]">
                Можно пройти без аккаунта. Войдите, когда захотите сохранить прогресс в облаке.
              </p>
              <span className="trainova-primary trainova-pill mt-6 inline-flex h-12 items-center justify-center px-6 text-sm font-bold sm:hidden">
                Выбрать файл
              </span>
              <p className="mt-6 text-sm leading-6 text-[#939bb4] sm:mt-8">
                {message || "EXE внутри архива будут проигнорированы."}
              </p>
            </label>
          </div>

          {candidates.length > 1 ? (
            <QuietPanel className="overflow-hidden">
              {candidates.map((candidate) => (
                <button
                  className="flex w-full items-center justify-between border-b border-[#d9dde8] px-5 py-4 text-left transition last:border-b-0 hover:bg-[#f6f7fb] dark:border-white/[0.12] dark:hover:bg-white/[0.06]"
                  disabled={candidate.ignored}
                  key={candidate.id}
                  onClick={() => void importCandidate(candidate)}
                  type="button"
                >
                  <span>
                    <span className="block font-bold text-[#282e3e] dark:text-white">{candidate.name}</span>
                    <span className="text-sm text-[#586380] dark:text-[#c7cce0]">{candidate.reason ?? "Можно распознать"}</span>
                  </span>
                  <ArrowRight className="size-4 text-[#939bb4]" />
                </button>
              ))}
            </QuietPanel>
          ) : null}

          <div className="text-center">
            <Button className="rounded-full px-5" onClick={startDemo} variant="ghost">
              Нет файла? Открыть демо
            </Button>
          </div>
        </motion.div>
      </PageFrame>
    </AppShell>
  );
}

export function ParseResultPage() {
  const router = useRouter();
  const ready = useClientReady();
  const [quiz] = useState<QuizDocument | null>(() => loadQuiz());
  const [showDetails, setShowDetails] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function saveCloudQuiz() {
    if (!quiz) {
      return;
    }

    setSaveState("saving");
    try {
      const saved = await saveLocalQuizToAccount({
        quiz,
        settings: loadSettings(quiz),
        progress: loadProgress(quiz.id),
      });
      saveQuiz({ ...quiz, cloudId: saved.id });
      setSaveState("saved");
      router.push(`/tests/${saved.id}`);
    } catch {
      setSaveState("error");
    }
  }

  if (!ready) {
    return <LoadingState title="Готовим результат распознавания" />;
  }

  if (!quiz) {
    return <EmptyState title="Сначала загрузите тест" action="Перейти к загрузке" href="/upload" />;
  }

  const validation = quiz.validation;
  const issueCount =
    validation.missingNumbers.length +
    validation.questionsWithoutCorrectAnswer.length +
    validation.questionsWithMultipleCorrectAnswers.length +
    validation.questionsWithTooFewAnswers.length +
    validation.questionsWithDuplicateAnswers.length +
    validation.formatIssues.length;

  return (
    <AppShell>
      <PageFrame>
        <motion.div {...pageMotion} className="mx-auto flex max-w-4xl flex-col gap-10">
          <PageTitle
            align="center"
            description={
              issueCount > 0
                ? `Есть ${issueCountText(issueCount)}, которые стоит проверить. Основной тест уже собран.`
                : "Структура выглядит аккуратно. Можно быстро проверить вопросы или сразу начать."
            }
            title={`Мы нашли ${validation.totalQuestions} вопросов`}
          />

          <QuietPanel className="p-8">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#4255ff] dark:text-[#aeb7ff]">
                  Результат распознавания
                </p>
                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  <SummaryNumber label="вариантов" value={validation.totalAnswers} />
                  <SummaryNumber label="правильных ответов" value={validation.totalCorrectAnswers} />
                  <SummaryNumber label="кодировка" value={quiz.encoding ?? "utf-8"} />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                <Button
                  className="trainova-primary trainova-pill h-12 px-6 text-base font-bold"
                  onClick={() => router.push("/editor")}
                >
                  Проверить вопросы
                </Button>
                <Button
                  className="trainova-secondary trainova-pill h-12 px-6 text-base font-bold"
                  onClick={() => router.push("/settings")}
                  variant="outline"
                >
                  Начать тренировку
                </Button>
                {!quiz.cloudId && !quiz.isDemo ? (
                  <Button
                    className="h-12 rounded-full px-6 text-base text-[#586380] hover:text-[#4255ff]"
                    disabled={saveState === "saving"}
                    onClick={() => void saveCloudQuiz()}
                    variant="ghost"
                  >
                    {saveState === "saving" ? "Сохраняем..." : "Сохранить тренажёр"}
                  </Button>
                ) : null}
              </div>
            </div>
            {saveState === "error" ? (
              <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                Не получилось сохранить в аккаунт. Войдите или проверьте Supabase env.
              </p>
            ) : null}

            <button
              className="mt-8 flex items-center gap-2 text-sm font-bold text-[#586380] transition hover:text-[#4255ff]"
              onClick={() => setShowDetails((value) => !value)}
              type="button"
            >
              Детали проверки
              <ChevronDown className={cn("size-4 transition", showDetails && "rotate-180")} />
            </button>

            <AnimatePresence initial={false}>
              {showDetails ? (
                <motion.div
                  animate={{ height: "auto", opacity: 1 }}
                  className="overflow-hidden"
                  exit={{ height: 0, opacity: 0 }}
                  initial={{ height: 0, opacity: 0 }}
                >
                  <div className="mt-6 grid gap-3 text-sm text-[#586380] sm:grid-cols-2 dark:text-[#c7cce0]">
                    <IssueLine label="Пропущенные номера" value={listOrZero(validation.missingNumbers)} />
                    <IssueLine label="Без правильного ответа" value={listOrZero(validation.questionsWithoutCorrectAnswer)} />
                    <IssueLine label="Несколько правильных" value={listOrZero(validation.questionsWithMultipleCorrectAnswers)} />
                    <IssueLine label="Мало вариантов" value={listOrZero(validation.questionsWithTooFewAnswers)} />
                    <IssueLine label="Дубликаты ответов" value={listOrZero(validation.questionsWithDuplicateAnswers)} />
                    <IssueLine label="Ошибки формата" value={validation.formatIssues.length || 0} />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </QuietPanel>
        </motion.div>
      </PageFrame>
    </AppShell>
  );
}

function SummaryNumber({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-3xl font-bold tracking-normal text-[#282e3e] dark:text-white">{value}</p>
      <p className="mt-1 text-sm text-[#586380] dark:text-[#c7cce0]">{label}</p>
    </div>
  );
}

function IssueLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[#d9dde8] py-3 dark:border-white/[0.12]">
      <span>{label}</span>
      <span className="font-bold text-[#282e3e] dark:text-white">{value}</span>
    </div>
  );
}

export function EditorPage() {
  const router = useRouter();
  const ready = useClientReady();
  const [quiz, setQuiz] = useState<QuizDocument | null>(() => loadQuiz());
  const [selectedId, setSelectedId] = useState<string>(() => loadQuiz()?.questions[0]?.id ?? "");
  const [filter, setFilter] = useState<"all" | "issues" | "missing_correct">("all");
  const [saved, setSaved] = useState(false);

  const questions = quiz?.questions ?? [];
  const filteredQuestions = questions.filter((question) => {
    if (filter === "issues") {
      return question.status !== "valid";
    }
    if (filter === "missing_correct") {
      return !question.answers.some((answer) => answer.correct);
    }
    return true;
  });
  const selected = questions.find((question) => question.id === selectedId) ?? filteredQuestions[0];

  function updateSelected(updater: (question: QuizQuestion) => QuizQuestion) {
    if (!quiz || !selected) {
      return;
    }
    const nextQuiz = {
      ...quiz,
      questions: quiz.questions.map((question) => (question.id === selected.id ? updater(question) : question)),
      updatedAt: new Date().toISOString(),
    };
    setQuiz(nextQuiz);
    setSaved(false);
  }

  function persist() {
    if (!quiz) {
      return;
    }
    saveQuiz(quiz);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  if (!ready) {
    return <LoadingState title="Открываем редактор" />;
  }

  if (!quiz || !selected) {
    return <EmptyState title="Нет теста для редактирования" action="Загрузить тест" href="/upload" />;
  }

  return (
    <AppShell>
      <PageFrame className="max-w-7xl">
        <motion.div {...pageMotion} className="flex flex-col gap-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <PageTitle
              description="Минимальный редактор: список, выбранный вопрос и только нужные настройки."
              title="Проверьте вопросы"
            />
            <div className="flex items-center gap-3">
              {saved ? <span className="text-sm font-bold text-[#4255ff] dark:text-[#aeb7ff]">Сохранено</span> : null}
              <Button className="trainova-secondary trainova-pill" onClick={persist} variant="outline">
                <Save data-icon="inline-start" />
                Сохранить
              </Button>
              <Button
                className="trainova-primary trainova-pill px-5 font-bold"
                onClick={() => {
                  persist();
                  router.push("/settings");
                }}
              >
                Сохранить и начать
              </Button>
            </div>
          </div>

          <div className="grid min-h-[620px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)_260px]">
            <QuietPanel className="overflow-hidden p-3">
              <div className="flex gap-2 p-2">
                {[
                  ["all", "Все"],
                  ["issues", "Ошибки"],
                  ["missing_correct", "Без ответа"],
                ].map(([value, label]) => (
                  <button
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm text-slate-500 transition",
                      filter === value && "bg-[#4255ff] text-white"
                    )}
                    key={value}
                    onClick={() => setFilter(value as typeof filter)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="max-h-[540px] overflow-auto">
                {filteredQuestions.map((question) => (
                  <button
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-[#f6f7fb] dark:hover:bg-white/[0.06]",
                      selected.id === question.id && "bg-[#eef0ff] dark:bg-[#4255ff]/20"
                    )}
                    key={question.id}
                    onClick={() => setSelectedId(question.id)}
                    type="button"
                  >
                    <span className="mt-0.5 text-sm font-bold text-[#939bb4]">{question.number}</span>
                    <span className="line-clamp-2 text-sm leading-6 text-[#586380] dark:text-[#c7cce0]">{question.text}</span>
                  </button>
                ))}
              </div>
            </QuietPanel>

            <QuietPanel className="p-6 sm:p-8">
              <label className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]" htmlFor="question-text">
                Вопрос {selected.number}
              </label>
              <textarea
                className="mt-3 min-h-28 w-full resize-none rounded-lg border border-[#d9dde8] bg-[#f6f7fb] p-4 text-2xl font-bold leading-snug tracking-normal text-[#282e3e] outline-none transition focus:border-[#4255ff] focus:bg-white dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white"
                id="question-text"
                onChange={(event) =>
                  updateSelected((question) => ({
                    ...question,
                    text: event.target.value,
                  }))
                }
                value={selected.text}
              />

              <div className="mt-8 flex flex-col gap-3">
                {selected.answers.map((answer) => (
                  <AnswerEditorRow
                    answer={answer}
                    key={answer.id}
                    onCorrect={() =>
                      updateSelected((question) => ({
                        ...question,
                        answers: question.answers.map((item) => ({
                          ...item,
                          correct: item.id === answer.id,
                        })),
                        status: "valid",
                      }))
                    }
                    onRemove={() =>
                      updateSelected((question) => ({
                        ...question,
                        answers: question.answers.filter((item) => item.id !== answer.id),
                      }))
                    }
                    onText={(text) =>
                      updateSelected((question) => ({
                        ...question,
                        answers: question.answers.map((item) => (item.id === answer.id ? { ...item, text } : item)),
                      }))
                    }
                  />
                ))}
              </div>
              <Button
                className="mt-5 rounded-full"
                onClick={() =>
                  updateSelected((question) => ({
                    ...question,
                    answers: [
                      ...question.answers,
                      {
                        id: `${question.id}-a${question.answers.length + 1}`,
                        text: "Новый вариант",
                        correct: false,
                      },
                    ],
                  }))
                }
                variant="ghost"
              >
                Добавить вариант
              </Button>
            </QuietPanel>

            <QuietPanel className="p-6">
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]">Статус</p>
                  <p className="mt-2 text-2xl font-bold text-[#282e3e] dark:text-white">
                    {selected.status === "valid" ? "Готов" : "Проверить"}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <ToggleLine
                    checked={Boolean(selected.flagged)}
                    label="Спорный вопрос"
                    onChange={() => updateSelected((question) => ({ ...question, flagged: !question.flagged }))}
                  />
                  <ToggleLine
                    checked={Boolean(selected.favorite)}
                    label="Избранный"
                    onChange={() => updateSelected((question) => ({ ...question, favorite: !question.favorite }))}
                  />
                  <ToggleLine
                    checked={Boolean(selected.difficult)}
                    label="Сложный"
                    onChange={() => updateSelected((question) => ({ ...question, difficult: !question.difficult }))}
                  />
                </div>
                <div className="rounded-lg bg-[#98e3ff]/35 p-4 text-sm leading-6 text-[#282e3e] dark:bg-[#4255ff]/18 dark:text-[#e9ecff]">
                  Совет: исправьте только спорные места. Остальное можно оставить как есть и начать тренировку.
                </div>
              </div>
            </QuietPanel>
          </div>
        </motion.div>
      </PageFrame>
    </AppShell>
  );
}

function AnswerEditorRow({
  answer,
  onCorrect,
  onRemove,
  onText,
}: {
  answer: QuizAnswer;
  onCorrect: () => void;
  onRemove: () => void;
  onText: (text: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-2 ring-1 ring-[#d9dde8] dark:bg-white/[0.06] dark:ring-white/[0.12]">
      <button
        aria-label="Отметить правильным"
        className={cn(
          "size-8 rounded-full border transition",
          answer.correct ? "border-emerald-500 bg-emerald-500" : "border-[#d9dde8] bg-white dark:bg-white/[0.08]"
        )}
        onClick={onCorrect}
        type="button"
      />
      <input
        className="min-w-0 flex-1 bg-transparent px-1 text-base text-[#282e3e] outline-none dark:text-white"
        onChange={(event) => onText(event.target.value)}
        value={answer.text}
      />
      <Button className="rounded-full text-[#939bb4] hover:text-red-500" onClick={onRemove} size="sm" variant="ghost">
        Удалить
      </Button>
    </div>
  );
}

export function SettingsPage() {
  const router = useRouter();
  const ready = useClientReady();
  const [quiz] = useState<QuizDocument | null>(() => loadQuiz());
  const [settings, setSettings] = useState<TestSettings>(() => {
    const current = loadQuiz();
    return loadSettings(current);
  });
  const [activeTab, setActiveTab] = useState("Основное");
  const [showAdvanced, setShowAdvanced] = useState(false);

  function updateSettings(updater: (settings: TestSettings) => TestSettings) {
    setSettings((current) => updater(current));
  }

  function persistAndStart() {
    const range = validateQuestionRange(settings, quiz);
    if (!range.valid) {
      return;
    }

    saveSettings(settings);
    clearAttempt();
    router.push("/test");
  }

  if (!ready) {
    return <LoadingState title="Готовим настройки" />;
  }

  if (!quiz) {
    return <EmptyState title="Сначала нужен тест" action="Загрузить тест" href="/upload" />;
  }

  const tabs = [
    "Основное",
    "Вопросы",
    "Ответы",
    "Прохождение",
    "Таймер",
    "Попытки",
    "Проверка ответов",
    "Прогресс",
    "Результаты",
    "Доступ",
    "Внешний вид",
    "Импорт",
  ];
  const range = validateQuestionRange(settings, quiz);

  return (
    <AppShell>
      <PageFrame>
        <motion.div {...pageMotion} className="mx-auto flex max-w-4xl flex-col gap-9">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <PageTitle
              description="Выберите только главное. Полные параметры можно открыть отдельно."
              title="Настройка тренировки"
            />
            <Button
              className="trainova-primary trainova-pill h-12 px-7 text-base font-bold"
              disabled={!range.valid}
              onClick={persistAndStart}
            >
              Начать тренировку
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>

          <QuietPanel className="p-6 sm:p-8">
            <div className="grid gap-8 md:grid-cols-2">
              <QuickChoice
                label="Режим"
                options={[
                  ["training", "Тренировка"],
                  ["exam", "Экзамен"],
                  ["mistakes", "Только ошибки"],
                  ["quick", "Быстрый режим"],
                ]}
                value={settings.mode.type}
                onChange={(value) =>
                  updateSettings((current) => ({
                    ...current,
                    mode: { ...current.mode, type: value as TestMode },
                    timer:
                      value === "quick"
                        ? { ...current.timer, enabled: true, type: "per_question", secondsPerQuestion: current.timer.secondsPerQuestion ?? 15 }
                        : current.timer.type === "per_question"
                          ? { ...current.timer, enabled: false, type: "whole_test", minutes: null }
                          : current.timer,
                  }))
                }
              />
              <QuickChoice
                label="Количество вопросов"
                options={[
                  ["10", "10"],
                  ["20", "20"],
                  ["50", "50"],
                  ["all", "Все"],
                  ["range", "Свой диапазон"],
                ]}
                value={settings.questions.questionCount}
                onChange={(value) =>
                  updateSettings((current) => ({
                    ...current,
                    questions: {
                      ...current.questions,
                      questionCount: value as TestSettings["questions"]["questionCount"],
                      rangeFrom: Math.min(Math.max(current.questions.rangeFrom || 1, 1), maxQuestionNumber(quiz)),
                      rangeTo: Math.min(Math.max(current.questions.rangeTo || maxQuestionNumber(quiz), 1), maxQuestionNumber(quiz)),
                    },
                  }))
                }
              />
              {settings.questions.questionCount === "range" ? (
                <div className="rounded-lg bg-[#f6f7fb] p-5 dark:bg-white/[0.06] md:col-span-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]">С вопроса</span>
                      <input
                        className="trainova-input h-11 px-4 text-base outline-none transition"
                        max={maxQuestionNumber(quiz)}
                        min={1}
                        onChange={(event) =>
                          updateSettings((current) => ({
                            ...current,
                            questions: { ...current.questions, rangeFrom: Number(event.target.value || 1) },
                          }))
                        }
                        type="number"
                        value={settings.questions.rangeFrom}
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]">По вопрос</span>
                      <input
                        className="trainova-input h-11 px-4 text-base outline-none transition"
                        max={maxQuestionNumber(quiz)}
                        min={1}
                        onChange={(event) =>
                          updateSettings((current) => ({
                            ...current,
                            questions: { ...current.questions, rangeTo: Number(event.target.value || quiz.questions.length) },
                          }))
                        }
                        type="number"
                        value={settings.questions.rangeTo}
                      />
                    </label>
                  </div>
                  <p className={cn("mt-3 text-sm leading-6", range.valid ? "text-[#586380] dark:text-[#c7cce0]" : "text-red-500")}>
                    {range.message}
                  </p>
                </div>
              ) : null}
              <QuickChoice
                label="Порядок"
                options={[
                  ["file", "По порядку"],
                  ["random", "Случайно"],
                ]}
                value={settings.questions.questionOrder === "random" ? "random" : "file"}
                onChange={(value) =>
                  updateSettings((current) => ({
                    ...current,
                    questions: {
                      ...current.questions,
                      questionOrder: value as TestSettings["questions"]["questionOrder"],
                    },
                  }))
                }
              />
              <QuickChoice
                label="Ответы"
                options={[
                  ["file", "Как в файле"],
                  ["safe_random", "Перемешать"],
                ]}
                value={settings.answers.answerOrder}
                onChange={(value) =>
                  updateSettings((current) => ({
                    ...current,
                    answers: { ...current.answers, answerOrder: value as TestSettings["answers"]["answerOrder"] },
                  }))
                }
              />
              <QuickChoice
                label="Показывать правильный ответ"
                options={[
                  ["immediately", "Сразу"],
                  ["end", "В конце"],
                  ["never", "Не показывать"],
                ]}
                value={settings.review.showCorrectAnswer}
                onChange={(value) =>
                  updateSettings((current) => ({
                    ...current,
                    review: {
                      ...current.review,
                      showCorrectAnswer: value as TestSettings["review"]["showCorrectAnswer"],
                    },
                  }))
                }
              />
              <QuickChoice
                label="Таймер"
                options={[
                  ["off", "Без таймера"],
                  ["30", "30 минут"],
                  ["custom", "Свой вариант"],
                ]}
                value={!settings.timer.enabled || settings.timer.type === "per_question" ? "off" : settings.timer.minutes === 30 ? "30" : "custom"}
                onChange={(value) =>
                  updateSettings((current) => ({
                    ...current,
                    timer: {
                      ...current.timer,
                      type: "whole_test",
                      enabled: value !== "off",
                      minutes:
                        value === "30"
                          ? 30
                          : value === "custom"
                            ? current.timer.minutes && current.timer.minutes !== 30
                              ? current.timer.minutes
                              : 45
                            : null,
                    },
                  }))
                }
              />
              {settings.timer.enabled && settings.timer.type === "whole_test" && settings.timer.minutes !== 30 ? (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]">Своё время, минут</span>
                  <input
                    className="trainova-input h-11 px-4 text-base outline-none transition"
                    inputMode="numeric"
                    max={240}
                    min={1}
                    onChange={(event) => {
                      const nextMinutes = Math.min(Math.max(Number(event.target.value || 1), 1), 240);
                      updateSettings((current) => ({
                        ...current,
                        timer: { ...current.timer, enabled: true, type: "whole_test", minutes: nextMinutes },
                      }));
                    }}
                    onFocus={(event) => event.currentTarget.select()}
                    type="number"
                    value={settings.timer.minutes ?? 45}
                  />
                  <span className="text-sm leading-6 text-[#586380] dark:text-[#c7cce0]">Тест завершится автоматически, когда время закончится.</span>
                </label>
              ) : null}
              {settings.mode.type === "quick" ? (
                <QuickChoice
                  label="Время на вопрос"
                  options={[
                    ["10", "10 сек"],
                    ["15", "15 сек"],
                    ["20", "20 сек"],
                    ["30", "30 сек"],
                  ]}
                  value={String(settings.timer.secondsPerQuestion ?? 15)}
                  onChange={(value) =>
                    updateSettings((current) => ({
                      ...current,
                      timer: {
                        ...current.timer,
                        enabled: true,
                        type: "per_question",
                        secondsPerQuestion: Number(value),
                      },
                    }))
                  }
                />
              ) : null}
              <div className="rounded-lg bg-[#f6f7fb] p-4 dark:bg-white/[0.06] md:col-span-2">
                <ToggleLine
                  checked={settings.mode.allowBack}
                  label="Можно возвращаться назад"
                  onChange={() =>
                    updateSettings((current) => ({
                      ...current,
                      mode: { ...current.mode, allowBack: !current.mode.allowBack },
                    }))
                  }
                />
                <p className="mt-3 text-sm leading-6 text-[#586380] dark:text-[#c7cce0]">
                  Если включено, во время обычного теста появится кнопка «Назад». Пропущенный вопрос можно открыть позже и ответить.
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-col justify-between gap-3 border-t border-[#d9dde8] pt-6 dark:border-white/[0.12] sm:flex-row sm:items-center">
              <p className="text-sm leading-6 text-[#586380] dark:text-[#c7cce0]">
                {quiz.questions.length} вопросов в тесте. Обычную тренировку можно запустить прямо сейчас.
              </p>
              <button
                className="inline-flex items-center gap-2 text-sm font-bold text-[#4255ff] transition hover:text-[#423ed8]"
                onClick={() => setShowAdvanced((value) => !value)}
                type="button"
              >
                Расширенные настройки
                <ChevronDown className={cn("size-4 transition", showAdvanced && "rotate-180")} />
              </button>
            </div>
          </QuietPanel>

          <AnimatePresence initial={false}>
            {showAdvanced ? (
              <motion.div
                animate={{ height: "auto", opacity: 1 }}
                className="overflow-hidden"
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
              >
                <QuietPanel className="overflow-hidden">
                  <div className="flex gap-1 overflow-x-auto border-b border-[#d9dde8] p-3 dark:border-white/[0.12]">
                    {tabs.map((tab) => (
                      <button
                        className={cn(
                          "shrink-0 rounded-full px-4 py-2 text-sm font-bold text-[#586380] transition hover:text-[#4255ff] dark:text-[#c7cce0]",
                          activeTab === tab && "bg-[#4255ff] text-white hover:text-white"
                        )}
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        type="button"
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="p-6 sm:p-8">{renderSettingsTab(activeTab, settings, updateSettings, quiz)}</div>
                </QuietPanel>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </PageFrame>
    </AppShell>
  );
}

function validateQuestionRange(settings: TestSettings, quiz: QuizDocument | null) {
  if (!quiz || settings.questions.questionCount !== "range") {
    return { valid: true, count: quiz?.questions.length ?? 0, message: "" };
  }

  const from = Math.floor(Number(settings.questions.rangeFrom));
  const to = Math.floor(Number(settings.questions.rangeTo));
  const max = maxQuestionNumber(quiz);

  if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < 1 || from > max || to > max || from > to) {
    return { valid: false, count: 0, message: "Проверьте диапазон вопросов" };
  }

  const count = quiz.questions.filter((question) => question.number >= from && question.number <= to).length;

  if (count === 0) {
    return { valid: false, count, message: "В этом диапазоне нет вопросов" };
  }

  return {
    valid: true,
    count,
    message: `Будет выбрано ${count} ${pluralizeQuestions(count)} из диапазона ${from}-${to}`,
  };
}

function maxQuestionNumber(quiz: QuizDocument) {
  return Math.max(...quiz.questions.map((question) => question.number), quiz.questions.length);
}

function pluralizeQuestions(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "вопрос";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "вопроса";
  }

  return "вопросов";
}

function QuickChoice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<[string, string]>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-bold text-[#586380] dark:text-[#c7cce0]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([optionValue, optionLabel]) => (
          <button
            className={cn(
              "rounded-full border border-[#d9dde8] bg-white px-4 py-2 text-sm font-bold text-[#586380] transition hover:border-[#4255ff]/45 hover:bg-[#eef0ff] dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-[#c7cce0] dark:hover:bg-white/[0.10]",
              value === optionValue && "border-[#4255ff] bg-[#4255ff] text-white hover:bg-[#423ed8] dark:border-[#7b88ff] dark:bg-[#7b88ff] dark:text-white"
            )}
            key={optionValue}
            onClick={() => onChange(optionValue)}
            type="button"
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function renderSettingsTab(
  tab: string,
  settings: TestSettings,
  update: (updater: (settings: TestSettings) => TestSettings) => void,
  quiz: QuizDocument
) {
  if (tab === "Основное") {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Название"
          value={settings.general.title}
          onChange={(value) => update((current) => ({ ...current, general: { ...current.general, title: value } }))}
        />
        <TextField
          label="Категория"
          value={settings.general.category}
          onChange={(value) => update((current) => ({ ...current, general: { ...current.general, category: value } }))}
        />
        <TextField
          className="md:col-span-2"
          label="Описание"
          value={settings.general.description}
          onChange={(value) => update((current) => ({ ...current, general: { ...current.general, description: value } }))}
        />
      </div>
    );
  }

  if (tab === "Вопросы") {
    return (
      <SettingsRows
        rows={[
          ["Всего в тесте", `${quiz.questions.length}`],
          ["Выбор", selectionLabel(settings.questions.questionSelection)],
          ["Порядок", orderLabel(settings.questions.questionOrder)],
        ]}
      />
    );
  }

  if (tab === "Ответы") {
    return (
      <div className="flex flex-col gap-4">
        <ToggleLine
          checked={settings.answers.protectSpecialAnswers}
          label="Не перемешивать специальные варианты"
          onChange={() =>
            update((current) => ({
              ...current,
              answers: { ...current.answers, protectSpecialAnswers: !current.answers.protectSpecialAnswers },
            }))
          }
        />
        <SettingsRows rows={[["Порядок ответов", answerOrderLabel(settings.answers.answerOrder)]]} />
      </div>
    );
  }

  if (tab === "Прохождение") {
    return (
      <div className="flex flex-col gap-4">
        <ToggleLine
          checked={settings.mode.allowSkip}
          label="Разрешить пропуск"
          onChange={() => update((current) => ({ ...current, mode: { ...current.mode, allowSkip: !current.mode.allowSkip } }))}
        />
        <ToggleLine
          checked={settings.mode.allowBack}
          label="Разрешить кнопку «Назад»"
          onChange={() => update((current) => ({ ...current, mode: { ...current.mode, allowBack: !current.mode.allowBack } }))}
        />
        <ToggleLine
          checked={settings.mode.showHints}
          label="Показывать подсказки"
          onChange={() => update((current) => ({ ...current, mode: { ...current.mode, showHints: !current.mode.showHints } }))}
        />
      </div>
    );
  }

  if (tab === "Таймер") {
    return (
      <div className="flex flex-col gap-4">
        <ToggleLine
          checked={settings.timer.enabled}
          label="Включить таймер"
          onChange={() => update((current) => ({ ...current, timer: { ...current.timer, enabled: !current.timer.enabled, type: "whole_test", minutes: 30 } }))}
        />
        <SettingsRows rows={[["По умолчанию", settings.timer.enabled ? `${settings.timer.minutes ?? 30} минут` : "Без таймера"]]} />
      </div>
    );
  }

  if (tab === "Попытки") {
    return (
      <SettingsRows
        rows={[
          ["Лимит", settings.attempts.limitEnabled ? `${settings.attempts.maxAttempts ?? 3}` : "Без ограничений"],
          ["История", settings.attempts.saveAttemptHistory ? "Сохранять" : "Не сохранять"],
          ["Лучший результат", settings.attempts.saveBestResult ? "Сохранять" : "Не сохранять"],
        ]}
      />
    );
  }

  if (tab === "Проверка ответов") {
    return (
      <SettingsRows
        rows={[
          ["Правильный ответ", reviewLabel(settings.review.showCorrectAnswer)],
          ["Объяснения", explanationLabel(settings.review.showExplanation)],
          ["Формат оценки", "Процент, баллы и список ошибок"],
        ]}
      />
    );
  }

  if (tab === "Прогресс") {
    return (
      <div className="flex flex-col gap-4">
        <ToggleLine checked={settings.progress.saveProgress} label="Сохранять прогресс" onChange={() => update((current) => ({ ...current, progress: { ...current.progress, saveProgress: !current.progress.saveProgress } }))} />
        <SettingsRows rows={[["Сохранять", "позицию, ошибки, время, избранное, сложные вопросы"]]} />
      </div>
    );
  }

  if (tab === "Результаты") {
    return <SettingsRows rows={[["Показывать", "процент, ошибки, время, лучший результат"], ["Действие", "Повторить ошибки"]]} />;
  }

  if (tab === "Доступ") {
    return <SettingsRows rows={[["Видимость", accessLabel(settings.access.visibility)], ["Копирование", settings.access.allowCopy ? "Разрешено" : "Запрещено"]]} />;
  }

  if (tab === "Внешний вид") {
    return <SettingsRows rows={[["Тема", appearanceLabel(settings.appearance.theme)], ["Формат", "Один вопрос на экран"], ["Анимации", "Включены"]]} />;
  }

  return (
    <SettingsRows
      rows={[
        ["Кодировка", settings.import.encodingFallbacks.join(" → ")],
        ["Пустые строки", "Игнорировать"],
        ["EXE в ZIP", "Игнорировать и никогда не запускать"],
        ["Проверка", "номера, ответы, дубликаты, формат"],
      ]}
    />
  );
}

function TextField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]">{label}</span>
      <input
        className="trainova-input h-12 px-4 text-base outline-none transition"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function ToggleLine({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      className="flex w-full items-center justify-between gap-4 rounded-lg bg-[#f6f7fb] px-4 py-3 text-left transition hover:bg-[#eef0ff] dark:bg-white/[0.06] dark:hover:bg-white/[0.10]"
      onClick={onChange}
      type="button"
    >
      <span className="font-bold text-[#282e3e] dark:text-white">{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-[#4255ff]" : "bg-[#d9dde8] dark:bg-white/[0.18]"
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-4 rounded-full bg-white transition",
            checked ? "left-6" : "left-1"
          )}
        />
      </span>
    </button>
  );
}

function SettingsRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="flex flex-col">
      {rows.map(([label, value]) => (
        <div className="flex items-center justify-between gap-6 border-b border-[#d9dde8] py-4 last:border-b-0 dark:border-white/[0.12]" key={label}>
          <span className="text-[#586380] dark:text-[#c7cce0]">{label}</span>
          <span className="text-right font-bold text-[#282e3e] dark:text-white">{value}</span>
        </div>
      ))}
    </div>
  );
}

export function TestPage() {
  const router = useRouter();
  const ready = useClientReady();
  const [initialState] = useState(createInitialTestState);
  const [quiz] = useState<QuizDocument | null>(initialState.quiz);
  const [settings] = useState<TestSettings>(initialState.settings);
  const [questions] = useState<QuizQuestion[]>(initialState.questions);
  const initialQuestion = initialState.questions[Math.min(initialState.index, Math.max(initialState.questions.length - 1, 0))];
  const initialAnswer = initialQuestion ? initialState.answers.find((answer) => answer.questionId === initialQuestion.id) : undefined;
  const [index, setIndex] = useState(initialState.index);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | undefined>(initialAnswer?.selectedAnswerId);
  const [answered, setAnswered] = useState(() => Boolean(initialAnswer && !initialAnswer.skipped && usesImmediateFeedback(settings)));
  const [answers, setAnswers] = useState<AttemptAnswer[]>(initialState.answers);
  const startedAtRef = useRef(initialState.startedAt);
  const finishedRef = useRef(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => elapsedSecondsSince(startedAtRef.current));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSeconds(elapsedSecondsSince(startedAtRef.current));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const timerLimitSeconds =
    settings.timer.enabled && settings.timer.type === "whole_test" && settings.timer.minutes
      ? settings.timer.minutes * 60
      : null;
  const remainingSeconds = timerLimitSeconds ? Math.max(timerLimitSeconds - elapsedSeconds, 0) : null;

  useEffect(() => {
    if (!timerLimitSeconds || finishedRef.current || !quiz || questions.length === 0 || elapsedSeconds < timerLimitSeconds) {
      return;
    }

    finish(answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSeconds, timerLimitSeconds]);

  if (!ready) {
    return <LoadingState title="Собираем тренировку" />;
  }

  if (!quiz || questions.length === 0) {
    const emptyTitle = settings.mode.type === "mistakes" ? "Ошибок нет" : "Нет вопросов для прохождения";
    const emptyDescription =
      settings.mode.type === "mistakes"
        ? "Отличный результат. В этом тесте пока нет вопросов для повторения."
        : undefined;

    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={settings.mode.type === "mistakes" ? "В кабинет" : "Загрузить тест"}
        href={settings.mode.type === "mistakes" ? "/dashboard" : "/upload"}
      />
    );
  }

  if (settings.mode.type === "quick") {
    return (
      <GameTestRunner
        quiz={quiz}
        settings={settings}
        questions={questions}
        initialIndex={index}
        initialAnswers={answers}
        initialStartedAt={startedAtRef.current}
      />
    );
  }

  const activeQuiz = quiz;
  const question = questions[Math.min(index, questions.length - 1)];
  const shouldShowImmediateFeedback = usesImmediateFeedback(settings);
  const storedAnswer = answers.find((answer) => answer.questionId === question.id);
  const hasSubmittedCurrentAnswer = answered || Boolean(storedAnswer && !storedAnswer.skipped && shouldShowImmediateFeedback);
  const effectiveSelectedAnswerId = selectedAnswerId ?? storedAnswer?.selectedAnswerId;
  const progress = Math.round(((index + (hasSubmittedCurrentAnswer ? 1 : 0)) / questions.length) * 100);
  const selectedAnswer = question.answers.find((answer) => answer.id === effectiveSelectedAnswerId);
  const isCorrect = Boolean(selectedAnswer?.correct);
  const correctAnswer = question.answers.find((answer) => answer.correct);

  function submitAnswer(skipped = false) {
    if (!question || hasSubmittedCurrentAnswer) {
      return;
    }

    const answer: AttemptAnswer = {
      questionId: question.id,
      selectedAnswerId: effectiveSelectedAnswerId,
      correct: skipped ? false : isCorrect,
      skipped,
      answeredAt: new Date().toISOString(),
    };
    const nextAnswers = [...answers.filter((item) => item.questionId !== question.id), answer];

    setAnswers(nextAnswers);
    void saveProgressStepToAccount({ quiz: activeQuiz, answers: nextAnswers, currentQuestionId: question.id });

    if (skipped && settings.mode.allowBack) {
      goNext(nextAnswers);
      return;
    }

    if (shouldShowImmediateFeedback) {
      setAnswered(true);
      return;
    }

    goNext(nextAnswers);
  }

  function restoreAnswerState(nextIndex: number, nextAnswers = answers) {
    const nextQuestion = questions[nextIndex];
    const savedAnswer = nextQuestion ? nextAnswers.find((item) => item.questionId === nextQuestion.id) : undefined;

    setSelectedAnswerId(savedAnswer?.selectedAnswerId);
    setAnswered(Boolean(savedAnswer && !savedAnswer.skipped && shouldShowImmediateFeedback));
  }

  function saveActiveAttempt(nextIndex: number, nextAnswers = answers) {
    saveAttempt({
      id: "active",
      testId: activeQuiz.id,
      startedAt: startedAtRef.current,
      currentIndex: nextIndex,
      answers: nextAnswers,
      score: scoreOf(nextAnswers),
      timeSpentSeconds: elapsedSecondsSince(startedAtRef.current),
      completed: false,
    });
  }

  function goNext(nextAnswers = answers) {
    if (index >= questions.length - 1) {
      finish(nextAnswers);
      return;
    }

    const nextIndex = index + 1;
    setIndex(nextIndex);
    restoreAnswerState(nextIndex, nextAnswers);
    saveActiveAttempt(nextIndex, nextAnswers);
  }

  function goBack() {
    if (!settings.mode.allowBack || index === 0) {
      return;
    }

    const previousIndex = index - 1;
    setIndex(previousIndex);
    restoreAnswerState(previousIndex, answers);
    saveActiveAttempt(previousIndex, answers);
  }

  function finish(finalAnswers = answers) {
    if (finishedRef.current) {
      return;
    }

    finishedRef.current = true;
    const finishedAt = new Date();
    const timeSpentSeconds = elapsedSecondsBetween(startedAtRef.current, finishedAt);
    const completedAttempt: TestAttempt = {
      id: crypto.randomUUID(),
      testId: activeQuiz.id,
      startedAt: startedAtRef.current,
      finishedAt: finishedAt.toISOString(),
      currentIndex: questions.length - 1,
      answers: finalAnswers,
      score: scoreOf(finalAnswers),
      timeSpentSeconds,
      completed: true,
    };

    saveAttempt(completedAttempt);
    const progressState = ensureProgress(activeQuiz.id);
    const wrongIds = Array.from(new Set(finalAnswers.filter((answer) => !answer.correct).map((answer) => answer.questionId)));
    const attempts = [...progressState.attempts, completedAttempt].slice(-10);
    const bestScore = Math.max(progressState.bestScore, completedAttempt.score);
    const averageScore = Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length);

    saveProgress({
      ...progressState,
      lastQuestionId: question.id,
      solvedToday: progressState.solvedToday + finalAnswers.length,
      streak: Math.max(progressState.streak, 1),
      bestScore,
      averageScore,
      wrongQuestionIds: wrongIds,
      attempts,
    });
    void saveAttemptToAccount({ quiz: activeQuiz, attempt: completedAttempt });
    router.push("/results");
  }

  return (
    <AppShell>
      <PageFrame className="py-8 lg:py-10">
        <motion.div {...pageMotion} className="mx-auto max-w-4xl">
          <div className="mb-7 flex flex-wrap items-center gap-4">
            <FlowProgress className="flex-1" value={progress} />
            <span className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]">
              {index + 1}/{questions.length}
            </span>
            <span className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-sm font-bold text-[#586380] ring-1 ring-[#d9dde8] dark:bg-white/[0.06] dark:text-[#c7cce0] dark:ring-white/[0.12]">
              {remainingSeconds !== null ? `Осталось ${formatTime(remainingSeconds)}` : `Время ${formatTime(elapsedSeconds)}`}
            </span>
          </div>

          <div className="trainova-card min-h-[430px] p-5 sm:p-8">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-[#4255ff] dark:text-[#aeb7ff]">
              {modeLabels[settings.mode.type]}
            </p>
            <h1 className="max-w-3xl text-pretty text-2xl font-bold leading-[1.28] tracking-normal text-[#282e3e] sm:text-[32px] dark:text-white">
              {question.text}
            </h1>
            <div className="mt-8 grid gap-3">
              {question.answers.map((answer) => {
                const selected = effectiveSelectedAnswerId === answer.id;
                const revealCorrect = hasSubmittedCurrentAnswer && answer.correct;
                const revealWrong = hasSubmittedCurrentAnswer && selected && !answer.correct;

                return (
                  <button
                    className={cn(
                      "w-full rounded-lg border border-[#d9dde8] bg-white p-4 text-left text-base font-bold leading-7 text-[#282e3e] transition hover:-translate-y-0.5 hover:border-[#4255ff]/45 hover:bg-[#f6f7fb] sm:p-5 sm:text-lg dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white",
                      selected && "border-[#4255ff] bg-[#eef0ff] dark:bg-[#4255ff]/20",
                      revealCorrect && "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/18 dark:text-emerald-100",
                      revealWrong && "answer-wrong-shake border-red-300 bg-red-50 text-red-950 dark:bg-red-500/18 dark:text-red-100"
                    )}
                    disabled={hasSubmittedCurrentAnswer}
                    key={answer.id}
                    onClick={() => setSelectedAnswerId(answer.id)}
                    type="button"
                  >
                    {answer.text}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {hasSubmittedCurrentAnswer ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-7 rounded-lg p-5",
                    isCorrect ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-500/16 dark:text-emerald-100" : "bg-red-50 text-red-950 dark:bg-red-500/16 dark:text-red-100"
                  )}
                  exit={{ opacity: 0, y: -8 }}
                  initial={{ opacity: 0, y: 8 }}
                >
                  <p className="text-lg font-bold">{isCorrect ? "Правильно" : "Неправильно"}</p>
                  <p className="mt-1 text-sm">
                    {isCorrect
                      ? "Отлично, можно идти дальше."
                      : correctAnswer
                        ? `Правильный ответ: ${correctAnswer.text}`
                        : "Правильный ответ подсвечен зелёным."}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
            <Button className="rounded-full text-[#586380] hover:text-[#4255ff]" onClick={() => router.push("/dashboard")} variant="ghost">
              Завершить позже
            </Button>
            <div className="flex gap-3">
              {settings.mode.allowBack && index > 0 ? (
                <Button className="rounded-full" onClick={goBack} variant="outline">
                  <ArrowLeft data-icon="inline-start" />
                  Назад
                </Button>
              ) : null}
              {settings.mode.allowSkip && !hasSubmittedCurrentAnswer ? (
                <Button className="rounded-full" onClick={() => submitAnswer(true)} variant="outline">
                  Пропустить
                </Button>
              ) : null}
              {hasSubmittedCurrentAnswer ? (
                <Button
                  className="trainova-primary trainova-pill px-6 font-bold"
                  onClick={() => goNext(answers)}
                >
                  Дальше
                </Button>
              ) : (
                <Button
                  className="trainova-primary trainova-pill px-6 font-bold"
                  disabled={!effectiveSelectedAnswerId}
                  onClick={() => submitAnswer(false)}
                >
                  Ответить
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </PageFrame>
    </AppShell>
  );
}

function GameTestRunner({
  quiz,
  settings,
  questions,
  initialIndex,
  initialAnswers,
  initialStartedAt,
}: {
  quiz: QuizDocument;
  settings: TestSettings;
  questions: QuizQuestion[];
  initialIndex: number;
  initialAnswers: AttemptAnswer[];
  initialStartedAt: string;
}) {
  const router = useRouter();
  const secondsPerQuestion = settings.timer.secondsPerQuestion ?? 15;
  const startedAtRef = useRef(initialStartedAt);
  const [index, setIndex] = useState(initialIndex);
  const [answers, setAnswers] = useState<AttemptAnswer[]>(initialAnswers);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | undefined>();
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(secondsPerQuestion);
  const [gameScore, setGameScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "timeout" | null>(null);
  const timeoutHandled = useRef(false);
  const question = questions[Math.min(index, questions.length - 1)];
  const progress = Math.round(((index + (answered ? 1 : 0)) / questions.length) * 100);
  const zoneStyles = [
    "bg-[#4255ff] text-white shadow-[0_4px_16px_rgba(40,46,62,0.16)]",
    "bg-[#98e3ff] text-[#282e3e] shadow-[0_4px_16px_rgba(40,46,62,0.14)]",
    "bg-[#eeaaff] text-[#282e3e] shadow-[0_4px_16px_rgba(40,46,62,0.14)]",
    "bg-[#ffc38c] text-[#282e3e] shadow-[0_4px_16px_rgba(40,46,62,0.14)]",
  ];

  useEffect(() => {
    if (answered) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          if (!timeoutHandled.current) {
            timeoutHandled.current = true;
            window.setTimeout(() => handleAnswer(undefined, true), 0);
          }
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, index]);

  function handleAnswer(answer?: QuizAnswer, timedOut = false) {
    if (answered) {
      return;
    }

    const correct = Boolean(answer?.correct);
    const points = correct ? 100 + Math.max(0, timeLeft) * 5 : 0;
    const nextStreak = correct ? streak + 1 : 0;
    const attemptAnswer: AttemptAnswer = {
      questionId: question.id,
      selectedAnswerId: answer?.id,
      correct,
      skipped: timedOut || !answer,
      answeredAt: new Date().toISOString(),
    };
    const nextAnswers = [...answers.filter((item) => item.questionId !== question.id), attemptAnswer];

    setSelectedAnswerId(answer?.id);
    setAnswered(true);
    setFeedback(timedOut ? "timeout" : correct ? "correct" : "wrong");
    setGameScore((current) => current + points);
    setStreak(nextStreak);
    setAnswers(nextAnswers);
    void saveProgressStepToAccount({ quiz, answers: nextAnswers, currentQuestionId: question.id });

    window.setTimeout(() => goNext(nextAnswers), 900);
  }

  function goNext(nextAnswers: AttemptAnswer[]) {
    if (index >= questions.length - 1) {
      finish(nextAnswers);
      return;
    }

    const nextIndex = index + 1;
    setTimeLeft(secondsPerQuestion);
    setAnswered(false);
    setSelectedAnswerId(undefined);
    setFeedback(null);
    timeoutHandled.current = false;
    setIndex(nextIndex);
    saveAttempt({
      id: "active",
      testId: quiz.id,
      startedAt: startedAtRef.current,
      currentIndex: nextIndex,
      answers: nextAnswers,
      score: scoreOf(nextAnswers),
      timeSpentSeconds: elapsedSecondsSince(startedAtRef.current),
      completed: false,
    });
  }

  function finish(finalAnswers: AttemptAnswer[]) {
    const finishedAt = new Date();
    const timeSpentSeconds = elapsedSecondsBetween(startedAtRef.current, finishedAt);
    const completedAttempt: TestAttempt = {
      id: crypto.randomUUID(),
      testId: quiz.id,
      startedAt: startedAtRef.current,
      finishedAt: finishedAt.toISOString(),
      currentIndex: questions.length - 1,
      answers: finalAnswers,
      score: scoreOf(finalAnswers),
      timeSpentSeconds,
      completed: true,
    };
    const progressState = ensureProgress(quiz.id);
    const wrongIds = Array.from(new Set(finalAnswers.filter((answer) => !answer.correct).map((answer) => answer.questionId)));
    const attempts = [...progressState.attempts, completedAttempt].slice(-10);
    const bestScore = Math.max(progressState.bestScore, completedAttempt.score);
    const averageScore = Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length);

    saveAttempt(completedAttempt);
    saveProgress({
      ...progressState,
      lastQuestionId: question.id,
      solvedToday: progressState.solvedToday + finalAnswers.length,
      streak: Math.max(progressState.streak, nextPositiveStreak(streak)),
      bestScore,
      averageScore,
      wrongQuestionIds: wrongIds,
      attempts,
    });
    void saveAttemptToAccount({ quiz, attempt: completedAttempt });
    router.push("/results");
  }

  return (
    <AppShell>
      <PageFrame className="py-6 lg:py-8">
        <motion.div {...pageMotion} className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-6xl flex-col">
          <div className="trainova-card mb-5 grid gap-4 p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
            <FlowProgress className="md:max-w-md" value={progress} />
            <span className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]">
              {index + 1}/{questions.length}
            </span>
            <span className="rounded-full bg-[#282e3e] px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-[#282e3e]">
              {timeLeft}s
            </span>
            <span className="rounded-full bg-[#eef0ff] px-4 py-2 text-sm font-bold text-[#4255ff] dark:bg-[#4255ff]/20 dark:text-[#aeb7ff]">
              {gameScore} pts · x{streak}
            </span>
          </div>

          <div className="mb-6 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#4255ff] dark:text-[#aeb7ff]">Быстрый режим</p>
            <h1 className="mx-auto mt-4 max-w-4xl text-pretty text-2xl font-bold leading-[1.28] tracking-normal text-[#282e3e] sm:text-[32px] dark:text-white">
              {question.text}
            </h1>
            {feedback ? (
              <p className="mt-3 text-base font-bold text-[#586380] dark:text-[#c7cce0]">
                {feedback === "correct" ? "Верно. Очки начислены." : feedback === "timeout" ? "Время вышло." : "Неверно. Этот вопрос попадёт в повторение."}
              </p>
            ) : null}
          </div>

          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            {question.answers.map((answer, answerIndex) => {
              const selected = selectedAnswerId === answer.id;
              const revealCorrect = answered && answer.correct;
              const revealWrong = answered && selected && !answer.correct;

              return (
                <button
                  className={cn(
                    "min-h-[132px] rounded-lg p-5 text-left text-lg font-bold leading-snug transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#4255ff] sm:min-h-[170px] sm:p-7 sm:text-xl",
                    zoneStyles[answerIndex % zoneStyles.length],
                    revealCorrect && "ring-4 ring-lime-300",
                    revealWrong && "animate-pulse ring-4 ring-white/80",
                    answered && !selected && !answer.correct && "opacity-70"
                  )}
                  disabled={answered}
                  key={answer.id}
                  onClick={() => handleAnswer(answer)}
                  type="button"
                >
                  <span className="mb-4 flex size-9 items-center justify-center rounded-full bg-white/30 text-base">
                    {String.fromCharCode(65 + answerIndex)}
                  </span>
                  <span className="block break-words">{answer.text}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex justify-center">
            <Button className="rounded-full text-[#586380] hover:text-[#4255ff]" onClick={() => router.push("/dashboard")} variant="ghost">
              Завершить позже
            </Button>
          </div>
        </motion.div>
      </PageFrame>
    </AppShell>
  );
}

function nextPositiveStreak(value: number) {
  return Math.max(1, value);
}

function usesImmediateFeedback(settings: TestSettings) {
  return (
    settings.mode.type === "training" ||
    settings.mode.type === "mistakes" ||
    settings.questions.questionSelection === "mistakes" ||
    settings.review.showCorrectAnswer === "immediately"
  );
}

function elapsedSecondsSince(startedAt: string) {
  return elapsedSecondsBetween(startedAt, new Date());
}

function elapsedSecondsBetween(startedAt: string, finishedAt: Date) {
  const started = new Date(startedAt).getTime();
  const finished = finishedAt.getTime();

  if (!Number.isFinite(started) || !Number.isFinite(finished) || finished <= started) {
    return 0;
  }

  return Math.floor((finished - started) / 1000);
}

export function ResultsPage() {
  const router = useRouter();
  const ready = useClientReady();
  const [state] = useState(() => {
    const currentQuiz = loadQuiz();
    return {
      quiz: currentQuiz,
      attempt: loadAttempt(),
      progress: loadProgress(currentQuiz?.id),
    };
  });
  const { quiz, attempt, progress } = state;

  if (!ready) {
    return <LoadingState title="Считаем результат" />;
  }

  if (!quiz || !attempt) {
    return <EmptyState title="Результата пока нет" action="Пройти тест" href="/test" />;
  }

  const correct = attempt.answers.filter((answer) => answer.correct).length;
  const skipped = attempt.answers.filter((answer) => answer.skipped).length;
  const wrong = attempt.answers.length - correct;

  function repeatMistakes() {
    if (!quiz || wrong === 0) {
      return;
    }

    const currentSettings = loadSettings(quiz);
    const nextSettings = {
      ...currentSettings,
      mode: {
        ...currentSettings.mode,
        type: "mistakes" as TestMode,
      },
      questions: {
        ...currentSettings.questions,
        questionSelection: "mistakes" as const,
        questionCount: "all" as const,
      },
    };

    saveSettings(nextSettings);
    clearAttempt();
    router.push("/test");
  }

  return (
    <AppShell>
      <PageFrame>
        <motion.div {...pageMotion} className="mx-auto max-w-4xl">
          <QuietPanel className="overflow-hidden p-8 sm:p-10">
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto mb-8 flex size-20 items-center justify-center rounded-full bg-[#eef0ff] text-[#4255ff] dark:bg-[#4255ff]/20 dark:text-[#aeb7ff]"
              initial={{ scale: 0.86, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Sparkles className="size-9" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#4255ff] dark:text-[#aeb7ff]">Результат</p>
              <h1 className="mt-4 text-7xl font-bold tracking-normal text-[#282e3e] dark:text-white">{attempt.score}%</h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#586380] dark:text-[#c7cce0]">
                {correct} правильных из {attempt.answers.length}. Ошибки сохранены, чтобы следующая сессия была короче и точнее.
              </p>
            </div>
            <div className="mx-auto mt-9 grid max-w-2xl gap-4 sm:grid-cols-3">
              <SummaryNumber label="ошибок" value={wrong} />
              <SummaryNumber label="пропущено" value={skipped} />
              <SummaryNumber label="время" value={formatTime(attempt.timeSpentSeconds)} />
            </div>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              {wrong > 0 ? (
                <button
                  className="trainova-primary trainova-pill inline-flex h-12 items-center justify-center px-6 font-bold"
                  onClick={repeatMistakes}
                  type="button"
                >
                  Повторить {wrong} ошибок
                </button>
              ) : (
                <div className="inline-flex h-12 items-center justify-center rounded-full bg-[#98e3ff]/45 px-6 font-bold text-[#282e3e] dark:text-white">
                  Ошибок нет
                </div>
              )}
              <Link className="trainova-secondary trainova-pill inline-flex h-12 items-center justify-center px-6 font-bold" href="/settings">
                Пройти заново
              </Link>
              <Link className="inline-flex h-12 items-center justify-center rounded-full px-6 font-bold text-[#586380] hover:bg-[#eef0ff] hover:text-[#4255ff] dark:text-[#c7cce0]" href="/dashboard">
                В кабинет
              </Link>
            </div>
          </QuietPanel>
          <p className="mt-6 text-center text-sm text-[#586380] dark:text-[#c7cce0]">
            Лучший результат: {progress?.bestScore ?? attempt.score}%.
          </p>
        </motion.div>
      </PageFrame>
    </AppShell>
  );
}

export function DashboardPage() {
  const ready = useClientReady();
  const [cloudTests, setCloudTests] = useState<CloudTestSummary[] | null>(null);
  const [cloudChecked, setCloudChecked] = useState(false);
  const [state] = useState(() => {
    const currentQuiz = loadQuiz();
    return {
      quiz: currentQuiz && !currentQuiz.isDemo ? currentQuiz : null,
      progress: loadProgress(currentQuiz?.id),
    };
  });
  const { quiz, progress } = state;

  useEffect(() => {
    let cancelled = false;

    async function loadCloudTests() {
      try {
        const tests = await fetchCloudTests();
        if (!cancelled) {
          setCloudTests(tests);
        }
      } catch {
        if (!cancelled) {
          setCloudTests(null);
        }
      } finally {
        if (!cancelled) {
          setCloudChecked(true);
        }
      }
    }

    void loadCloudTests();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <LoadingState title="Открываем кабинет" />;
  }

  if (cloudTests?.length) {
    const bestScore = Math.max(...cloudTests.map((test) => Number(test.bestScorePercent || 0)));
    const totalWrong = cloudTests.reduce((sum, test) => sum + (test.wrongCount ?? 0), 0);
    const totalAttempts = cloudTests.reduce((sum, test) => sum + (test.attemptCount ?? 0), 0);
    const lastAttempt = cloudTests
      .filter((test) => test.lastAttemptAt)
      .sort((a, b) => String(b.lastAttemptAt).localeCompare(String(a.lastAttemptAt)))[0];
    const averageProgress = Math.round(
      cloudTests.reduce((sum, test) => sum + Number(test.progressPercent || 0), 0) / cloudTests.length
    );

    return (
      <AppShell>
        <PageFrame>
          <motion.div {...pageMotion} className="mx-auto flex max-w-6xl flex-col gap-10">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <PageTitle
                description="Продолжите тренировку или загрузите новый файл. Здесь только реальные данные из вашего аккаунта."
                title="С возвращением"
              />
              <Link className="trainova-primary trainova-pill inline-flex h-12 items-center justify-center px-6 font-bold" href="/upload">
                Загрузить тест
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <DashboardMetric label="Мои тренажёры" value={cloudTests.length} />
              <DashboardMetric label="Последний прогресс" value={`${averageProgress}%`} />
              <DashboardMetric label="Ошибки для повторения" value={totalWrong || "нет"} tone="coral" />
              <DashboardMetric label="Лучший результат" value={bestScore ? `${Math.round(bestScore)}%` : "пока нет"} />
            </div>
            <QuietPanel className="p-7 sm:p-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h2 className="text-3xl font-bold tracking-normal text-[#282e3e] dark:text-white">Мои тренажёры</h2>
                  <p className="mt-2 text-base text-[#586380] dark:text-[#c7cce0]">
                    {totalAttempts ? `Всего попыток: ${totalAttempts}` : "Попытки появятся после первой тренировки."}
                    {lastAttempt?.lastAttemptAt ? ` Последняя: ${formatDashboardDate(lastAttempt.lastAttemptAt)}.` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-7 flex flex-col divide-y divide-[#d9dde8] dark:divide-white/[0.12]">
                {cloudTests.map((test) => (
                  <div className="grid gap-6 py-6 first:pt-0 last:pb-0 md:grid-cols-[1fr_220px] md:items-center" key={test.id}>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-2xl font-bold tracking-normal text-[#282e3e] dark:text-white">{test.title}</h3>
                        <span className="rounded-full bg-[#eeaaff]/45 px-3 py-1 text-xs font-bold text-[#423ed8] dark:text-[#e9d7ff]">
                          {String(test.sourceFormat || "qst").toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-2 text-base text-[#586380] dark:text-[#c7cce0]">
                        {test.questionCount} вопросов · создан {formatDashboardDate(test.createdAt ?? test.updatedAt)}
                      </p>
                      <div className="mt-5 flex max-w-xl items-center gap-4">
                        <FlowProgress className="flex-1" value={test.progressPercent} />
                        <span className="w-12 text-right text-sm font-bold text-[#586380] dark:text-[#c7cce0]">
                          {Math.round(test.progressPercent)}%
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-[#586380] dark:text-[#c7cce0]">
                        Лучший результат: {test.bestScorePercent ? `${Math.round(test.bestScorePercent)}%` : "пока нет"}
                        {test.lastAttemptScore ? ` · последняя попытка ${Math.round(test.lastAttemptScore)}%` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Link className="trainova-primary trainova-pill inline-flex h-11 items-center justify-center px-5 font-bold" href={`/tests/${test.id}`}>
                        Продолжить
                      </Link>
                      <Link className="trainova-secondary trainova-pill inline-flex h-11 items-center justify-center px-5 font-bold" href={`/tests/${test.id}`}>
                        Настроить
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </QuietPanel>
            {totalWrong === 0 ? (
              <p className="text-center text-sm text-[#586380] dark:text-[#c7cce0]">Пока ошибок нет. Отличный старт.</p>
            ) : null}
          </motion.div>
        </PageFrame>
      </AppShell>
    );
  }

  if (cloudChecked && cloudTests?.length === 0) {
    return (
      <EmptyState
        action="Загрузить тест"
        description="Загрузите QST, TXT или ZIP файл, чтобы создать первый интерактивный тест."
        href="/upload"
        title="Добро пожаловать в Trainova"
      />
    );
  }

  if (!quiz) {
    return (
      <EmptyState
        title="У вас пока нет тренажёров"
        description="Загрузите первый файл, чтобы начать."
        action="Загрузить тест"
        href="/upload"
      />
    );
  }

  const completion = progress?.attempts.length ? Math.min(100, Math.round((progress.solvedToday / quiz.questions.length) * 100)) : 0;

  return (
    <AppShell>
      <PageFrame>
        <motion.div {...pageMotion} className="mx-auto flex max-w-5xl flex-col gap-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <PageTitle
              description="Этот тест сохранён только на устройстве. После входа его можно перенести в аккаунт."
              title="Локальная тренировка"
            />
            <Link className="trainova-primary trainova-pill inline-flex h-12 items-center justify-center px-6 font-bold" href="/test">
              Продолжить
            </Link>
          </div>

          <QuietPanel className="p-7 sm:p-8">
            <div className="grid gap-8 md:grid-cols-[1fr_220px] md:items-center">
              <div className="flex items-start gap-5">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-[#eef0ff] text-[#4255ff]">
                  <BookOpen className="size-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-normal text-[#282e3e] dark:text-white">{quiz.title}</h2>
                  <p className="mt-2 text-base text-[#586380] dark:text-[#c7cce0]">
                    {quiz.questions.length} вопросов · последний результат {progress?.bestScore ?? 0}%
                  </p>
                  <FlowProgress className="mt-6 max-w-md" value={completion} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Link className="trainova-primary trainova-pill inline-flex h-11 items-center justify-center px-5 font-bold" href="/settings">
                  Настроить сессию
                </Link>
                <Link className="inline-flex h-11 items-center justify-center rounded-full px-5 font-bold text-[#586380] hover:bg-[#eef0ff] hover:text-[#4255ff]" href="/editor">
                  Редактор
                </Link>
              </div>
            </div>
          </QuietPanel>
        </motion.div>
      </PageFrame>
    </AppShell>
  );
}

export function ProgressPage() {
  const ready = useClientReady();
  const [cloudTests, setCloudTests] = useState<CloudTestSummary[] | null>(null);
  const [cloudChecked, setCloudChecked] = useState(false);
  const [state] = useState(() => {
    const currentQuiz = loadQuiz();
    return {
      quiz: currentQuiz && !currentQuiz.isDemo ? currentQuiz : null,
      progress: loadProgress(currentQuiz?.id),
    };
  });
  const { quiz, progress } = state;

  useEffect(() => {
    let cancelled = false;

    async function loadCloudTests() {
      try {
        const tests = await fetchCloudTests();
        if (!cancelled) {
          setCloudTests(tests);
        }
      } catch {
        if (!cancelled) {
          setCloudTests(null);
        }
      } finally {
        if (!cancelled) {
          setCloudChecked(true);
        }
      }
    }

    void loadCloudTests();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <LoadingState title="Собираем прогресс" />;
  }

  if (cloudTests?.length) {
    const solved = cloudTests.reduce((sum, test) => sum + Math.round((test.progressPercent / 100) * test.questionCount), 0);
    const best = Math.max(...cloudTests.map((test) => Number(test.bestScorePercent || 0)));
    const attempts = cloudTests.reduce((sum, test) => sum + (test.attemptCount ?? 0), 0);
    const wrong = cloudTests.reduce((sum, test) => sum + (test.wrongCount ?? 0), 0);

    return (
      <AppShell>
        <PageFrame>
          <motion.div {...pageMotion} className="mx-auto flex max-w-6xl flex-col gap-10">
            <PageTitle
              description="Реальные данные из аккаунта: прогресс, попытки и вопросы, которые стоит повторить."
              title="Ваш прогресс"
            />
            <div className="grid gap-3 md:grid-cols-4">
              <DashboardMetric label="Вопросов решено" value={solved} />
              <DashboardMetric label="Лучший результат" value={best ? `${Math.round(best)}%` : "пока нет"} />
              <DashboardMetric label="Попыток" value={attempts || "нет"} />
              <DashboardMetric label="Ошибки" value={wrong || "нет"} tone="coral" />
            </div>
            <QuietPanel className="p-7 sm:p-8">
              <h2 className="text-3xl font-bold tracking-normal text-[#282e3e] dark:text-white">Тренажёры</h2>
              <div className="mt-7 flex flex-col divide-y divide-[#d9dde8] dark:divide-white/[0.12]">
                {cloudTests.map((test) => (
                  <Link
                    className="grid gap-5 py-5 first:pt-0 last:pb-0 transition hover:translate-x-1 md:grid-cols-[1fr_180px] md:items-center"
                    href={`/tests/${test.id}`}
                    key={test.id}
                  >
                    <div>
                      <p className="text-xl font-bold tracking-normal text-[#282e3e] dark:text-white">{test.title}</p>
                      <p className="mt-2 text-sm text-[#586380] dark:text-[#c7cce0]">
                        {test.attemptCount || 0} попыток · {test.wrongCount || 0} ошибок для повторения
                      </p>
                      <FlowProgress className="mt-4 max-w-lg" value={test.progressPercent} />
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-2xl font-bold text-[#282e3e] dark:text-white">
                        {test.bestScorePercent ? `${Math.round(test.bestScorePercent)}%` : "—"}
                      </p>
                      <p className="mt-1 text-sm text-[#586380] dark:text-[#c7cce0]">лучший результат</p>
                    </div>
                  </Link>
                ))}
              </div>
            </QuietPanel>
            {wrong === 0 ? (
              <QuietPanel className="p-7 text-center">
                <h2 className="text-2xl font-bold tracking-normal text-[#282e3e] dark:text-white">Пока ошибок нет. Отличный старт.</h2>
                <p className="mx-auto mt-2 max-w-lg text-base leading-7 text-[#586380] dark:text-[#c7cce0]">
                  Когда появятся вопросы для повторения, Trainova соберёт их здесь в спокойный список.
                </p>
              </QuietPanel>
            ) : null}
          </motion.div>
        </PageFrame>
      </AppShell>
    );
  }

  if (cloudChecked && cloudTests?.length === 0) {
    return (
      <EmptyState
        title="Прогресс появится после первой тренировки"
        description="Загрузите тест, пройдите первую сессию, и здесь появятся реальные попытки и ошибки."
        action="Загрузить тест"
        href="/upload"
      />
    );
  }

  if (!quiz) {
    return (
      <EmptyState
        title="Прогресс появится после первой тренировки"
        description="Здесь не будет фейковых графиков: только ваши реальные тренировки."
        action="Загрузить тест"
        href="/upload"
      />
    );
  }

  const weakQuestions = (progress?.wrongQuestionIds ?? [])
    .map((id) => quiz.questions.find((question) => question.id === id))
    .filter(Boolean)
    .slice(0, 3) as QuizQuestion[];

  return (
    <AppShell>
      <PageFrame>
        <motion.div {...pageMotion} className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <PageTitle
                description="Спокойный прогресс без лишней аналитики: streak, цель дня и вопросы, которые стоит повторить."
                title="Сегодняшняя тренировка"
              />
              <div className="mt-10">
                <QuietPanel className="p-8">
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#4255ff] dark:text-[#aeb7ff]">Цель дня</p>
                      <h2 className="mt-4 text-4xl font-bold tracking-normal text-[#282e3e] dark:text-white">
                        {progress?.solvedToday ?? 0} вопросов сегодня
                      </h2>
                    </div>
                    <div className="flex size-20 items-center justify-center rounded-full bg-[#ffc38c]/55 text-2xl font-bold text-[#8a4714] dark:text-[#ffd8b7]">
                      {progress?.streak ?? 1}
                    </div>
                  </div>
                  <FlowProgress className="mt-8" value={Math.min(100, ((progress?.solvedToday ?? 0) / 20) * 100)} />
                </QuietPanel>
              </div>
            </div>

            <QuietPanel className="p-6">
              <h2 className="text-xl font-bold tracking-normal text-[#282e3e] dark:text-white">Повторить слабые вопросы</h2>
              {weakQuestions.length ? (
                <>
                  <div className="mt-6 flex flex-col gap-4">
                    {weakQuestions.map((question) => (
                      <div className="border-b border-[#d9dde8] pb-4 last:border-b-0 last:pb-0 dark:border-white/[0.12]" key={question.id}>
                        <p className="line-clamp-2 text-sm leading-6 text-[#586380] dark:text-[#c7cce0]">{question.text}</p>
                      </div>
                    ))}
                  </div>
                  <Link className="trainova-primary trainova-pill mt-7 inline-flex h-11 w-full items-center justify-center font-bold" href="/test">
                    Тренировать
                  </Link>
                </>
              ) : (
                <p className="mt-6 text-sm leading-6 text-[#586380] dark:text-[#c7cce0]">Пока ошибок нет. Отличный старт.</p>
              )}
            </QuietPanel>
          </div>
        </motion.div>
      </PageFrame>
    </AppShell>
  );
}

function DashboardMetric({
  label,
  value,
  tone = "green",
}: {
  label: string;
  value: string | number;
  tone?: "green" | "coral";
}) {
  return (
    <div className="trainova-card trainova-lift p-5">
      <p className={cn("text-sm font-bold", tone === "coral" ? "text-[#d85d4e] dark:text-[#ff9a8f]" : "text-[#4255ff] dark:text-[#aeb7ff]")}>
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-normal text-[#282e3e] dark:text-white">{value}</p>
    </div>
  );
}

function formatDashboardDate(value?: string | null) {
  if (!value) {
    return "пока нет";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function EmptyState({
  title,
  action,
  href,
  description,
}: {
  title: string;
  action: string;
  href: string;
  description?: string;
}) {
  return (
    <AppShell>
      <PageFrame>
        <div className="mx-auto flex min-h-[540px] max-w-xl flex-col items-center justify-center text-center">
          <GraduationCap className="mb-7 size-12 text-[#4255ff]" />
          <h1 className="text-4xl font-bold tracking-normal text-[#282e3e] dark:text-white">{title}</h1>
          {description ? <p className="mt-4 text-lg leading-8 text-[#586380] dark:text-[#c7cce0]">{description}</p> : null}
          <Link className="trainova-primary trainova-pill mt-8 inline-flex h-12 items-center justify-center px-6 font-bold" href={href}>
            {action}
          </Link>
        </div>
      </PageFrame>
    </AppShell>
  );
}

function LoadingState({ title }: { title: string }) {
  return (
    <AppShell>
      <PageFrame>
        <div className="mx-auto flex min-h-[540px] max-w-xl flex-col items-center justify-center text-center">
          <TrainovaLogo className="mb-7 h-12 animate-pulse" />
          <h1 className="text-3xl font-bold tracking-normal text-[#282e3e] dark:text-white">{title}</h1>
        </div>
      </PageFrame>
    </AppShell>
  );
}

function prepareQuestions(quiz: QuizDocument, settings: TestSettings) {
  const progress = loadProgress(quiz.id);
  let pool = [...quiz.questions];

  if (settings.questions.questionCount === "range") {
    const from = Math.floor(Number(settings.questions.rangeFrom));
    const to = Math.floor(Number(settings.questions.rangeTo));
    pool = pool.filter((question) => question.number >= from && question.number <= to);
  }

  if (settings.mode.type === "mistakes" || settings.questions.questionSelection === "mistakes") {
    const wrong = new Set(progress?.wrongQuestionIds ?? []);
    pool = pool.filter((question) => wrong.has(question.id));
  }

  if (settings.questions.questionSelection === "favorites") {
    const favorites = new Set(progress?.favoriteQuestionIds ?? []);
    const favoriteQuestions = pool.filter((question) => question.favorite || favorites.has(question.id));
    pool = favoriteQuestions.length ? favoriteQuestions : pool;
  }

  if (settings.questions.questionSelection === "difficult") {
    const difficult = new Set(progress?.difficultQuestionIds ?? []);
    const difficultQuestions = pool.filter((question) => question.difficult || difficult.has(question.id));
    pool = difficultQuestions.length ? difficultQuestions : pool;
  }

  if (settings.questions.questionSelection === "unseen") {
    const answered = new Set(progress?.attempts.flatMap((attempt) => attempt.answers.map((answer) => answer.questionId)) ?? []);
    const unseen = pool.filter((question) => !answered.has(question.id));
    pool = unseen.length ? unseen : pool;
  }

  if (settings.mode.type === "review") {
    const wrong = new Set(progress?.wrongQuestionIds ?? []);
    pool = [
      ...pool.filter((question) => wrong.has(question.id)),
      ...pool.filter((question) => question.difficult),
      ...pool.filter((question) => !wrong.has(question.id) && !question.difficult),
    ];
  }

  if (settings.questions.questionOrder === "random" || settings.mode.type === "quick") {
    pool = shuffle(pool);
  }

  return pool.slice(0, questionLimit(settings, pool.length)).map((question) => ({
    ...question,
    answers:
      settings.answers.answerOrder === "file"
        ? question.answers
        : shuffleAnswers(question.answers, settings.answers.protectSpecialAnswers),
  }));
}

function createInitialTestState() {
  const quiz = loadQuiz();
  const settings = loadSettings(quiz);
  const questions = quiz ? prepareQuestions(quiz, settings) : [];
  const active = loadAttempt();
  const canResume = Boolean(active && quiz && active.testId === quiz.id && !active.completed);
  const startedAt = canResume ? active?.startedAt ?? new Date().toISOString() : new Date().toISOString();

  return {
    quiz,
    settings,
    questions,
    index: canResume ? active?.currentIndex ?? 0 : 0,
    answers: canResume ? active?.answers ?? [] : [],
    startedAt,
  };
}

function shuffleAnswers(answers: QuizAnswer[], protectSpecial: boolean) {
  const specialPattern = /^(все|нет|ни один|всё|all|none)/i;
  const special = protectSpecial ? answers.filter((answer) => specialPattern.test(answer.text.trim())) : [];
  const normal = protectSpecial ? answers.filter((answer) => !specialPattern.test(answer.text.trim())) : answers;

  return [...shuffle(normal), ...special];
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function scoreOf(answers: AttemptAnswer[]) {
  if (answers.length === 0) {
    return 0;
  }

  return Math.round((answers.filter((answer) => answer.correct).length / answers.length) * 100);
}

function listOrZero(items: number[]) {
  return items.length ? items.join(", ") : 0;
}

function issueCountText(count: number) {
  if (count % 10 === 1 && count % 100 !== 11) {
    return `${count} момент`;
  }

  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return `${count} момента`;
  }

  return `${count} моментов`;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function selectionLabel(value: TestSettings["questions"]["questionSelection"]) {
  return {
    all: "Все вопросы",
    random: "Случайные",
    unseen: "Только непройденные",
    mistakes: "Только ошибки",
    favorites: "Избранные",
    difficult: "Сложные",
  }[value];
}

function orderLabel(value: TestSettings["questions"]["questionOrder"]) {
  return {
    file: "Как в файле",
    random: "Случайный",
    new_first: "Сначала новые",
    difficult_first: "Сначала сложные",
    mistakes_first: "Сначала ошибки",
  }[value];
}

function answerOrderLabel(value: TestSettings["answers"]["answerOrder"]) {
  return {
    file: "Как в файле",
    random: "Случайный",
    safe_random: "Случайный с защитой специальных вариантов",
  }[value];
}

function reviewLabel(value: TestSettings["review"]["showCorrectAnswer"]) {
  return {
    immediately: "Сразу",
    after_each_question: "После вопроса",
    end: "В конце",
    never: "Никогда",
  }[value];
}

function explanationLabel(value: TestSettings["review"]["showExplanation"]) {
  return {
    always: "Всегда",
    after_wrong_answer: "После ошибки",
    never: "Не показывать",
  }[value];
}

function accessLabel(value: TestSettings["access"]["visibility"]) {
  return {
    private: "Только я",
    link: "По ссылке",
    public: "Публичный",
    password: "По паролю",
  }[value];
}

function appearanceLabel(value: TestSettings["appearance"]["theme"]) {
  return {
    light: "Светлая",
    dark: "Тёмная",
    green: "Зелёная",
    minimal: "Минималистичная",
  }[value];
}
