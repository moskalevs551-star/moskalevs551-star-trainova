import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { AppShell, PageFrame, PageTitle, QuietPanel } from "./shell";

const pageCopy = {
  docs: {
    title: "Документация",
    description: "Короткое описание импорта, структуры QST и безопасной обработки файлов.",
    items: [
      ["QST", "? начинает вопрос, + отмечает правильный ответ, - отмечает неправильный ответ."],
      ["TXT", "Поддерживается тот же простой формат, если файл сохранён как обычный текст."],
      ["ZIP", "Trainova ищет .qst и .txt внутри архива, а исполняемые файлы игнорирует."],
    ],
  },
  formats: {
    title: "Форматы файлов",
    description: "Главный формат — .qst. TXT работает как текстовый вариант, ZIP нужен для архивов с несколькими файлами.",
    items: [
      [".qst", "Старый тестовый формат с вопросами, вариантами и правильными ответами."],
      [".txt", "Подходит для ручных списков вопросов в QST-подобной структуре."],
      [".zip", "Безопасно распаковывается в браузере, .exe не запускаются и не используются."],
    ],
  },
  help: {
    title: "Помощь",
    description: "Быстрые ответы по загрузке, распознаванию и сохранению прогресса.",
    items: [
      ["Как загрузить файл?", "Откройте импорт, перетащите .qst, .txt или .zip и проверьте найденные вопросы."],
      ["Что делать, если файл не распознался?", "Проверьте, что вопросы начинаются с ?, а ответы — с + или -."],
      ["Как сохранить прогресс?", "Войдите в аккаунт, после этого локальный тест можно сохранить в Supabase."],
    ],
  },
  security: {
    title: "Безопасность",
    description: "Trainova не запускает файлы, не показывает приватные тесты другим пользователям и хранит доступ через Supabase Auth.",
    items: [
      [".exe не запускаются", "Исполняемые файлы внутри ZIP игнорируются и не попадают в сценарий импорта."],
      ["Приватность", "Private-тесты видит только владелец, public/link-тесты открываются по правилам RLS."],
      ["Ключи", "Клиент использует только NEXT_PUBLIC_SUPABASE_ANON_KEY, service role key остаётся на сервере."],
    ],
  },
};

export function InfoPage({ type }: { type: keyof typeof pageCopy }) {
  const content = pageCopy[type];

  return (
    <AppShell>
      <PageFrame>
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <PageTitle description={content.description} title={content.title} />
          <QuietPanel className="p-6 sm:p-8">
            <div className="grid gap-5">
              {content.items.map(([title, text]) => (
                <div className="rounded-[1.5rem] bg-[#F8FAFC] p-5" key={title}>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-[#10B981]" />
                    <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
                  </div>
                  <p className="mt-3 text-base leading-7 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </QuietPanel>
          <Link
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[#10B981] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#047857]"
            href="/upload"
          >
            Загрузить тест
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </PageFrame>
    </AppShell>
  );
}

export function BlogPage() {
  const posts = [
    ["Как подготовить старый QST-файл", "Практичный разбор структуры вопроса, ответов и частых ошибок импорта."],
    ["Почему короткие тренировки работают лучше", "Как делить большой тест на понятные учебные сессии."],
    ["Как повторять ошибки без стресса", "Мягкая механика повторения сложных вопросов и прогресса."],
  ];

  return (
    <AppShell>
      <PageFrame>
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <PageTitle description="Будущие материалы о подготовке тестов, импорте и учебных сценариях." title="Блог" />
          <div className="grid gap-4 md:grid-cols-3">
            {posts.map(([title, text]) => (
              <QuietPanel className="p-5" key={title}>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </QuietPanel>
            ))}
          </div>
        </div>
      </PageFrame>
    </AppShell>
  );
}
