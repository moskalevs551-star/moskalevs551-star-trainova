import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function TrainovaLogo({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-block h-12 w-44", className)}>
      <Image
        alt="Trainova"
        className="h-full w-full object-contain dark:hidden"
        height={47}
        priority
        src="/images/trainova-logo.png"
        width={172}
      />
      <Image
        alt="Trainova"
        className="hidden h-full w-full object-contain dark:block"
        height={223}
        priority
        src="/images/trainova-logo-dark.png"
        width={820}
      />
    </span>
  );
}

export function TrainovaMark({ className }: { className?: string }) {
  return <TrainovaLogo className={cn("h-12", className)} />;
}

export const TestFlowMark = TrainovaMark;

export function BrandLink() {
  return (
    <Link
      aria-label="Trainova"
      className="group -ml-2 flex items-center rounded-2xl px-2 py-1 transition hover:bg-white/70"
      href="/"
    >
      <TrainovaLogo className="h-11 transition-transform duration-200 group-hover:scale-[1.02]" />
    </Link>
  );
}
