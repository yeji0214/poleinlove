import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeftIcon } from "@/components/ui/icons";

const DIFFICULTY_TAGS = ["입문", "초급", "중급", "고급"] as const;
const TAG_BAR_COLORS: Record<string, string> = {
  입문: "bg-emerald-400",
  초급: "bg-sky-400",
  중급: "bg-orange-400",
  고급: "bg-violet-400",
};
const TAG_TEXT_COLORS: Record<string, string> = {
  입문: "text-emerald-700",
  초급: "text-sky-600",
  중급: "text-orange-600",
  고급: "text-violet-600",
};

export default async function StatsPage() {
  const records = await prisma.record.findMany({
    select: { performedAt: true, tags: true },
    orderBy: { performedAt: "asc" },
  });

  const total = records.length;
  const firstDate = records[0]?.performedAt ?? null;
  const monthsSince = firstDate
    ? Math.floor((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  // 난이도 분포
  const tagCounts: Record<string, number> = { 입문: 0, 초급: 0, 중급: 0, 고급: 0 };
  for (const r of records) {
    for (const t of r.tags) {
      if (t in tagCounts) tagCounts[t]++;
    }
  }
  const taggedTotal = Object.values(tagCounts).reduce((a, b) => a + b, 0);

  // 월별 기록 수 (최근 12개월)
  const now = new Date();
  const months: { label: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getMonth() + 1}월`;
    const count = records.filter((r) => {
      const rd = new Date(r.performedAt);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    }).length;
    months.push({ label, count });
  }
  const maxMonthCount = Math.max(...months.map((m) => m.count), 1);
  const BAR_MAX_H = 80;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="mx-auto w-full max-w-xl px-5 pb-4 pt-8">
        <div className="flex items-center gap-3">
          <Link
            href="/records"
            className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
          >
            <ArrowLeftIcon />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">통계</h1>
            <p className="text-sm text-zinc-500">나의 폴댄스 기록 분석</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-12">
        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-zinc-900">{total}</p>
            <p className="mt-0.5 text-xs text-zinc-500">총 기록</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-zinc-900">{monthsSince}</p>
            <p className="mt-0.5 text-xs text-zinc-500">함께한 개월</p>
          </div>
        </div>

        {/* 난이도 분포 */}
        {taggedTotal > 0 && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-zinc-900">난이도 분포</h2>
            <div className="flex flex-col gap-3">
              {DIFFICULTY_TAGS.map((tag) => {
                const count = tagCounts[tag];
                const pct = Math.round((count / taggedTotal) * 100);
                return (
                  <div key={tag} className="flex items-center gap-3">
                    <span className={`w-8 shrink-0 text-sm font-medium ${TAG_TEXT_COLORS[tag]}`}>{tag}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-zinc-100 h-2.5">
                      <div
                        className={`h-full rounded-full ${TAG_BAR_COLORS[tag]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-16 shrink-0 text-right">
                      <p className="text-sm text-zinc-500">{count}회</p>
                      <p className="text-xs text-zinc-400">({pct}%)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 월별 활동량 */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-zinc-900">월별 활동량</h2>
          <div className="flex items-end gap-1.5" style={{ height: `${BAR_MAX_H + 36}px` }}>
            {months.map((m, i) => {
              const barH = m.count > 0
                ? Math.max(Math.round((m.count / maxMonthCount) * BAR_MAX_H), 6)
                : 0;
              return (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <span className="h-4 text-[10px] leading-4 text-zinc-400">
                    {m.count > 0 ? m.count : ""}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-rose-300"
                    style={{ height: `${barH}px` }}
                  />
                  <span className="mt-1 text-[10px] text-zinc-400">{m.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
