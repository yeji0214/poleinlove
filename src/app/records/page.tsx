import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TAG_COLORS, PRESET_TAGS } from "@/lib/constants";
import { SearchIcon, CalendarIcon, ImagePlaceholderIcon } from "@/components/ui/icons";

export default async function RecordsPage() {
  const records = await prisma.record.findMany({
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
          <Link
            href="/records/new"
            className="rounded-2xl bg-rose-300 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            + &nbsp;새 기록
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-12">
        {/* 검색 */}
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
          <SearchIcon className="shrink-0 text-zinc-400" />
          <input
            type="text"
            placeholder="기술명, 메모 검색..."
            className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
            disabled
          />
        </div>

        {/* 태그 필터 */}
        <div className="mb-5 flex flex-wrap gap-2">
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled
              className="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm text-zinc-600"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* 기록 목록 */}
        {records.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-24 text-center">
            <p className="text-zinc-500">아직 기록이 없어요</p>
            <Link
              href="/records/new"
              className="text-sm text-zinc-400 underline underline-offset-2"
            >
              첫 기록 남기기
            </Link>
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
                      {record.skillName}
                    </p>
                    {record.sessionNote && (
                      <p className="line-clamp-2 text-sm text-zinc-500">
                        {record.sessionNote}
                      </p>
                    )}
                    {record.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {record.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TAG_COLORS[tag] ?? "bg-stone-100 text-zinc-600"}`}
                          >
                            {tag}
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
