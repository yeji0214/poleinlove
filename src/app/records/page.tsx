import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildRecordWhere, RECORDS_PAGE_SIZE } from "@/lib/records";
import { ChartBarIcon } from "@/components/ui/icons";
import { TagFilter } from "@/components/records/TagFilter";
import { SearchBar } from "@/components/records/SearchBar";
import { SyncButton } from "@/components/records/SyncButton";
import { RecordList } from "@/components/records/RecordList";

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>;
}) {
  const { tag, q } = await searchParams;
  const instagramToken = await prisma.instagramToken.findFirst({ select: { id: true } });

  const where = buildRecordWhere(tag, q);
  const [records, total] = await Promise.all([
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
      <header className="mx-auto w-full max-w-2xl px-5 pb-4 pt-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Poleinlove</h1>
            <p className="text-sm text-zinc-500">폴댄스 기록장</p>
          </div>
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
