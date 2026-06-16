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
