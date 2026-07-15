import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildRecordWhere, RECORDS_PAGE_SIZE } from "@/lib/records";
import { ChartBarIcon } from "@/components/ui/icons";
import { TagFilter } from "@/components/records/TagFilter";
import { SearchBar } from "@/components/records/SearchBar";
import { SyncButton } from "@/components/records/SyncButton";
import { RecordList } from "@/components/records/RecordList";
import { Logo } from "@/components/ui/Logo";

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>;
}) {
  const { tag, q } = await searchParams;
  const where = buildRecordWhere(tag, q);
  const [instagramToken, records, total] = await Promise.all([
    prisma.instagramToken.findFirst({ select: { id: true } }),
    prisma.record.findMany({
      where,
      orderBy: { performedAt: "desc" },
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
      take: RECORDS_PAGE_SIZE,
    }),
    prisma.record.count({ where }),
  ]);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-20 border-b border-zinc-100 bg-stone-50">
        <div className="mx-auto w-full max-w-2xl px-5 pb-4 pt-8">
          <div className="flex items-start justify-between">
            <Logo />
            <div className="flex items-center gap-2">
              <Link
                href="/stats"
                className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                aria-label="통계"
              >
                <ChartBarIcon />
              </Link>
              <SyncButton hasToken={!!instagramToken} />
              <Link
                href="/records/new"
                className="rounded-2xl bg-rose-300 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                + &nbsp;새 기록
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-12">
        {/* 검색 */}
        <SearchBar defaultValue={q} tag={tag} />

        {/* 태그 필터 */}
        <TagFilter activeTag={tag} query={q} />

        {/* 기록 목록 */}
        <RecordList key={`${tag ?? ""}:${q ?? ""}`} initialRecords={records} total={total} tag={tag} q={q} />
      </main>
    </div>
  );
}
