"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/ui/icons";

export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
      aria-label="뒤로 가기"
    >
      <ArrowLeftIcon />
    </button>
  );
}
