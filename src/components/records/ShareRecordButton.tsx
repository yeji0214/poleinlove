"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/ui/icons";

export function ShareRecordButton({
  id,
  skillName,
}: {
  id: number;
  skillName: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/share/${id}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: skillName || "poleinlove", url });
      } catch {
        // 사용자가 공유 시트를 취소한 경우 등은 무시
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="relative cursor-pointer rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      aria-label="공유 링크 복사"
    >
      <ShareIcon />
      {copied && (
        <span className="absolute -bottom-8 right-0 whitespace-nowrap rounded-lg bg-zinc-800 px-2 py-1 text-xs text-white">
          링크 복사됨
        </span>
      )}
    </button>
  );
}
