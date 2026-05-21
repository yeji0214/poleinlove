import Link from "next/link";
import { prisma } from "@/lib/prisma";

const TAG_COLORS: Record<string, string> = {
  입문: "bg-green-100 text-green-600",
  초급: "bg-yellow-100 text-yellow-600",
  중급: "bg-amber-100 text-amber-600",
  고급: "bg-rose-100 text-rose-600",
  후굴: "bg-purple-100 text-purple-600",
  측굴: "bg-blue-100 text-blue-600",
  장요: "bg-teal-100 text-teal-600",
  어깨유연성: "bg-indigo-100 text-indigo-600",
  힘기술: "bg-orange-100 text-orange-600",
  고정폴: "bg-sky-100 text-sky-600",
};

const FILTER_TAGS = [
  "입문",
  "초급",
  "중급",
  "고급",
  "후굴",
  "측굴",
  "장요",
  "어깨유연성",
  "힘기술",
  "고정폴",
];

export default async function RecordsPage() {
  const records = await prisma.record.findMany({
    orderBy: { performedAt: "desc" },
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
          {FILTER_TAGS.map((tag) => (
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
                  {/* 이미지 썸네일 자리 */}
                  <div className="h-24 w-24 shrink-0 rounded-xl bg-zinc-100 flex items-center justify-center">
                    <ImagePlaceholderIcon className="text-zinc-300" />
                  </div>

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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="h-3 w-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
      />
    </svg>
  );
}

function ImagePlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`h-6 w-6 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
