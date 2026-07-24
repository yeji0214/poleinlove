"use client";

import { useRouter } from "next/navigation";
import { PRESET_TAGS } from "@/lib/constants";

type Props = { activeTag?: string; query?: string };

export function TagFilter({ activeTag, query }: Props) {
  const router = useRouter();

  function handleClick(tag: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (activeTag !== tag) params.set("tag", tag);
    const qs = params.toString();
    router.replace(qs ? `/records?${qs}` : "/records");
  }

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {PRESET_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => handleClick(tag)}
          className={`shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors ${
            activeTag === tag
              ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
