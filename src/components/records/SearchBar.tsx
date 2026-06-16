"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchIcon } from "@/components/ui/icons";

type Props = { defaultValue?: string; tag?: string };

export function SearchBar({ defaultValue, tag }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (tag) params.set("tag", tag);
      if (value) params.set("q", value);
      const qs = params.toString();
      router.replace(qs ? `/records?${qs}` : "/records");
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="mb-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
      <SearchIcon className="shrink-0 text-zinc-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="기술명, 메모 검색..."
        className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
      />
    </div>
  );
}
