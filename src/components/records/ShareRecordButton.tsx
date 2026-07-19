"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/ui/icons";

export function ShareRecordButton({ id }: { id: number }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/share/${id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="relative cursor-pointer rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
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
