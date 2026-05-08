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
      <label className="text-sm font-bold text-[#586380] dark:text-[#c7cce0]" htmlFor="account-name">
        Имя
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="trainova-input h-12 flex-1 px-4 text-base outline-none transition"
          id="account-name"
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Как вас называть"
          value={fullName}
        />
        <Button className="trainova-primary trainova-pill h-12 px-6 font-bold" disabled={pending} onClick={save} type="button">
          {pending ? "Сохраняем..." : "Сохранить"}
        </Button>
      </div>
      {message ? <p className={message === "Сохранено" ? "text-sm text-[#4255ff]" : "text-sm text-red-500"}>{message}</p> : null}
    </div>
  );
}
