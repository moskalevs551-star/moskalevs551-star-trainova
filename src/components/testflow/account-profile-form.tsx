"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AccountProfileForm({ initialName }: { initialName?: string | null }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/account", {
        body: JSON.stringify({ fullName }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      });

      if (!response.ok) {
        setMessage("Не получилось сохранить имя.");
        return;
      }

      setMessage("Сохранено");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-slate-500" htmlFor="account-name">
        Имя
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
          id="account-name"
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Как вас называть"
          value={fullName}
        />
        <Button
          className="h-12 rounded-full bg-emerald-500 px-6 font-semibold text-white hover:bg-emerald-600"
          disabled={pending}
          onClick={save}
          type="button"
        >
          {pending ? "Сохраняем..." : "Сохранить"}
        </Button>
      </div>
      {message ? (
        <p className={message === "Сохранено" ? "text-sm text-emerald-700" : "text-sm text-red-500"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
