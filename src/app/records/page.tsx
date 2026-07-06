import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TAG_COLORS } from "@/lib/constants";
import {
  CalendarIcon,
  ImagePlaceholderIcon,
  ChartBarIcon,
} from "@/components/ui/icons";
import { TagFilter } from "@/components/records/TagFilter";
import { SearchBar } from "@/components/records/SearchBar";
import { SyncButton } from "@/components/records/SyncButton";

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>;
}) {
  const { tag, q } = await searchParams;
  const instagramToken = await prisma.instagramToken.findFirst({ select: { id: true } });

  const records = await prisma.record.findMany({
    where: {
      AND: [
        tag ? { tags: { has: tag } } : {},
        q
          ? {
              OR: [
                { skillName: { contains: q, mode: "insensitive" } },
                { sessionNote: { contains: q, mode: "insensitive" } },
                { difficultyNote: { contains: q, mode: "insensitive" } },
                { didWellNote: { contains: q, mode: "insensitive" } },
                { improvementNote: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: { performedAt: "desc" },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
  });

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
        {records.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-24 text-center">
            {tag || q ? (
              <>
                <p className="text-zinc-500">
                  {tag && <span className="font-medium text-zinc-700">#{tag}</span>}
                  {tag && q && " · "}
                  {q && <span className="font-medium text-zinc-700">&ldquo;{q}&rdquo;</span>}
                  {" "}에 맞는 기록이 없어요
                </p>
                <Link
                  href="/records"
                  className="text-sm text-zinc-400 underline underline-offset-2"
                >
                  전체 보기
                </Link>
              </>
            ) : (
              <>
                <p className="text-zinc-500">아직 기록이 없어요</p>
                <Link
                  href="/records/new"
                  className="text-sm text-zinc-400 underline underline-offset-2"
                >
                  첫 기록 남기기
                </Link>
              </>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {records.map((record) => (
              <li key={record.id}>
                <Link
                  href={`/records/${record.id}`}
                  className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* 이미지 썸네일 */}
                  {record.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={record.images[0].url}
                      alt={record.images[0].alt ?? record.skillName}
                      className="h-24 w-24 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                      <ImagePlaceholderIcon className="h-6 w-6 text-zinc-300" />
                    </div>
                  )}

                  {/* 내용 */}
                  <div className="flex min-w-0 flex-col justify-center gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <CalendarIcon />
                      {record.performedAt.toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <p className="font-bold text-zinc-900">
                      {record.skillName || '미분류'}
                    </p>
                    {record.sessionNote && (
                      <p className="line-clamp-2 text-sm text-zinc-500">
                        {record.sessionNote}
                      </p>
                    )}
                    {record.tags.filter((t) => t !== '미분류').length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {[...new Set(record.tags.filter((t) => t !== '미분류'))].map((t) => (
                          <span
                            key={t}
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TAG_COLORS[t] ?? "bg-stone-100 text-zinc-600"}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
