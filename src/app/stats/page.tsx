import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/ui/BackButton";

const DIFFICULTY_TAGS = ["입문", "초급", "중급", "고급"] as const;
const TAG_LABELS: Record<string, string> = {
  입문: "INTRO",
  초급: "BEGINNER",
  중급: "INTERMEDIATE",
  고급: "ADVANCED",
};
// 낮은 난이도일수록 옅은 색, 높을수록 진한 색
const TAG_BAR_COLORS: Record<string, string> = {
  입문: "bg-rose-100",
  초급: "bg-rose-200",
  중급: "bg-rose-400",
  고급: "bg-rose-700",
};

export default async function StatsPage() {
  const now = new Date();
  const records = await prisma.record.findMany({
    select: { performedAt: true, tags: true },
    orderBy: { performedAt: "asc" },
  });

  const total = records.length;
  const firstDate = records[0]?.performedAt ?? null;

  // 난이도 분포
  const tagCounts: Record<string, number> = {
    입문: 0,
    초급: 0,
    중급: 0,
    고급: 0,
  };
  for (const r of records) {
    for (const t of r.tags) {
      if (t in tagCounts) tagCounts[t]++;
    }
  }
  const taggedTotal = Object.values(tagCounts).reduce((a, b) => a + b, 0);

  // 월별 기록 수 (최근 12개월)
  const months: { label: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${d.getMonth() + 1}월`;
    const count = records.filter((r) => {
      const rd = new Date(r.performedAt);
      return (
        rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth()
      );
    }).length;
    months.push({ label, count });
  }
  const maxMonthCount = Math.max(...months.map((m) => m.count), 1);
  const BAR_MAX_H = 90;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="mx-auto w-full max-w-xl px-5 pb-4 pt-8">
        <BackButton fallbackHref="/records" />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col px-5 pb-16">
        {/* 히어로: 총 기록 */}
        <section className="border-b border-zinc-100 py-8 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-rose-300">
            TOTAL RECORDS
          </p>
          <p className="mt-2 text-7xl font-black tabular-nums leading-none text-rose-400">
            {total}
          </p>
        </section>

        {/* 난이도 분포 */}
        {taggedTotal > 0 && (
          <section className="border-b border-zinc-100 py-8">
            <h2 className="mb-5 font-bold text-zinc-900">난이도 분포</h2>

            <div className="flex h-4 w-full overflow-hidden rounded-full bg-rose-50">
              {DIFFICULTY_TAGS.map((tag) => {
                const pct = (tagCounts[tag] / taggedTotal) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={tag}
                    className={TAG_BAR_COLORS[tag]}
                    style={{ width: `${pct}%` }}
                  />
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-y-2">
              {DIFFICULTY_TAGS.map((tag) => {
                const count = tagCounts[tag];
                const pct =
                  taggedTotal > 0 ? Math.round((count / taggedTotal) * 100) : 0;
                return (
                  <div key={tag} className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={
                          tag === "입문"
                            ? "h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-rose-300"
                            : `h-2.5 w-2.5 shrink-0 rounded-full ${TAG_BAR_COLORS[tag]}`
                        }
                      />
                      <span className="truncate text-[11px] tracking-wide text-zinc-400">
                        {TAG_LABELS[tag]}
                      </span>
                    </div>
                    <p className="mt-1 text-xl font-bold text-zinc-600">
                      {count}회
                    </p>
                    <p className="text-xs text-rose-400">
                      {tag} · {pct}%
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 월별 활동량 */}
        <section className="py-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bold text-zinc-900">월별 활동량</h2>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-400">
              최근 12개월
            </span>
          </div>

          <div
            className="flex items-end gap-1.5"
            style={{ height: `${BAR_MAX_H + 36}px` }}
          >
            {months.map((m, i) => {
              const barH =
                m.count > 0
                  ? Math.max(
                      Math.round((m.count / maxMonthCount) * BAR_MAX_H),
                      6,
                    )
                  : 0;
              return (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <span className="h-4 text-[10px] leading-4 text-zinc-400">
                    {m.count > 0 ? m.count : ""}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-rose-200"
                    style={{ height: `${barH}px` }}
                  />
                  <span className="mt-1 text-[10px] text-zinc-400">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
