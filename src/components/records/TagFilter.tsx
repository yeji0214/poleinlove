"use client";

import { useRouter } from "next/navigation";
import { PRESET_TAGS } from "@/lib/constants";

type Props = { activeTag?: string };

export function TagFilter({ activeTag }: Props) {
  const router = useRouter();

  function handleClick(tag: string) {
    if (activeTag === tag) {
      router.push("/records");
    } else {
      router.push(`/records?tag=${encodeURIComponent(tag)}`);
    }
  }

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {PRESET_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => handleClick(tag)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
            activeTag === tag
              ? "bg-zinc-800 text-white"
              : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
