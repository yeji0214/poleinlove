"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadMoreRecords } from "@/app/records/actions";
import { RecordListItem, type RecordListItemData } from "./RecordListItem";

type Props = {
  initialRecords: RecordListItemData[];
  total: number;
  tag?: string;
  q?: string;
};

export function RecordList({ initialRecords, total, tag, q }: Props) {
  const [records, setRecords] = useState(initialRecords);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = records.length < total;

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const next = await loadMoreRecords(tag, q, records.length);
    setRecords((prev) => [...prev, ...next]);
    setLoading(false);
  }, [loading, tag, q, records.length]);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center">
        {tag || q ? (
          <>
            <p className="text-zinc-500">
              {tag && <span className="font-medium text-zinc-700">#{tag}</span>}
              {tag && q && " · "}
              {q && <span className="font-medium text-zinc-700">&ldquo;{q}&rdquo;</span>}
              {" "}에 맞는 기록이 없어요
            </p>
            <Link href="/records" className="text-sm text-zinc-400 underline underline-offset-2">
              전체 보기
            </Link>
          </>
        ) : (
          <>
            <p className="text-zinc-500">아직 기록이 없어요</p>
            <Link href="/records/new" className="text-sm text-zinc-400 underline underline-offset-2">
              첫 기록 남기기
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {records.map((record) => (
          <RecordListItem key={record.id} record={record} />
        ))}
      </ul>
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          <span className="text-xs text-zinc-400">{loading ? "불러오는 중..." : ""}</span>
        </div>
      )}
    </>
  );
}
