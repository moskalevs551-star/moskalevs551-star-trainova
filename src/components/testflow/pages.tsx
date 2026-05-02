"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
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
  training: "РўСЂРµРЅРёСЂРѕРІРєР°",
  exam: "Р­РєР·Р°РјРµРЅ",
  quick: "Быстрый режим",
  mistakes: "РўРѕР»СЊРєРѕ РѕС€РёР±РєРё",
  review: "РџРѕРІС‚РѕСЂРµРЅРёРµ",
  control: "РљРѕРЅС‚СЂРѕР»СЊРЅР°СЏ РїРѕРїС‹С‚РєР°",
  no_hints: "Р‘РµР· РїРѕРґСЃРєР°Р·РѕРє",
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
      <PageFrame className="pb-10 pt-16 lg:pt-24">
        <motion.div
          {...pageMotion}
          className="grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_430px]"
        >
          <div className="flex flex-col gap-9">
            <div className="flex max-w-4xl flex-col gap-6">
              <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Р—Р°РіСЂСѓР·РёС‚Рµ С‚РµСЃС‚ вЂ” Trainova СЃРѕР±РµСЂС‘С‚ С‚СЂРµРЅР°Р¶С‘СЂ
              </h1>
              <p className="max-w-2xl text-pretty text-xl leading-9 text-slate-600">
                Р—Р°РіСЂСѓР·РёС‚Рµ QST, TXT РёР»Рё ZIP вЂ” Trainova РЅР°Р№РґС‘С‚ РІРѕРїСЂРѕСЃС‹, РѕС‚РІРµС‚С‹ Рё РїРѕРјРѕР¶РµС‚ РЅР°С‡Р°С‚СЊ С‚СЂРµРЅРёСЂРѕРІРєСѓ СЃ СЃРѕС…СЂР°РЅРµРЅРёРµРј РїСЂРѕРіСЂРµСЃСЃР°.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 text-base font-semibold text-white shadow-[0_16px_36px_rgba(34,197,94,0.2)] transition hover:-translate-y-0.5 hover:bg-emerald-600"
                href="/upload"
              >
                Р—Р°РіСЂСѓР·РёС‚СЊ С‚РµСЃС‚
                <ArrowRight className="size-5" />
              </Link>
              <Button
                className="h-13 rounded-full border-slate-200 bg-white px-6 text-base text-slate-900 hover:bg-slate-50"
                onClick={startDemo}
                variant="outline"
              >
                РџРѕРїСЂРѕР±РѕРІР°С‚СЊ РґРµРјРѕ
              </Button>
            </div>
            <div className="max-w-xl border-l border-emerald-200 pl-5 text-base leading-8 text-slate-500">
              РћРґРёРЅ РіР»Р°РІРЅС‹Р№ СЃС†РµРЅР°СЂРёР№: Р·Р°РіСЂСѓР·РёС‚СЊ С„Р°Р№Р», РїСЂРѕРІРµСЂРёС‚СЊ СЂР°СЃРїРѕР·РЅР°РІР°РЅРёРµ, РЅР°СЃС‚СЂРѕРёС‚СЊ СЃРµСЃСЃРёСЋ Рё РЅР°С‡Р°С‚СЊ.
            </div>
          </div>

          <HeroProductVisual />
        </motion.div>
      </PageFrame>
      <PageFrame className="pt-8" id="how-it-works">
        <div className="grid gap-10 border-t border-slate-900/[0.06] py-14 md:grid-cols-3">
          {[
            ["Р Р°СЃРїРѕР·РЅР°С‚СЊ", "QST/TXT/ZIP РїСЂРµРІСЂР°С‰Р°СЋС‚СЃСЏ РІ РµРґРёРЅС‹Р№ JSON СЃ РїСЂРѕРІРµСЂРєРѕР№ СЃС‚СЂСѓРєС‚СѓСЂС‹."],
            ["РџСЂРѕРІРµСЂРёС‚СЊ", "РћС€РёР±РєРё С„РѕСЂРјР°С‚Р° РІРёРґРЅС‹ СЃРїРѕРєРѕР№РЅРѕ: С‚РѕР»СЊРєРѕ С‚Рѕ, С‡С‚Рѕ СЃС‚РѕРёС‚ РїРѕРїСЂР°РІРёС‚СЊ."],
            ["РЈС‡РёС‚СЊСЃСЏ", "РћРґРёРЅ РІРѕРїСЂРѕСЃ РЅР° СЌРєСЂР°РЅРµ, РјСЏРіРєР°СЏ РѕР±СЂР°С‚РЅР°СЏ СЃРІСЏР·СЊ Рё СЃРѕС…СЂР°РЅРµРЅРёРµ РїСЂРѕРіСЂРµСЃСЃР°."],
          ].map(([title, text]) => (
            <div className="flex flex-col gap-3" key={title}>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="max-w-sm text-base leading-7 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </PageFrame>
      <DemoPreviewSection />
      <SiteFooter />
    </AppShell>
  );
}

function HeroProductVisual() {
  const files = [
    [".qst", "bg-[#EDE9FE] text-[#7C3AED]"],
    [".txt", "bg-[#DBEAFE] text-[#4F46E5]"],
    [".zip", "bg-[#CCFBF1] text-[#0F766E]"],
  ];

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="relative mx-auto w-full max-w-[560px] lg:max-w-none"
      initial={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,#EDE9FE_0%,rgba(237,233,254,0)_58%)] opacity-80" />
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-900/[0.055] bg-[#FFFDF8] p-5 shadow-[0_28px_90px_rgba(15,23,42,0.09)]">
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 430 520">
          <path d="M72 92C160 72 196 130 215 194C238 274 304 288 360 258" stroke="#A78BFA" strokeDasharray="7 9" strokeLinecap="round" strokeWidth="2" />
          <path d="M70 342C132 298 190 326 229 374C260 411 309 423 371 395" stroke="#4F46E5" strokeLinecap="round" strokeOpacity="0.38" strokeWidth="2" />
          <circle cx="72" cy="92" fill="#A78BFA" r="5" />
          <circle cx="360" cy="258" fill="#10B981" r="6" />
          <circle cx="371" cy="395" fill="#FF6B5A" r="5" />
        </svg>

        <div className="relative grid gap-4">
          <div className="grid grid-cols-[1fr_auto] items-start gap-4">
            <div className="space-y-3">
              {files.map(([label, tone], index) => (
                <motion.div
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-2xl border border-slate-900/[0.055] bg-white/90 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.055)]"
                  initial={{ opacity: 0, x: -12 }}
                  key={label}
                  transition={{ delay: 0.16 + index * 0.08, duration: 0.32 }}
                >
                  <span className={cn("flex size-9 items-center justify-center rounded-xl text-sm font-semibold", tone)}>
                    {label}
                  </span>
                  <span className="h-2 w-20 rounded-full bg-slate-100" />
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex size-16 items-center justify-center rounded-full border border-[#DBEAFE] bg-white shadow-[0_18px_45px_rgba(79,70,229,0.14)]">
              <UploadCloud className="size-7 text-[#4F46E5]" />
            </div>
          </div>

          <div className="ml-auto w-[82%] rounded-[1.5rem] border border-slate-900/[0.055] bg-white/92 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#10B981]" />
                <span className="h-2 w-20 rounded-full bg-slate-100" />
              </div>
              <span className="rounded-full bg-[#D1FAE5] px-3 py-1 text-xs font-semibold text-[#047857]">РіРѕС‚РѕРІРѕ</span>
            </div>
            <div className="mt-5 space-y-3">
              <div className="h-3 w-3/4 rounded-full bg-slate-200" />
              <div className="h-3 w-11/12 rounded-full bg-slate-100" />
              <div className="grid gap-2 pt-2">
                <div className="h-10 rounded-2xl border border-[#D1FAE5] bg-[#ECFDF5]" />
                <div className="h-10 rounded-2xl border border-slate-100 bg-[#F8FAFC]" />
                <div className="h-10 rounded-2xl border border-slate-100 bg-[#F8FAFC]" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#EDE9FE] bg-white/88 p-4">
              <p className="text-xs font-semibold text-[#7C3AED]">РІРѕРїСЂРѕСЃС‹</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">24</p>
            </div>
            <div className="rounded-2xl border border-[#DBEAFE] bg-white/88 p-4">
              <p className="text-xs font-semibold text-[#4F46E5]">РѕС‚РІРµС‚С‹</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">96</p>
            </div>
            <div className="rounded-2xl border border-[#FFE4E0] bg-white/88 p-4">
              <p className="text-xs font-semibold text-[#FF6B5A]">РѕС€РёР±РєРё</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">3</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-900/[0.055] bg-white/92 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="h-2 w-24 rounded-full bg-slate-100" />
              <span className="rounded-full bg-[#FFE4E0] px-3 py-1 text-xs font-semibold text-[#E34D3D]">РїРѕРІС‚РѕСЂ РѕС€РёР±РѕРє</span>
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
        <h2 className="text-balance text-4xl font-semibold tracking-tight text-slate-950">
          РљР°Рє РјРѕР¶РµС‚ РІС‹РіР»СЏРґРµС‚СЊ РІР°С€ С‚СЂРµРЅР°Р¶С‘СЂ
        </h2>
        <p className="max-w-2xl text-lg leading-8 text-slate-600">
          РџРѕСЃР»Рµ Р·Р°РіСЂСѓР·РєРё С„Р°Р№Р»Р° Trainova РїСЂРµРІСЂР°С‰Р°РµС‚ РІРѕРїСЂРѕСЃС‹ РІ РїРѕРЅСЏС‚РЅС‹Р№ РёРЅС‚РµСЂР°РєС‚РёРІРЅС‹Р№ С„РѕСЂРјР°С‚. Р­С‚Рё РєР°СЂС‚РѕС‡РєРё вЂ” РґРµРјРѕ, РЅРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёРµ РґР°РЅРЅС‹Рµ.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <QuietPanel className="p-5 lg:col-span-2">
          <FlowProgress value={42} />
          <h3 className="mt-7 text-2xl font-semibold tracking-tight text-slate-950">
            РљР°РєРѕР№ РІР°СЂРёР°РЅС‚ Р»СѓС‡С€Рµ РѕРїРёСЃС‹РІР°РµС‚ Р°РєС‚РёРІРЅРѕРµ РїРѕРІС‚РѕСЂРµРЅРёРµ?
          </h3>
          <div className="mt-6 grid gap-3">
            {["Р’РѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ Рє СЃР»РѕР¶РЅС‹Рј РІРѕРїСЂРѕСЃР°Рј", "Р§РёС‚Р°С‚СЊ РІСЃРµ РѕС‚РІРµС‚С‹ РїРѕРґСЂСЏРґ", "РџСЂРѕС…РѕРґРёС‚СЊ С‚РѕР»СЊРєРѕ РїРѕР»РЅС‹Р№ СЌРєР·Р°РјРµРЅ", "РќРµ СЃРјРѕС‚СЂРµС‚СЊ СЂРµР·СѓР»СЊС‚Р°С‚"].map((answer, index) => (
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-medium",
                  index === 0 ? "bg-emerald-50 text-emerald-900" : "bg-slate-50 text-slate-600"
                )}
                key={answer}
              >
                {answer}
              </div>
            ))}
          </div>
        </QuietPanel>
        <QuietPanel className="p-5">
          <p className="text-sm font-medium text-amber-700">РўРѕР»СЊРєРѕ РѕС€РёР±РєРё</p>
          <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            РџРѕРІС‚РѕСЂСЏРµРј 12 СЃР»РѕР¶РЅС‹С… РІРѕРїСЂРѕСЃРѕРІ
          </h3>
          <FlowProgress className="mt-8" value={58} />
        </QuietPanel>
        <QuietPanel className="p-5">
          <p className="text-sm font-medium text-emerald-700">Р РµР·СѓР»СЊС‚Р°С‚</p>
          <h3 className="mt-4 text-6xl font-semibold tracking-tight text-slate-950">86%</h3>
          <p className="mt-3 text-sm leading-6 text-slate-500">РџСЂР°РІРёР»СЊРЅРѕ 26, РѕС€РёР±РѕРє 4</p>
          <div className="mt-7 inline-flex h-10 items-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white">
            РџРѕРІС‚РѕСЂРёС‚СЊ РѕС€РёР±РєРё
          </div>
        </QuietPanel>
        <QuietPanel className="p-5 lg:col-span-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Р РµР¶РёРј", "РўСЂРµРЅРёСЂРѕРІРєР°"],
              ["Р’РѕРїСЂРѕСЃРѕРІ", "20"],
              ["РџРѕСЂСЏРґРѕРє", "РЎР»СѓС‡Р°Р№РЅРѕ"],
              ["РўР°Р№РјРµСЂ", "Р‘РµР· С‚Р°Р№РјРµСЂР°"],
            ].map(([label, value]) => (
              <div className="rounded-2xl bg-slate-50 p-4" key={label}>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
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
        ["Р’РѕР·РјРѕР¶РЅРѕСЃС‚Рё", "/#features"],
        ["РљР°Рє СЌС‚Рѕ СЂР°Р±РѕС‚Р°РµС‚", "/#how-it-works"],
        ["Р”РµРјРѕ", "/demo"],
        ["Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ", "/docs"],
      ],
    },
    {
      title: "Resources",
      links: [
        ["Р‘Р»РѕРі", "/blog"],
        ["РџРѕРјРѕС‰СЊ", "/help"],
        ["Р¤РѕСЂРјР°С‚С‹ С„Р°Р№Р»РѕРІ", "/formats"],
        ["Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ", "/security"],
      ],
    },
  ];

  return (
    <footer className="mt-12 border-t border-slate-900/[0.06] bg-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <BrandFooter />
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">
            Trainova РїСЂРµРІСЂР°С‰Р°РµС‚ СЃС‚Р°СЂС‹Рµ С„Р°Р№Р»С‹ СЃ С‚РµСЃС‚Р°РјРё РІ СЃРѕРІСЂРµРјРµРЅРЅС‹Рµ РёРЅС‚РµСЂР°РєС‚РёРІРЅС‹Рµ С‚СЂРµРЅР°Р¶С‘СЂС‹.
          </p>
          <p className="mt-5 text-sm text-slate-400">Created by M. Stanislav and G. Kutsenko</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-slate-950">{column.title}</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500">
                {column.links.map(([item, href]) => (
                  <Link className="transition hover:text-slate-950" href={href} key={href}>
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Authors</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500">
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
    <Link aria-label="Trainova" className="-ml-2 inline-flex rounded-2xl px-2 py-1 transition hover:bg-white" href="/">
      <TrainovaLogo className="h-11" />
    </Link>
  );
}

function FlowProgress({ value, className }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      aria-label="РџСЂРѕРіСЂРµСЃСЃ"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(safeValue)}
      className={cn("h-1.5 overflow-hidden rounded-full bg-slate-100", className)}
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#10B981_0%,#4F46E5_45%,#A78BFA_72%,#A3E635_100%)] transition-all duration-500"
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
            description="Trainova СЃРѕР·РґР°РЅ РєР°Рє РїСЂРѕСЃС‚РѕР№ РёРЅСЃС‚СЂСѓРјРµРЅС‚ РґР»СЏ РїСЂРµРІСЂР°С‰РµРЅРёСЏ СЃС‚Р°СЂС‹С… С„Р°Р№Р»РѕРІ СЃ С‚РµСЃС‚Р°РјРё РІ СЃРѕРІСЂРµРјРµРЅРЅС‹Рµ РёРЅС‚РµСЂР°РєС‚РёРІРЅС‹Рµ С‚СЂРµРЅР°Р¶С‘СЂС‹."
            title="Рћ РїСЂРѕРµРєС‚Рµ"
          />
          <QuietPanel className="p-8 sm:p-10">
            <p className="text-xl leading-9 text-slate-700">
              РџСЂРѕРµРєС‚ РїРѕРјРѕРіР°РµС‚ Р±С‹СЃС‚СЂРѕ Р·Р°РіСЂСѓР·РёС‚СЊ С„Р°Р№Р», РїСЂРѕРІРµСЂРёС‚СЊ РІРѕРїСЂРѕСЃС‹, РЅР°СЃС‚СЂРѕРёС‚СЊ С‚СЂРµРЅРёСЂРѕРІРєСѓ Рё СЃРѕС…СЂР°РЅРёС‚СЊ РїСЂРѕРіСЂРµСЃСЃ. Р“Р»Р°РІРЅР°СЏ РёРґРµСЏ вЂ” СѓР±СЂР°С‚СЊ СЂСѓС‡РЅСѓСЋ СЂСѓС‚РёРЅСѓ Рё РѕСЃС‚Р°РІРёС‚СЊ РїРѕРЅСЏС‚РЅС‹Р№ РїСѓС‚СЊ: РёРјРїРѕСЂС‚, РїСЂРѕРІРµСЂРєР°, С‚СЂРµРЅРёСЂРѕРІРєР°, СЂРµР·СѓР»СЊС‚Р°С‚.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {["M. Stanislav", "G. Kutsenko"].map((author) => (
                <div className="rounded-3xl bg-slate-50 p-5" key={author}>
                  <p className="text-sm font-medium text-slate-500">РђРІС‚РѕСЂ</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{author}</p>
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
            description="Р”РµРјРѕ-С‚РµСЃС‚С‹ read-only Рё РЅРµ РїРѕРїР°РґР°СЋС‚ РІ Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚, РїРѕРєР° РІС‹ РЅРµ СЃРѕС…СЂР°РЅРёС‚Рµ РєРѕРїРёСЋ РІ Р°РєРєР°СѓРЅС‚."
            title="РџРѕРїСЂРѕР±СѓР№С‚Рµ РґРµРјРѕ-С‚СЂРµРЅР°Р¶С‘СЂ"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {samples.map((sample) => (
              <QuietPanel className="p-6 transition hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(15,23,42,0.08)]" key={sample.key}>
                <p className="text-sm font-medium text-emerald-700">Р”РµРјРѕ</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{sample.title}</h2>
                <p className="mt-3 text-sm text-slate-500">{sample.fileName}</p>
                <button
                  className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  onClick={() => openDemo(sample.key)}
                  type="button"
                >
                  РћС‚РєСЂС‹С‚СЊ РґРµРјРѕ
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
    setStatus("reading");
    setMessage("Р§РёС‚Р°СЋ С„Р°Р№Р» Рё РёС‰Сѓ С‚РµСЃС‚С‹ РІРЅСѓС‚СЂРё.");

    try {
      const nextCandidates = await extractImportCandidates(file);
      setCandidates(nextCandidates);
      setStatus("ready");

      const firstUsable = nextCandidates.find((candidate) => !candidate.ignored);
      if (firstUsable && nextCandidates.filter((candidate) => !candidate.ignored).length === 1) {
        await importCandidate(firstUsable);
      } else {
        setMessage("РќР°С€С‘Р» РЅРµСЃРєРѕР»СЊРєРѕ С„Р°Р№Р»РѕРІ. Р’С‹Р±РµСЂРёС‚Рµ С‚РѕС‚, РєРѕС‚РѕСЂС‹Р№ РЅСѓР¶РЅРѕ СЂР°СЃРїРѕР·РЅР°С‚СЊ.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "РќРµ РїРѕР»СѓС‡РёР»РѕСЃСЊ РїСЂРѕС‡РёС‚Р°С‚СЊ С„Р°Р№Р».");
    }
  }

  async function importCandidate(candidate: ImportCandidate) {
    setStatus("reading");
    setMessage("Р Р°СЃРїРѕР·РЅР°СЋ РІРѕРїСЂРѕСЃС‹ Рё РІР°СЂРёР°РЅС‚С‹ РѕС‚РІРµС‚РѕРІ.");
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
        <motion.div {...pageMotion} className="mx-auto flex max-w-3xl flex-col gap-10">
          <PageTitle
            align="center"
            description="РћРґРёРЅ СЃРїРѕРєРѕР№РЅС‹Р№ С€Р°Рі: РІС‹Р±РµСЂРёС‚Рµ С„Р°Р№Р», Р° РґРµС‚Р°Р»Рё РїСЂРѕРІРµСЂРєРё РїРѕСЏРІСЏС‚СЃСЏ РїРѕСЃР»Рµ СЂР°СЃРїРѕР·РЅР°РІР°РЅРёСЏ."
            title="Р—Р°РіСЂСѓР·РёС‚Рµ С‚РµСЃС‚"
          />
          <div
            className={cn(
              "group flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white/74 px-6 text-center transition",
              dragging && "border-emerald-400 bg-emerald-50/80",
              status === "reading" && "cursor-wait border-emerald-300 bg-emerald-50/70"
            )}
            onClick={() => inputRef.current?.click()}
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
              accept=".qst,.txt,.zip"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void readFile(file);
                }
              }}
              ref={inputRef}
              type="file"
            />
            <UploadCloud className="mb-7 size-12 text-emerald-500" />
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              РџРµСЂРµС‚Р°С‰РёС‚Рµ С„Р°Р№Р» СЃСЋРґР°
            </h2>
            <p className="mt-3 text-base text-slate-500">РџРѕРґРґРµСЂР¶РёРІР°СЋС‚СЃСЏ .qst, .txt Рё .zip</p>
            <p className="mt-8 text-sm text-slate-400">{message || "EXE РІРЅСѓС‚СЂРё Р°СЂС…РёРІР° Р±СѓРґСѓС‚ РїСЂРѕРёРіРЅРѕСЂРёСЂРѕРІР°РЅС‹."}</p>
          </div>

          {candidates.length > 1 ? (
            <QuietPanel className="overflow-hidden">
              {candidates.map((candidate) => (
                <button
                  className="flex w-full items-center justify-between border-b border-slate-900/[0.06] px-5 py-4 text-left last:border-b-0 hover:bg-slate-50"
                  disabled={candidate.ignored}
                  key={candidate.id}
                  onClick={() => void importCandidate(candidate)}
                  type="button"
                >
                  <span>
                    <span className="block font-medium text-slate-950">{candidate.name}</span>
                    <span className="text-sm text-slate-500">{candidate.reason ?? "РњРѕР¶РЅРѕ СЂР°СЃРїРѕР·РЅР°С‚СЊ"}</span>
                  </span>
                  <ArrowRight className="size-4 text-slate-400" />
                </button>
              ))}
            </QuietPanel>
          ) : null}

          <div className="text-center">
            <Button className="rounded-full px-5" onClick={startDemo} variant="ghost">
              РќРµС‚ С„Р°Р№Р»Р°? РћС‚РєСЂС‹С‚СЊ РґРµРјРѕ
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
    return <LoadingState title="Р“РѕС‚РѕРІРёРј СЂРµР·СѓР»СЊС‚Р°С‚ СЂР°СЃРїРѕР·РЅР°РІР°РЅРёСЏ" />;
  }

  if (!quiz) {
    return <EmptyState title="РЎРЅР°С‡Р°Р»Р° Р·Р°РіСЂСѓР·РёС‚Рµ С‚РµСЃС‚" action="РџРµСЂРµР№С‚Рё Рє Р·Р°РіСЂСѓР·РєРµ" href="/upload" />;
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
                ? `Р•СЃС‚СЊ ${issueCountText(issueCount)}, РєРѕС‚РѕСЂС‹Рµ СЃС‚РѕРёС‚ РїСЂРѕРІРµСЂРёС‚СЊ. РћСЃРЅРѕРІРЅРѕР№ С‚РµСЃС‚ СѓР¶Рµ СЃРѕР±СЂР°РЅ.`
                : "РЎС‚СЂСѓРєС‚СѓСЂР° РІС‹РіР»СЏРґРёС‚ Р°РєРєСѓСЂР°С‚РЅРѕ. РњРѕР¶РЅРѕ Р±С‹СЃС‚СЂРѕ РїСЂРѕРІРµСЂРёС‚СЊ РІРѕРїСЂРѕСЃС‹ РёР»Рё СЃСЂР°Р·Сѓ РЅР°С‡Р°С‚СЊ."
            }
            title={`РњС‹ РЅР°С€Р»Рё ${validation.totalQuestions} РІРѕРїСЂРѕСЃРѕРІ`}
          />

          <QuietPanel className="p-8">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                  Р РµР·СѓР»СЊС‚Р°С‚ СЂР°СЃРїРѕР·РЅР°РІР°РЅРёСЏ
                </p>
                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  <SummaryNumber label="РІР°СЂРёР°РЅС‚РѕРІ" value={validation.totalAnswers} />
                  <SummaryNumber label="РїСЂР°РІРёР»СЊРЅС‹С… РѕС‚РІРµС‚РѕРІ" value={validation.totalCorrectAnswers} />
                  <SummaryNumber label="РєРѕРґРёСЂРѕРІРєР°" value={quiz.encoding ?? "utf-8"} />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                <Button
                  className="h-12 rounded-full bg-emerald-500 px-6 text-base text-white hover:bg-emerald-600"
                  onClick={() => router.push("/editor")}
                >
                  РџСЂРѕРІРµСЂРёС‚СЊ РІРѕРїСЂРѕСЃС‹
                </Button>
                <Button
                  className="h-12 rounded-full px-6 text-base"
                  onClick={() => router.push("/settings")}
                  variant="outline"
                >
                  РќР°С‡Р°С‚СЊ С‚СЂРµРЅРёСЂРѕРІРєСѓ
                </Button>
                {!quiz.cloudId && !quiz.isDemo ? (
                  <Button
                    className="h-12 rounded-full px-6 text-base text-slate-600"
                    disabled={saveState === "saving"}
                    onClick={() => void saveCloudQuiz()}
                    variant="ghost"
                  >
                    {saveState === "saving" ? "РЎРѕС…СЂР°РЅСЏРµРј..." : "РЎРѕС…СЂР°РЅРёС‚СЊ С‚СЂРµРЅР°Р¶С‘СЂ"}
                  </Button>
                ) : null}
              </div>
            </div>
            {saveState === "error" ? (
              <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                РќРµ РїРѕР»СѓС‡РёР»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РІ Р°РєРєР°СѓРЅС‚. Р’РѕР№РґРёС‚Рµ РёР»Рё РїСЂРѕРІРµСЂСЊС‚Рµ Supabase env.
              </p>
            ) : null}

            <button
              className="mt-8 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
              onClick={() => setShowDetails((value) => !value)}
              type="button"
            >
              Р”РµС‚Р°Р»Рё РїСЂРѕРІРµСЂРєРё
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
                  <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <IssueLine label="РџСЂРѕРїСѓС‰РµРЅРЅС‹Рµ РЅРѕРјРµСЂР°" value={listOrZero(validation.missingNumbers)} />
                    <IssueLine label="Р‘РµР· РїСЂР°РІРёР»СЊРЅРѕРіРѕ РѕС‚РІРµС‚Р°" value={listOrZero(validation.questionsWithoutCorrectAnswer)} />
                    <IssueLine label="РќРµСЃРєРѕР»СЊРєРѕ РїСЂР°РІРёР»СЊРЅС‹С…" value={listOrZero(validation.questionsWithMultipleCorrectAnswers)} />
                    <IssueLine label="РњР°Р»Рѕ РІР°СЂРёР°РЅС‚РѕРІ" value={listOrZero(validation.questionsWithTooFewAnswers)} />
                    <IssueLine label="Р”СѓР±Р»РёРєР°С‚С‹ РѕС‚РІРµС‚РѕРІ" value={listOrZero(validation.questionsWithDuplicateAnswers)} />
                    <IssueLine label="РћС€РёР±РєРё С„РѕСЂРјР°С‚Р°" value={validation.formatIssues.length || 0} />
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
      <p className="text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function IssueLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-900/[0.06] py-3">
      <span>{label}</span>
      <span className="font-medium text-slate-950">{value}</span>
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
    return <LoadingState title="РћС‚РєСЂС‹РІР°РµРј СЂРµРґР°РєС‚РѕСЂ" />;
  }

  if (!quiz || !selected) {
    return <EmptyState title="РќРµС‚ С‚РµСЃС‚Р° РґР»СЏ СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ" action="Р—Р°РіСЂСѓР·РёС‚СЊ С‚РµСЃС‚" href="/upload" />;
  }

  return (
    <AppShell>
      <PageFrame className="max-w-7xl">
        <motion.div {...pageMotion} className="flex flex-col gap-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <PageTitle
              description="РњРёРЅРёРјР°Р»СЊРЅС‹Р№ СЂРµРґР°РєС‚РѕСЂ: СЃРїРёСЃРѕРє, РІС‹Р±СЂР°РЅРЅС‹Р№ РІРѕРїСЂРѕСЃ Рё С‚РѕР»СЊРєРѕ РЅСѓР¶РЅС‹Рµ РЅР°СЃС‚СЂРѕР№РєРё."
              title="РџСЂРѕРІРµСЂСЊС‚Рµ РІРѕРїСЂРѕСЃС‹"
            />
            <div className="flex items-center gap-3">
              {saved ? <span className="text-sm font-medium text-emerald-700">РЎРѕС…СЂР°РЅРµРЅРѕ</span> : null}
              <Button className="rounded-full" onClick={persist} variant="outline">
                <Save data-icon="inline-start" />
                РЎРѕС…СЂР°РЅРёС‚СЊ
              </Button>
              <Button
                className="rounded-full bg-emerald-500 px-5 text-white hover:bg-emerald-600"
                onClick={() => {
                  persist();
                  router.push("/settings");
                }}
              >
                РЎРѕС…СЂР°РЅРёС‚СЊ Рё РЅР°С‡Р°С‚СЊ
              </Button>
            </div>
          </div>

          <div className="grid min-h-[620px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)_260px]">
            <QuietPanel className="overflow-hidden p-3">
              <div className="flex gap-2 p-2">
                {[
                  ["all", "Р’СЃРµ"],
                  ["issues", "РћС€РёР±РєРё"],
                  ["missing_correct", "Р‘РµР· РѕС‚РІРµС‚Р°"],
                ].map(([value, label]) => (
                  <button
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm text-slate-500 transition",
                      filter === value && "bg-slate-950 text-white"
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
                      "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50",
                      selected.id === question.id && "bg-emerald-50"
                    )}
                    key={question.id}
                    onClick={() => setSelectedId(question.id)}
                    type="button"
                  >
                    <span className="mt-0.5 text-sm font-semibold text-slate-400">{question.number}</span>
                    <span className="line-clamp-2 text-sm leading-6 text-slate-700">{question.text}</span>
                  </button>
                ))}
              </div>
            </QuietPanel>

            <QuietPanel className="p-6 sm:p-8">
              <label className="text-sm font-medium text-slate-500" htmlFor="question-text">
                Р’РѕРїСЂРѕСЃ {selected.number}
              </label>
              <textarea
                className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-transparent bg-slate-50 p-4 text-2xl font-semibold leading-snug tracking-tight text-slate-950 outline-none transition focus:border-emerald-200 focus:bg-white"
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
                        text: "РќРѕРІС‹Р№ РІР°СЂРёР°РЅС‚",
                        correct: false,
                      },
                    ],
                  }))
                }
                variant="ghost"
              >
                Р”РѕР±Р°РІРёС‚СЊ РІР°СЂРёР°РЅС‚
              </Button>
            </QuietPanel>

            <QuietPanel className="p-6">
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">РЎС‚Р°С‚СѓСЃ</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {selected.status === "valid" ? "Р“РѕС‚РѕРІ" : "РџСЂРѕРІРµСЂРёС‚СЊ"}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <ToggleLine
                    checked={Boolean(selected.flagged)}
                    label="РЎРїРѕСЂРЅС‹Р№ РІРѕРїСЂРѕСЃ"
                    onChange={() => updateSelected((question) => ({ ...question, flagged: !question.flagged }))}
                  />
                  <ToggleLine
                    checked={Boolean(selected.favorite)}
                    label="РР·Р±СЂР°РЅРЅС‹Р№"
                    onChange={() => updateSelected((question) => ({ ...question, favorite: !question.favorite }))}
                  />
                  <ToggleLine
                    checked={Boolean(selected.difficult)}
                    label="РЎР»РѕР¶РЅС‹Р№"
                    onChange={() => updateSelected((question) => ({ ...question, difficult: !question.difficult }))}
                  />
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  РЎРѕРІРµС‚: РёСЃРїСЂР°РІСЊС‚Рµ С‚РѕР»СЊРєРѕ СЃРїРѕСЂРЅС‹Рµ РјРµСЃС‚Р°. РћСЃС‚Р°Р»СЊРЅРѕРµ РјРѕР¶РЅРѕ РѕСЃС‚Р°РІРёС‚СЊ РєР°Рє РµСЃС‚СЊ Рё РЅР°С‡Р°С‚СЊ С‚СЂРµРЅРёСЂРѕРІРєСѓ.
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
    <div className="flex items-center gap-3 rounded-2xl bg-white p-2 ring-1 ring-slate-900/[0.06]">
      <button
        aria-label="РћС‚РјРµС‚РёС‚СЊ РїСЂР°РІРёР»СЊРЅС‹Рј"
        className={cn(
          "size-8 rounded-full border transition",
          answer.correct ? "border-emerald-500 bg-emerald-500" : "border-slate-200 bg-white"
        )}
        onClick={onCorrect}
        type="button"
      />
      <input
        className="min-w-0 flex-1 bg-transparent px-1 text-base text-slate-800 outline-none"
        onChange={(event) => onText(event.target.value)}
        value={answer.text}
      />
      <Button className="rounded-full text-slate-400" onClick={onRemove} size="sm" variant="ghost">
        РЈРґР°Р»РёС‚СЊ
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
  const [activeTab, setActiveTab] = useState("РћСЃРЅРѕРІРЅРѕРµ");
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
    return <LoadingState title="Р“РѕС‚РѕРІРёРј РЅР°СЃС‚СЂРѕР№РєРё" />;
  }

  if (!quiz) {
    return <EmptyState title="РЎРЅР°С‡Р°Р»Р° РЅСѓР¶РµРЅ С‚РµСЃС‚" action="Р—Р°РіСЂСѓР·РёС‚СЊ С‚РµСЃС‚" href="/upload" />;
  }

  const tabs = [
    "РћСЃРЅРѕРІРЅРѕРµ",
    "Р’РѕРїСЂРѕСЃС‹",
    "РћС‚РІРµС‚С‹",
    "РџСЂРѕС…РѕР¶РґРµРЅРёРµ",
    "РўР°Р№РјРµСЂ",
    "РџРѕРїС‹С‚РєРё",
    "РџСЂРѕРІРµСЂРєР° РѕС‚РІРµС‚РѕРІ",
    "РџСЂРѕРіСЂРµСЃСЃ",
    "Р РµР·СѓР»СЊС‚Р°С‚С‹",
    "Р”РѕСЃС‚СѓРї",
    "Р’РЅРµС€РЅРёР№ РІРёРґ",
    "РРјРїРѕСЂС‚",
  ];
  const range = validateQuestionRange(settings, quiz);

  return (
    <AppShell>
      <PageFrame>
        <motion.div {...pageMotion} className="mx-auto flex max-w-4xl flex-col gap-9">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <PageTitle
              description="Р’С‹Р±РµСЂРёС‚Рµ С‚РѕР»СЊРєРѕ РіР»Р°РІРЅРѕРµ. РџРѕР»РЅС‹Рµ РїР°СЂР°РјРµС‚СЂС‹ РјРѕР¶РЅРѕ РѕС‚РєСЂС‹С‚СЊ РѕС‚РґРµР»СЊРЅРѕ."
              title="РќР°СЃС‚СЂРѕР№РєР° С‚СЂРµРЅРёСЂРѕРІРєРё"
            />
            <Button
              className="h-12 rounded-full bg-emerald-500 px-7 text-base font-semibold text-white shadow-[0_14px_34px_rgba(34,197,94,0.18)] hover:bg-emerald-600"
              disabled={!range.valid}
              onClick={persistAndStart}
            >
              РќР°С‡Р°С‚СЊ С‚СЂРµРЅРёСЂРѕРІРєСѓ
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>

          <QuietPanel className="p-6 sm:p-8">
            <div className="grid gap-8 md:grid-cols-2">
              <QuickChoice
                label="Р РµР¶РёРј"
                options={[
                  ["training", "РўСЂРµРЅРёСЂРѕРІРєР°"],
                  ["exam", "Р­РєР·Р°РјРµРЅ"],
                  ["mistakes", "РўРѕР»СЊРєРѕ РѕС€РёР±РєРё"],
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
                        : current.timer,
                  }))
                }
              />
              <QuickChoice
                label="РљРѕР»РёС‡РµСЃС‚РІРѕ РІРѕРїСЂРѕСЃРѕРІ"
                options={[
                  ["10", "10"],
                  ["20", "20"],
                  ["50", "50"],
                  ["all", "Р’СЃРµ"],
                  ["range", "РЎРІРѕР№ РґРёР°РїР°Р·РѕРЅ"],
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
                <div className="rounded-[1.5rem] bg-[#F8FAFC] p-5 md:col-span-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-slate-600">РЎ РІРѕРїСЂРѕСЃР°</span>
                      <input
                        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-indigo-300"
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
                      <span className="text-sm font-medium text-slate-600">РџРѕ РІРѕРїСЂРѕСЃ</span>
                      <input
                        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-indigo-300"
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
                  <p className={cn("mt-3 text-sm leading-6", range.valid ? "text-slate-500" : "text-red-500")}>
                    {range.message}
                  </p>
                </div>
              ) : null}
              <QuickChoice
                label="РџРѕСЂСЏРґРѕРє"
                options={[
                  ["file", "РџРѕ РїРѕСЂСЏРґРєСѓ"],
                  ["random", "РЎР»СѓС‡Р°Р№РЅРѕ"],
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
                label="РћС‚РІРµС‚С‹"
                options={[
                  ["file", "РљР°Рє РІ С„Р°Р№Р»Рµ"],
                  ["safe_random", "РџРµСЂРµРјРµС€Р°С‚СЊ"],
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
                label="РџРѕРєР°Р·С‹РІР°С‚СЊ РїСЂР°РІРёР»СЊРЅС‹Р№ РѕС‚РІРµС‚"
                options={[
                  ["immediately", "РЎСЂР°Р·Сѓ"],
                  ["end", "Р’ РєРѕРЅС†Рµ"],
                  ["never", "РќРµ РїРѕРєР°Р·С‹РІР°С‚СЊ"],
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
                label="РўР°Р№РјРµСЂ"
                options={[
                  ["off", "Р‘РµР· С‚Р°Р№РјРµСЂР°"],
                  ["30", "30 РјРёРЅСѓС‚"],
                  ["custom", "РЎРІРѕР№ РІР°СЂРёР°РЅС‚"],
                ]}
                value={!settings.timer.enabled ? "off" : settings.timer.minutes === 30 ? "30" : "custom"}
                onChange={(value) =>
                  updateSettings((current) => ({
                    ...current,
                    timer: {
                      ...current.timer,
                      enabled: value !== "off",
                      minutes: value === "30" ? 30 : value === "custom" ? 45 : null,
                    },
                  }))
                }
              />
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
            </div>
            <div className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-900/[0.06] pt-6 sm:flex-row sm:items-center">
              <p className="text-sm leading-6 text-slate-500">
                {quiz.questions.length} РІРѕРїСЂРѕСЃРѕРІ РІ С‚РµСЃС‚Рµ. РћР±С‹С‡РЅСѓСЋ С‚СЂРµРЅРёСЂРѕРІРєСѓ РјРѕР¶РЅРѕ Р·Р°РїСѓСЃС‚РёС‚СЊ РїСЂСЏРјРѕ СЃРµР№С‡Р°СЃ.
              </p>
              <button
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                onClick={() => setShowAdvanced((value) => !value)}
                type="button"
              >
                Р Р°СЃС€РёСЂРµРЅРЅС‹Рµ РЅР°СЃС‚СЂРѕР№РєРё
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
                  <div className="flex gap-1 overflow-x-auto border-b border-slate-900/[0.06] p-3">
                    {tabs.map((tab) => (
                      <button
                        className={cn(
                          "shrink-0 rounded-full px-4 py-2 text-sm text-slate-500 transition hover:text-slate-950",
                          activeTab === tab && "bg-slate-950 text-white hover:text-white"
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
    return { valid: false, count: 0, message: "РџСЂРѕРІРµСЂСЊС‚Рµ РґРёР°РїР°Р·РѕРЅ РІРѕРїСЂРѕСЃРѕРІ" };
  }

  const count = quiz.questions.filter((question) => question.number >= from && question.number <= to).length;

  if (count === 0) {
    return { valid: false, count, message: "Р’ СЌС‚РѕРј РґРёР°РїР°Р·РѕРЅРµ РЅРµС‚ РІРѕРїСЂРѕСЃРѕРІ" };
  }

  return {
    valid: true,
    count,
    message: `Р‘СѓРґРµС‚ РІС‹Р±СЂР°РЅРѕ ${count} ${pluralizeQuestions(count)} РёР· РґРёР°РїР°Р·РѕРЅР° ${from}вЂ“${to}`,
  };
}

function maxQuestionNumber(quiz: QuizDocument) {
  return Math.max(...quiz.questions.map((question) => question.number), quiz.questions.length);
}

function pluralizeQuestions(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "РІРѕРїСЂРѕСЃ";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "РІРѕРїСЂРѕСЃР°";
  }

  return "РІРѕРїСЂРѕСЃРѕРІ";
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
      <p className="mb-3 text-sm font-medium text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([optionValue, optionLabel]) => (
          <button
            className={cn(
              "rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition",
              value === optionValue && "border-emerald-500 bg-emerald-500 text-white"
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
  if (tab === "РћСЃРЅРѕРІРЅРѕРµ") {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="РќР°Р·РІР°РЅРёРµ"
          value={settings.general.title}
          onChange={(value) => update((current) => ({ ...current, general: { ...current.general, title: value } }))}
        />
        <TextField
          label="РљР°С‚РµРіРѕСЂРёСЏ"
          value={settings.general.category}
          onChange={(value) => update((current) => ({ ...current, general: { ...current.general, category: value } }))}
        />
        <TextField
          className="md:col-span-2"
          label="РћРїРёСЃР°РЅРёРµ"
          value={settings.general.description}
          onChange={(value) => update((current) => ({ ...current, general: { ...current.general, description: value } }))}
        />
      </div>
    );
  }

  if (tab === "Р’РѕРїСЂРѕСЃС‹") {
    return (
      <SettingsRows
        rows={[
          ["Р’СЃРµРіРѕ РІ С‚РµСЃС‚Рµ", `${quiz.questions.length}`],
          ["Р’С‹Р±РѕСЂ", selectionLabel(settings.questions.questionSelection)],
          ["РџРѕСЂСЏРґРѕРє", orderLabel(settings.questions.questionOrder)],
        ]}
      />
    );
  }

  if (tab === "РћС‚РІРµС‚С‹") {
    return (
      <div className="flex flex-col gap-4">
        <ToggleLine
          checked={settings.answers.protectSpecialAnswers}
          label="РќРµ РїРµСЂРµРјРµС€РёРІР°С‚СЊ СЃРїРµС†РёР°Р»СЊРЅС‹Рµ РІР°СЂРёР°РЅС‚С‹"
          onChange={() =>
            update((current) => ({
              ...current,
              answers: { ...current.answers, protectSpecialAnswers: !current.answers.protectSpecialAnswers },
            }))
          }
        />
        <SettingsRows rows={[["РџРѕСЂСЏРґРѕРє РѕС‚РІРµС‚РѕРІ", answerOrderLabel(settings.answers.answerOrder)]]} />
      </div>
    );
  }

  if (tab === "РџСЂРѕС…РѕР¶РґРµРЅРёРµ") {
    return (
      <div className="flex flex-col gap-4">
        <ToggleLine
          checked={settings.mode.allowSkip}
          label="Р Р°Р·СЂРµС€РёС‚СЊ РїСЂРѕРїСѓСЃРє"
          onChange={() => update((current) => ({ ...current, mode: { ...current.mode, allowSkip: !current.mode.allowSkip } }))}
        />
        <ToggleLine
          checked={settings.mode.showHints}
          label="РџРѕРєР°Р·С‹РІР°С‚СЊ РїРѕРґСЃРєР°Р·РєРё"
          onChange={() => update((current) => ({ ...current, mode: { ...current.mode, showHints: !current.mode.showHints } }))}
        />
      </div>
    );
  }

  if (tab === "РўР°Р№РјРµСЂ") {
    return (
      <div className="flex flex-col gap-4">
        <ToggleLine
          checked={settings.timer.enabled}
          label="Р’РєР»СЋС‡РёС‚СЊ С‚Р°Р№РјРµСЂ"
          onChange={() => update((current) => ({ ...current, timer: { ...current.timer, enabled: !current.timer.enabled, minutes: 30 } }))}
        />
        <SettingsRows rows={[["РџРѕ СѓРјРѕР»С‡Р°РЅРёСЋ", settings.timer.enabled ? "30 РјРёРЅСѓС‚" : "Р‘РµР· С‚Р°Р№РјРµСЂР°"]]} />
      </div>
    );
  }

  if (tab === "РџРѕРїС‹С‚РєРё") {
    return (
      <SettingsRows
        rows={[
          ["Р›РёРјРёС‚", settings.attempts.limitEnabled ? `${settings.attempts.maxAttempts ?? 3}` : "Р‘РµР· РѕРіСЂР°РЅРёС‡РµРЅРёР№"],
          ["РСЃС‚РѕСЂРёСЏ", settings.attempts.saveAttemptHistory ? "РЎРѕС…СЂР°РЅСЏС‚СЊ" : "РќРµ СЃРѕС…СЂР°РЅСЏС‚СЊ"],
          ["Р›СѓС‡С€РёР№ СЂРµР·СѓР»СЊС‚Р°С‚", settings.attempts.saveBestResult ? "РЎРѕС…СЂР°РЅСЏС‚СЊ" : "РќРµ СЃРѕС…СЂР°РЅСЏС‚СЊ"],
        ]}
      />
    );
  }

  if (tab === "РџСЂРѕРІРµСЂРєР° РѕС‚РІРµС‚РѕРІ") {
    return (
      <SettingsRows
        rows={[
          ["РџСЂР°РІРёР»СЊРЅС‹Р№ РѕС‚РІРµС‚", reviewLabel(settings.review.showCorrectAnswer)],
          ["РћР±СЉСЏСЃРЅРµРЅРёСЏ", explanationLabel(settings.review.showExplanation)],
          ["Р¤РѕСЂРјР°С‚ РѕС†РµРЅРєРё", "РџСЂРѕС†РµРЅС‚, Р±Р°Р»Р»С‹ Рё СЃРїРёСЃРѕРє РѕС€РёР±РѕРє"],
        ]}
      />
    );
  }

  if (tab === "РџСЂРѕРіСЂРµСЃСЃ") {
    return (
      <div className="flex flex-col gap-4">
        <ToggleLine checked={settings.progress.saveProgress} label="РЎРѕС…СЂР°РЅСЏС‚СЊ РїСЂРѕРіСЂРµСЃСЃ" onChange={() => update((current) => ({ ...current, progress: { ...current.progress, saveProgress: !current.progress.saveProgress } }))} />
        <SettingsRows rows={[["РЎРѕС…СЂР°РЅСЏС‚СЊ", "РїРѕР·РёС†РёСЋ, РѕС€РёР±РєРё, РІСЂРµРјСЏ, РёР·Р±СЂР°РЅРЅРѕРµ, СЃР»РѕР¶РЅС‹Рµ РІРѕРїСЂРѕСЃС‹"]]} />
      </div>
    );
  }

  if (tab === "Р РµР·СѓР»СЊС‚Р°С‚С‹") {
    return <SettingsRows rows={[["РџРѕРєР°Р·С‹РІР°С‚СЊ", "РїСЂРѕС†РµРЅС‚, РѕС€РёР±РєРё, РІСЂРµРјСЏ, Р»СѓС‡С€РёР№ СЂРµР·СѓР»СЊС‚Р°С‚"], ["Р”РµР№СЃС‚РІРёРµ", "РџРѕРІС‚РѕСЂРёС‚СЊ РѕС€РёР±РєРё"]]} />;
  }

  if (tab === "Р”РѕСЃС‚СѓРї") {
    return <SettingsRows rows={[["Р’РёРґРёРјРѕСЃС‚СЊ", accessLabel(settings.access.visibility)], ["РљРѕРїРёСЂРѕРІР°РЅРёРµ", settings.access.allowCopy ? "Р Р°Р·СЂРµС€РµРЅРѕ" : "Р—Р°РїСЂРµС‰РµРЅРѕ"]]} />;
  }

  if (tab === "Р’РЅРµС€РЅРёР№ РІРёРґ") {
    return <SettingsRows rows={[["РўРµРјР°", appearanceLabel(settings.appearance.theme)], ["Р¤РѕСЂРјР°С‚", "РћРґРёРЅ РІРѕРїСЂРѕСЃ РЅР° СЌРєСЂР°РЅ"], ["РђРЅРёРјР°С†РёРё", "Р’РєР»СЋС‡РµРЅС‹"]]} />;
  }

  return (
    <SettingsRows
      rows={[
        ["РљРѕРґРёСЂРѕРІРєР°", settings.import.encodingFallbacks.join(" в†’ ")],
        ["РџСѓСЃС‚С‹Рµ СЃС‚СЂРѕРєРё", "РРіРЅРѕСЂРёСЂРѕРІР°С‚СЊ"],
        ["EXE РІ ZIP", "РРіРЅРѕСЂРёСЂРѕРІР°С‚СЊ Рё РЅРёРєРѕРіРґР° РЅРµ Р·Р°РїСѓСЃРєР°С‚СЊ"],
        ["РџСЂРѕРІРµСЂРєР°", "РЅРѕРјРµСЂР°, РѕС‚РІРµС‚С‹, РґСѓР±Р»РёРєР°С‚С‹, С„РѕСЂРјР°С‚"],
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
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <input
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-emerald-300"
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
      className="flex w-full items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 text-left"
      onClick={onChange}
      type="button"
    >
      <span className="font-medium text-slate-700">{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-emerald-500" : "bg-slate-200"
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
        <div className="flex items-center justify-between gap-6 border-b border-slate-900/[0.06] py-4 last:border-b-0" key={label}>
          <span className="text-slate-500">{label}</span>
          <span className="text-right font-medium text-slate-950">{value}</span>
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
  const [index, setIndex] = useState(initialState.index);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | undefined>();
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<AttemptAnswer[]>(initialState.answers);

  if (!ready) {
    return <LoadingState title="РЎРѕР±РёСЂР°РµРј С‚СЂРµРЅРёСЂРѕРІРєСѓ" />;
  }

  if (!quiz || questions.length === 0) {
    const emptyTitle = settings.mode.type === "mistakes" ? "Ошибок нет" : "РќРµС‚ РІРѕРїСЂРѕСЃРѕРІ РґР»СЏ РїСЂРѕС…РѕР¶РґРµРЅРёСЏ";
    const emptyDescription =
      settings.mode.type === "mistakes"
        ? "Отличный результат. В этом тесте пока нет вопросов для повторения."
        : undefined;

    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={settings.mode.type === "mistakes" ? "В кабинет" : "Р—Р°РіСЂСѓР·РёС‚СЊ С‚РµСЃС‚"}
        href={settings.mode.type === "mistakes" ? "/dashboard" : "/upload"}
      />
    );
  }

  if (settings.mode.type === "quick") {
    return <GameTestRunner quiz={quiz} settings={settings} questions={questions} initialIndex={index} initialAnswers={answers} />;
  }

  const activeQuiz = quiz;
  const question = questions[Math.min(index, questions.length - 1)];
  const progress = Math.round(((index + (answered ? 1 : 0)) / questions.length) * 100);
  const selectedAnswer = question.answers.find((answer) => answer.id === selectedAnswerId);
  const isCorrect = Boolean(selectedAnswer?.correct);

  function submitAnswer(skipped = false) {
    if (!question) {
      return;
    }

    const answer: AttemptAnswer = {
      questionId: question.id,
      selectedAnswerId,
      correct: skipped ? false : isCorrect,
      skipped,
      answeredAt: new Date().toISOString(),
    };
    const nextAnswers = [...answers.filter((item) => item.questionId !== question.id), answer];

    setAnswers(nextAnswers);
    void saveProgressStepToAccount({ quiz: activeQuiz, answers: nextAnswers, currentQuestionId: question.id });

    if (settings.review.showCorrectAnswer === "immediately" || settings.mode.type === "training") {
      setAnswered(true);
      return;
    }

    goNext(nextAnswers);
  }

  function goNext(nextAnswers = answers) {
    setAnswered(false);
    setSelectedAnswerId(undefined);

    if (index >= questions.length - 1) {
      finish(nextAnswers);
      return;
    }

    const nextIndex = index + 1;
    setIndex(nextIndex);
    saveAttempt({
      id: "active",
      testId: activeQuiz.id,
      startedAt: new Date().toISOString(),
      currentIndex: nextIndex,
      answers: nextAnswers,
      score: scoreOf(nextAnswers),
      timeSpentSeconds: 0,
      completed: false,
    });
  }

  function finish(finalAnswers = answers) {
    const completedAttempt: TestAttempt = {
      id: crypto.randomUUID(),
      testId: activeQuiz.id,
      startedAt: new Date(Date.now() - finalAnswers.length * 42_000).toISOString(),
      finishedAt: new Date().toISOString(),
      currentIndex: questions.length - 1,
      answers: finalAnswers,
      score: scoreOf(finalAnswers),
      timeSpentSeconds: finalAnswers.length * 42,
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
          <div className="mb-7 flex items-center gap-5">
            <FlowProgress className="flex-1" value={progress} />
            <span className="text-sm font-medium text-slate-500">
              {index + 1}/{questions.length}
            </span>
          </div>

          <div className="min-h-[430px]">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
              {modeLabels[settings.mode.type]}
            </p>
            <h1 className="max-w-3xl text-pretty text-3xl font-semibold leading-[1.16] tracking-tight text-slate-950 sm:text-4xl">
              {question.text}
            </h1>
            <div className="mt-8 grid gap-3">
              {question.answers.map((answer) => {
                const selected = selectedAnswerId === answer.id;
                const revealCorrect = answered && answer.correct;
                const revealWrong = answered && selected && !answer.correct;

                return (
                  <button
                    className={cn(
                      "w-full rounded-2xl border border-slate-200 bg-white p-4 text-left text-base font-medium leading-7 text-slate-800 transition hover:-translate-y-0.5 hover:border-emerald-300 sm:p-5 sm:text-lg",
                      selected && "border-emerald-400 bg-emerald-50",
                      revealCorrect && "border-emerald-500 bg-emerald-50 text-emerald-900",
                      revealWrong && "border-amber-300 bg-amber-50 text-amber-950"
                    )}
                    disabled={answered}
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
              {answered ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-7 rounded-2xl bg-slate-950 p-5 text-white"
                  exit={{ opacity: 0, y: -8 }}
                  initial={{ opacity: 0, y: 8 }}
                >
                  <p className="text-lg font-semibold">{isCorrect ? "Р’РµСЂРЅРѕ" : "РЎС‚РѕРёС‚ РїРѕРІС‚РѕСЂРёС‚СЊ"}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {isCorrect ? "РћС‚Р»РёС‡РЅРѕ, РґРІРёРіР°РµРјСЃСЏ РґР°Р»СЊС€Рµ." : "РџСЂР°РІРёР»СЊРЅС‹Р№ РѕС‚РІРµС‚ РїРѕРґСЃРІРµС‡РµРЅ Р·РµР»С‘РЅС‹Рј."}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
            <Button className="rounded-full" onClick={() => router.push("/dashboard")} variant="ghost">
              Р—Р°РІРµСЂС€РёС‚СЊ РїРѕР·Р¶Рµ
            </Button>
            <div className="flex gap-3">
              {settings.mode.allowSkip ? (
                <Button className="rounded-full" onClick={() => submitAnswer(true)} variant="outline">
                  РџСЂРѕРїСѓСЃС‚РёС‚СЊ
                </Button>
              ) : null}
              {answered ? (
                <Button
                  className="rounded-full bg-emerald-500 px-6 text-white hover:bg-emerald-600"
                  onClick={() => goNext(answers)}
                >
                  Р”Р°Р»СЊС€Рµ
                </Button>
              ) : (
                <Button
                  className="rounded-full bg-emerald-500 px-6 text-white hover:bg-emerald-600"
                  disabled={!selectedAnswerId}
                  onClick={() => submitAnswer(false)}
                >
                  РћС‚РІРµС‚РёС‚СЊ
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
}: {
  quiz: QuizDocument;
  settings: TestSettings;
  questions: QuizQuestion[];
  initialIndex: number;
  initialAnswers: AttemptAnswer[];
}) {
  const router = useRouter();
  const secondsPerQuestion = settings.timer.secondsPerQuestion ?? 15;
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
    "bg-[#4F46E5] text-white shadow-[0_18px_45px_rgba(79,70,229,0.22)]",
    "bg-[#14B8A6] text-white shadow-[0_18px_45px_rgba(20,184,166,0.22)]",
    "bg-[#FF6B5A] text-white shadow-[0_18px_45px_rgba(255,107,90,0.2)]",
    "bg-[#F59E0B] text-slate-950 shadow-[0_18px_45px_rgba(245,158,11,0.2)]",
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
      startedAt: new Date().toISOString(),
      currentIndex: nextIndex,
      answers: nextAnswers,
      score: scoreOf(nextAnswers),
      timeSpentSeconds: nextAnswers.length * secondsPerQuestion,
      completed: false,
    });
  }

  function finish(finalAnswers: AttemptAnswer[]) {
    const completedAttempt: TestAttempt = {
      id: crypto.randomUUID(),
      testId: quiz.id,
      startedAt: new Date(Date.now() - finalAnswers.length * secondsPerQuestion * 1000).toISOString(),
      finishedAt: new Date().toISOString(),
      currentIndex: questions.length - 1,
      answers: finalAnswers,
      score: scoreOf(finalAnswers),
      timeSpentSeconds: finalAnswers.length * secondsPerQuestion,
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
          <div className="mb-5 grid gap-4 rounded-[1.5rem] bg-white/80 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/[0.04] dark:bg-white/[0.06] md:grid-cols-[1fr_auto_auto_auto] md:items-center">
            <FlowProgress className="md:max-w-md" value={progress} />
            <span className="text-sm font-semibold text-slate-600">
              {index + 1}/{questions.length}
            </span>
            <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
              {timeLeft}s
            </span>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {gameScore} pts · x{streak}
            </span>
          </div>

          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Быстрый режим</p>
            <h1 className="mx-auto mt-4 max-w-4xl text-pretty text-3xl font-semibold leading-[1.15] tracking-tight text-slate-950 sm:text-4xl">
              {question.text}
            </h1>
            {feedback ? (
              <p className="mt-3 text-base font-semibold text-slate-600">
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
                    "min-h-[132px] rounded-[1.75rem] p-5 text-left text-xl font-semibold leading-snug transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:min-h-[170px] sm:p-7",
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
                  <span className="mb-4 flex size-9 items-center justify-center rounded-full bg-white/22 text-base">
                    {String.fromCharCode(65 + answerIndex)}
                  </span>
                  <span className="block break-words">{answer.text}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex justify-center">
            <Button className="rounded-full text-slate-500" onClick={() => router.push("/dashboard")} variant="ghost">
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
    return <LoadingState title="РЎС‡РёС‚Р°РµРј СЂРµР·СѓР»СЊС‚Р°С‚" />;
  }

  if (!quiz || !attempt) {
    return <EmptyState title="Р РµР·СѓР»СЊС‚Р°С‚Р° РїРѕРєР° РЅРµС‚" action="РџСЂРѕР№С‚Рё С‚РµСЃС‚" href="/test" />;
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
              className="mx-auto mb-8 flex size-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
              initial={{ scale: 0.86, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Sparkles className="size-9" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">Р РµР·СѓР»СЊС‚Р°С‚</p>
              <h1 className="mt-4 text-7xl font-semibold tracking-tight text-slate-950">{attempt.score}%</h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-600">
                {correct} РїСЂР°РІРёР»СЊРЅС‹С… РёР· {attempt.answers.length}. РћС€РёР±РєРё СЃРѕС…СЂР°РЅРµРЅС‹, С‡С‚РѕР±С‹ СЃР»РµРґСѓСЋС‰Р°СЏ СЃРµСЃСЃРёСЏ Р±С‹Р»Р° РєРѕСЂРѕС‡Рµ Рё С‚РѕС‡РЅРµРµ.
              </p>
            </div>
            <div className="mx-auto mt-9 grid max-w-2xl gap-4 sm:grid-cols-3">
              <SummaryNumber label="РѕС€РёР±РѕРє" value={wrong} />
              <SummaryNumber label="РїСЂРѕРїСѓС‰РµРЅРѕ" value={skipped} />
              <SummaryNumber label="РІСЂРµРјСЏ" value={formatTime(attempt.timeSpentSeconds)} />
            </div>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              {wrong > 0 ? (
                <button
                  className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-500 px-6 font-semibold text-white hover:bg-emerald-600"
                  onClick={repeatMistakes}
                  type="button"
                >
                  Повторить {wrong} ошибок
                </button>
              ) : (
                <div className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-50 px-6 font-semibold text-emerald-700">
                  Ошибок нет
                </div>
              )}
              <Link className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 px-6 font-semibold text-slate-900 hover:bg-slate-50" href="/settings">
                РџСЂРѕР№С‚Рё Р·Р°РЅРѕРІРѕ
              </Link>
              <Link className="inline-flex h-12 items-center justify-center rounded-full px-6 font-semibold text-slate-500 hover:bg-slate-50" href="/dashboard">
                Р’ РєР°Р±РёРЅРµС‚
              </Link>
            </div>
          </QuietPanel>
          <p className="mt-6 text-center text-sm text-slate-500">
            Р›СѓС‡С€РёР№ СЂРµР·СѓР»СЊС‚Р°С‚: {progress?.bestScore ?? attempt.score}%.
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
    return <LoadingState title="РћС‚РєСЂС‹РІР°РµРј РєР°Р±РёРЅРµС‚" />;
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
                description="РџСЂРѕРґРѕР»Р¶РёС‚Рµ С‚СЂРµРЅРёСЂРѕРІРєСѓ РёР»Рё Р·Р°РіСЂСѓР·РёС‚Рµ РЅРѕРІС‹Р№ С„Р°Р№Р». Р—РґРµСЃСЊ С‚РѕР»СЊРєРѕ СЂРµР°Р»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ РёР· РІР°С€РµРіРѕ Р°РєРєР°СѓРЅС‚Р°."
                title="РЎ РІРѕР·РІСЂР°С‰РµРЅРёРµРј"
              />
              <Link className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-500 px-6 font-semibold text-white hover:bg-emerald-600" href="/upload">
                Р—Р°РіСЂСѓР·РёС‚СЊ С‚РµСЃС‚
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <DashboardMetric label="РњРѕРё С‚СЂРµРЅР°Р¶С‘СЂС‹" value={cloudTests.length} />
              <DashboardMetric label="РџРѕСЃР»РµРґРЅРёР№ РїСЂРѕРіСЂРµСЃСЃ" value={`${averageProgress}%`} />
              <DashboardMetric label="РћС€РёР±РєРё РґР»СЏ РїРѕРІС‚РѕСЂРµРЅРёСЏ" value={totalWrong || "РЅРµС‚"} tone="coral" />
              <DashboardMetric label="Р›СѓС‡С€РёР№ СЂРµР·СѓР»СЊС‚Р°С‚" value={bestScore ? `${Math.round(bestScore)}%` : "РїРѕРєР° РЅРµС‚"} />
            </div>
            <QuietPanel className="p-7 sm:p-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">РњРѕРё С‚СЂРµРЅР°Р¶С‘СЂС‹</h2>
                  <p className="mt-2 text-base text-slate-500">
                    {totalAttempts ? `Р’СЃРµРіРѕ РїРѕРїС‹С‚РѕРє: ${totalAttempts}` : "РџРѕРїС‹С‚РєРё РїРѕСЏРІСЏС‚СЃСЏ РїРѕСЃР»Рµ РїРµСЂРІРѕР№ С‚СЂРµРЅРёСЂРѕРІРєРё."}
                    {lastAttempt?.lastAttemptAt ? ` РџРѕСЃР»РµРґРЅСЏСЏ: ${formatDashboardDate(lastAttempt.lastAttemptAt)}.` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-7 flex flex-col divide-y divide-slate-900/[0.06]">
                {cloudTests.map((test) => (
                  <div className="grid gap-6 py-6 first:pt-0 last:pb-0 md:grid-cols-[1fr_220px] md:items-center" key={test.id}>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{test.title}</h3>
                        <span className="rounded-full bg-[#EDE9FE] px-3 py-1 text-xs font-semibold text-[#6D5BD0]">
                          {String(test.sourceFormat || "qst").toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-2 text-base text-slate-500">
                        {test.questionCount} РІРѕРїСЂРѕСЃРѕРІ В· СЃРѕР·РґР°РЅ {formatDashboardDate(test.createdAt ?? test.updatedAt)}
                      </p>
                      <div className="mt-5 flex max-w-xl items-center gap-4">
                        <FlowProgress className="flex-1" value={test.progressPercent} />
                        <span className="w-12 text-right text-sm font-medium text-slate-500">
                          {Math.round(test.progressPercent)}%
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-500">
                        Р›СѓС‡С€РёР№ СЂРµР·СѓР»СЊС‚Р°С‚: {test.bestScorePercent ? `${Math.round(test.bestScorePercent)}%` : "РїРѕРєР° РЅРµС‚"}
                        {test.lastAttemptScore ? ` В· РїРѕСЃР»РµРґРЅСЏСЏ РїРѕРїС‹С‚РєР° ${Math.round(test.lastAttemptScore)}%` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Link className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 font-medium text-white hover:bg-slate-800" href={`/tests/${test.id}`}>
                        РџСЂРѕРґРѕР»Р¶РёС‚СЊ
                      </Link>
                      <Link className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 font-medium text-slate-700 hover:bg-slate-50" href={`/tests/${test.id}`}>
                        РќР°СЃС‚СЂРѕРёС‚СЊ
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </QuietPanel>
            {totalWrong === 0 ? (
              <p className="text-center text-sm text-slate-500">РџРѕРєР° РѕС€РёР±РѕРє РЅРµС‚. РћС‚Р»РёС‡РЅС‹Р№ СЃС‚Р°СЂС‚.</p>
            ) : null}
          </motion.div>
        </PageFrame>
      </AppShell>
    );
  }

  if (cloudChecked && cloudTests?.length === 0) {
    return (
      <EmptyState
        action="Р—Р°РіСЂСѓР·РёС‚СЊ С‚РµСЃС‚"
        description="Р—Р°РіСЂСѓР·РёС‚Рµ QST, TXT РёР»Рё ZIP С„Р°Р№Р», С‡С‚РѕР±С‹ СЃРѕР·РґР°С‚СЊ РїРµСЂРІС‹Р№ РёРЅС‚РµСЂР°РєС‚РёРІРЅС‹Р№ С‚РµСЃС‚."
        href="/upload"
        title="Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ РІ Trainova"
      />
    );
  }

  if (!quiz) {
    return (
      <EmptyState
        title="РЈ РІР°СЃ РїРѕРєР° РЅРµС‚ С‚СЂРµРЅР°Р¶С‘СЂРѕРІ"
        description="Р—Р°РіСЂСѓР·РёС‚Рµ РїРµСЂРІС‹Р№ С„Р°Р№Р», С‡С‚РѕР±С‹ РЅР°С‡Р°С‚СЊ."
        action="Р—Р°РіСЂСѓР·РёС‚СЊ С‚РµСЃС‚"
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
              description="Р­С‚РѕС‚ С‚РµСЃС‚ СЃРѕС…СЂР°РЅС‘РЅ С‚РѕР»СЊРєРѕ РЅР° СѓСЃС‚СЂРѕР№СЃС‚РІРµ. РџРѕСЃР»Рµ РІС…РѕРґР° РµРіРѕ РјРѕР¶РЅРѕ РїРµСЂРµРЅРµСЃС‚Рё РІ Р°РєРєР°СѓРЅС‚."
              title="Р›РѕРєР°Р»СЊРЅР°СЏ С‚СЂРµРЅРёСЂРѕРІРєР°"
            />
            <Link className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-500 px-6 font-semibold text-white hover:bg-emerald-600" href="/test">
              РџСЂРѕРґРѕР»Р¶РёС‚СЊ
            </Link>
          </div>

          <QuietPanel className="p-7 sm:p-8">
            <div className="grid gap-8 md:grid-cols-[1fr_220px] md:items-center">
              <div className="flex items-start gap-5">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <BookOpen className="size-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{quiz.title}</h2>
                  <p className="mt-2 text-base text-slate-500">
                    {quiz.questions.length} РІРѕРїСЂРѕСЃРѕРІ В· РїРѕСЃР»РµРґРЅРёР№ СЂРµР·СѓР»СЊС‚Р°С‚ {progress?.bestScore ?? 0}%
                  </p>
                  <FlowProgress className="mt-6 max-w-md" value={completion} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Link className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 font-medium text-white" href="/settings">
                  РќР°СЃС‚СЂРѕРёС‚СЊ СЃРµСЃСЃРёСЋ
                </Link>
                <Link className="inline-flex h-11 items-center justify-center rounded-full px-5 font-medium text-slate-500 hover:bg-slate-50" href="/editor">
                  Р РµРґР°РєС‚РѕСЂ
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
    return <LoadingState title="РЎРѕР±РёСЂР°РµРј РїСЂРѕРіСЂРµСЃСЃ" />;
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
              description="Р РµР°Р»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ РёР· Р°РєРєР°СѓРЅС‚Р°: РїСЂРѕРіСЂРµСЃСЃ, РїРѕРїС‹С‚РєРё Рё РІРѕРїСЂРѕСЃС‹, РєРѕС‚РѕСЂС‹Рµ СЃС‚РѕРёС‚ РїРѕРІС‚РѕСЂРёС‚СЊ."
              title="Р’Р°С€ РїСЂРѕРіСЂРµСЃСЃ"
            />
            <div className="grid gap-3 md:grid-cols-4">
              <DashboardMetric label="Р’РѕРїСЂРѕСЃРѕРІ СЂРµС€РµРЅРѕ" value={solved} />
              <DashboardMetric label="Р›СѓС‡С€РёР№ СЂРµР·СѓР»СЊС‚Р°С‚" value={best ? `${Math.round(best)}%` : "РїРѕРєР° РЅРµС‚"} />
              <DashboardMetric label="РџРѕРїС‹С‚РѕРє" value={attempts || "РЅРµС‚"} />
              <DashboardMetric label="РћС€РёР±РєРё" value={wrong || "РЅРµС‚"} tone="coral" />
            </div>
            <QuietPanel className="p-7 sm:p-8">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">РўСЂРµРЅР°Р¶С‘СЂС‹</h2>
              <div className="mt-7 flex flex-col divide-y divide-slate-900/[0.06]">
                {cloudTests.map((test) => (
                  <Link
                    className="grid gap-5 py-5 first:pt-0 last:pb-0 transition hover:translate-x-1 md:grid-cols-[1fr_180px] md:items-center"
                    href={`/tests/${test.id}`}
                    key={test.id}
                  >
                    <div>
                      <p className="text-xl font-semibold tracking-tight text-slate-950">{test.title}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {test.attemptCount || 0} РїРѕРїС‹С‚РѕРє В· {test.wrongCount || 0} РѕС€РёР±РѕРє РґР»СЏ РїРѕРІС‚РѕСЂРµРЅРёСЏ
                      </p>
                      <FlowProgress className="mt-4 max-w-lg" value={test.progressPercent} />
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-2xl font-semibold text-slate-950">
                        {test.bestScorePercent ? `${Math.round(test.bestScorePercent)}%` : "вЂ”"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">Р»СѓС‡С€РёР№ СЂРµР·СѓР»СЊС‚Р°С‚</p>
                    </div>
                  </Link>
                ))}
              </div>
            </QuietPanel>
            {wrong === 0 ? (
              <QuietPanel className="p-7 text-center">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">РџРѕРєР° РѕС€РёР±РѕРє РЅРµС‚. РћС‚Р»РёС‡РЅС‹Р№ СЃС‚Р°СЂС‚.</h2>
                <p className="mx-auto mt-2 max-w-lg text-base leading-7 text-slate-500">
                  РљРѕРіРґР° РїРѕСЏРІСЏС‚СЃСЏ РІРѕРїСЂРѕСЃС‹ РґР»СЏ РїРѕРІС‚РѕСЂРµРЅРёСЏ, Trainova СЃРѕР±РµСЂС‘С‚ РёС… Р·РґРµСЃСЊ РІ СЃРїРѕРєРѕР№РЅС‹Р№ СЃРїРёСЃРѕРє.
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
        title="РџСЂРѕРіСЂРµСЃСЃ РїРѕСЏРІРёС‚СЃСЏ РїРѕСЃР»Рµ РїРµСЂРІРѕР№ С‚СЂРµРЅРёСЂРѕРІРєРё"
        description="Р—Р°РіСЂСѓР·РёС‚Рµ С‚РµСЃС‚, РїСЂРѕР№РґРёС‚Рµ РїРµСЂРІСѓСЋ СЃРµСЃСЃРёСЋ, Рё Р·РґРµСЃСЊ РїРѕСЏРІСЏС‚СЃСЏ СЂРµР°Р»СЊРЅС‹Рµ РїРѕРїС‹С‚РєРё Рё РѕС€РёР±РєРё."
        action="Р—Р°РіСЂСѓР·РёС‚СЊ С‚РµСЃС‚"
        href="/upload"
      />
    );
  }

  if (!quiz) {
    return (
      <EmptyState
        title="РџСЂРѕРіСЂРµСЃСЃ РїРѕСЏРІРёС‚СЃСЏ РїРѕСЃР»Рµ РїРµСЂРІРѕР№ С‚СЂРµРЅРёСЂРѕРІРєРё"
        description="Р—РґРµСЃСЊ РЅРµ Р±СѓРґРµС‚ С„РµР№РєРѕРІС‹С… РіСЂР°С„РёРєРѕРІ: С‚РѕР»СЊРєРѕ РІР°С€Рё СЂРµР°Р»СЊРЅС‹Рµ С‚СЂРµРЅРёСЂРѕРІРєРё."
        action="Р—Р°РіСЂСѓР·РёС‚СЊ С‚РµСЃС‚"
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
                description="РЎРїРѕРєРѕР№РЅС‹Р№ РїСЂРѕРіСЂРµСЃСЃ Р±РµР· Р»РёС€РЅРµР№ Р°РЅР°Р»РёС‚РёРєРё: streak, С†РµР»СЊ РґРЅСЏ Рё РІРѕРїСЂРѕСЃС‹, РєРѕС‚РѕСЂС‹Рµ СЃС‚РѕРёС‚ РїРѕРІС‚РѕСЂРёС‚СЊ."
                title="РЎРµРіРѕРґРЅСЏС€РЅСЏСЏ С‚СЂРµРЅРёСЂРѕРІРєР°"
              />
              <div className="mt-10">
                <QuietPanel className="p-8">
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">Р¦РµР»СЊ РґРЅСЏ</p>
                      <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                        {progress?.solvedToday ?? 0} РІРѕРїСЂРѕСЃРѕРІ СЃРµРіРѕРґРЅСЏ
                      </h2>
                    </div>
                    <div className="flex size-20 items-center justify-center rounded-full bg-yellow-50 text-2xl font-semibold text-yellow-600">
                      {progress?.streak ?? 1}
                    </div>
                  </div>
                  <FlowProgress className="mt-8" value={Math.min(100, ((progress?.solvedToday ?? 0) / 20) * 100)} />
                </QuietPanel>
              </div>
            </div>

            <QuietPanel className="p-6">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">РџРѕРІС‚РѕСЂРёС‚СЊ СЃР»Р°Р±С‹Рµ РІРѕРїСЂРѕСЃС‹</h2>
              {weakQuestions.length ? (
                <>
                  <div className="mt-6 flex flex-col gap-4">
                    {weakQuestions.map((question) => (
                      <div className="border-b border-slate-900/[0.06] pb-4 last:border-b-0 last:pb-0" key={question.id}>
                        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{question.text}</p>
                      </div>
                    ))}
                  </div>
                  <Link className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-full bg-emerald-500 font-semibold text-white hover:bg-emerald-600" href="/test">
                    РўСЂРµРЅРёСЂРѕРІР°С‚СЊ
                  </Link>
                </>
              ) : (
                <p className="mt-6 text-sm leading-6 text-slate-500">РџРѕРєР° РѕС€РёР±РѕРє РЅРµС‚. РћС‚Р»РёС‡РЅС‹Р№ СЃС‚Р°СЂС‚.</p>
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
    <div className="rounded-[1.5rem] bg-white/70 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.045)] ring-1 ring-slate-900/[0.04]">
      <p className={cn("text-sm font-medium", tone === "coral" ? "text-[#E34D3D]" : "text-emerald-700")}>
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function formatDashboardDate(value?: string | null) {
  if (!value) {
    return "РїРѕРєР° РЅРµС‚";
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
          <GraduationCap className="mb-7 size-12 text-emerald-500" />
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">{title}</h1>
          {description ? <p className="mt-4 text-lg leading-8 text-slate-500">{description}</p> : null}
          <Link className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-emerald-500 px-6 font-semibold text-white hover:bg-emerald-600" href={href}>
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
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
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

  return {
    quiz,
    settings,
    questions,
    index: canResume ? active?.currentIndex ?? 0 : 0,
    answers: canResume ? active?.answers ?? [] : [],
  };
}

function shuffleAnswers(answers: QuizAnswer[], protectSpecial: boolean) {
  const specialPattern = /^(РІСЃРµ|РЅРµС‚|РЅРё РѕРґРёРЅ|РІСЃС‘|all|none)/i;
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
    return `${count} РјРѕРјРµРЅС‚`;
  }

  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return `${count} РјРѕРјРµРЅС‚Р°`;
  }

  return `${count} РјРѕРјРµРЅС‚РѕРІ`;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function selectionLabel(value: TestSettings["questions"]["questionSelection"]) {
  return {
    all: "Р’СЃРµ РІРѕРїСЂРѕСЃС‹",
    random: "РЎР»СѓС‡Р°Р№РЅС‹Рµ",
    unseen: "РўРѕР»СЊРєРѕ РЅРµРїСЂРѕР№РґРµРЅРЅС‹Рµ",
    mistakes: "РўРѕР»СЊРєРѕ РѕС€РёР±РєРё",
    favorites: "РР·Р±СЂР°РЅРЅС‹Рµ",
    difficult: "РЎР»РѕР¶РЅС‹Рµ",
  }[value];
}

function orderLabel(value: TestSettings["questions"]["questionOrder"]) {
  return {
    file: "РљР°Рє РІ С„Р°Р№Р»Рµ",
    random: "РЎР»СѓС‡Р°Р№РЅС‹Р№",
    new_first: "РЎРЅР°С‡Р°Р»Р° РЅРѕРІС‹Рµ",
    difficult_first: "РЎРЅР°С‡Р°Р»Р° СЃР»РѕР¶РЅС‹Рµ",
    mistakes_first: "РЎРЅР°С‡Р°Р»Р° РѕС€РёР±РєРё",
  }[value];
}

function answerOrderLabel(value: TestSettings["answers"]["answerOrder"]) {
  return {
    file: "РљР°Рє РІ С„Р°Р№Р»Рµ",
    random: "РЎР»СѓС‡Р°Р№РЅС‹Р№",
    safe_random: "РЎР»СѓС‡Р°Р№РЅС‹Р№ СЃ Р·Р°С‰РёС‚РѕР№ СЃРїРµС†РёР°Р»СЊРЅС‹С… РІР°СЂРёР°РЅС‚РѕРІ",
  }[value];
}

function reviewLabel(value: TestSettings["review"]["showCorrectAnswer"]) {
  return {
    immediately: "РЎСЂР°Р·Сѓ",
    after_each_question: "РџРѕСЃР»Рµ РІРѕРїСЂРѕСЃР°",
    end: "Р’ РєРѕРЅС†Рµ",
    never: "РќРёРєРѕРіРґР°",
  }[value];
}

function explanationLabel(value: TestSettings["review"]["showExplanation"]) {
  return {
    always: "Р’СЃРµРіРґР°",
    after_wrong_answer: "РџРѕСЃР»Рµ РѕС€РёР±РєРё",
    never: "РќРµ РїРѕРєР°Р·С‹РІР°С‚СЊ",
  }[value];
}

function accessLabel(value: TestSettings["access"]["visibility"]) {
  return {
    private: "РўРѕР»СЊРєРѕ СЏ",
    link: "РџРѕ СЃСЃС‹Р»РєРµ",
    public: "РџСѓР±Р»РёС‡РЅС‹Р№",
    password: "РџРѕ РїР°СЂРѕР»СЋ",
  }[value];
}

function appearanceLabel(value: TestSettings["appearance"]["theme"]) {
  return {
    light: "РЎРІРµС‚Р»Р°СЏ",
    dark: "РўС‘РјРЅР°СЏ",
    green: "Р—РµР»С‘РЅР°СЏ",
    minimal: "РњРёРЅРёРјР°Р»РёСЃС‚РёС‡РЅР°СЏ",
  }[value];
}
