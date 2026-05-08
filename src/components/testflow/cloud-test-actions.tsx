"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { fetchCloudTest } from "@/lib/quiz/cloud";
import { saveQuiz, saveSettings } from "@/lib/quiz/storage";
import type { TestSettings } from "@/lib/quiz/types";

type Props = {
  testId: string;
  hasWrongQuestions?: boolean;
};

function settingsForStart(settings: TestSettings, mode: "training" | "mistakes") {
  if (mode === "mistakes") {
    return {
      ...settings,
      mode: {
        ...settings.mode,
        type: "mistakes" as const,
      },
      questions: {
        ...settings.questions,
        questionSelection: "mistakes" as const,
      },
    };
  }

  return {
    ...settings,
    mode: {
      ...settings.mode,
      type: "training" as const,
    },
  };
}

export function CloudTestActions({ testId, hasWrongQuestions }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function open(destination: "/test" | "/settings", mode: "training" | "mistakes" = "training") {
    setError(null);
    startTransition(async () => {
      try {
        const detail = await fetchCloudTest(testId);

        if (!detail) {
          setError("Не получилось открыть тренажёр. Попробуйте войти заново.");
          return;
        }

        saveQuiz(detail.quiz);
        saveSettings(settingsForStart(detail.settings, mode));
        router.push(destination);
      } catch {
        setError("Не получилось загрузить тренажёр из аккаунта.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Button className="trainova-primary trainova-pill h-11 px-5 font-bold" disabled={pending} onClick={() => open("/test")} type="button">
        {pending ? "Открываем..." : "Начать тренировку"}
      </Button>
      <Button
        className="trainova-secondary trainova-pill h-11 px-5 font-bold"
        disabled={pending}
        onClick={() => open("/settings")}
        type="button"
        variant="outline"
      >
        Настроить
      </Button>
      {hasWrongQuestions ? (
        <Button
          className="h-11 rounded-full px-5 font-bold text-[#d85d4e] hover:bg-[#ffc38c]/30"
          disabled={pending}
          onClick={() => open("/test", "mistakes")}
          type="button"
          variant="ghost"
        >
          Повторить ошибки
        </Button>
      ) : null}
      {error ? <p className="text-sm leading-6 text-red-500">{error}</p> : null}
    </div>
  );
}
