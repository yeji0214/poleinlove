import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TAG_COLORS } from '@/lib/constants'

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const record = await prisma.record.findUnique({
    where: { id: Number(id) },
  })

  if (!record) notFound()

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="mx-auto w-full max-w-xl px-5 pb-4 pt-8">
        <div className="flex items-start gap-4">
          <Link href="/records" className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800">
            <ArrowLeftIcon />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">{record.skillName}</h1>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
              <CalendarIcon />
              {record.performedAt.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-12">
        {/* 태그 */}
        {record.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {record.tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-3 py-1 text-sm font-medium ${TAG_COLORS[tag] ?? 'bg-stone-100 text-zinc-600'}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 사진 */}
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-zinc-100">
          <ImagePlaceholderIcon className="text-zinc-300" />
        </div>

        {/* 세션 메모 */}
        {record.sessionNote && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold text-zinc-900">세션 메모</h2>
            <p className="text-sm leading-relaxed text-zinc-600">{record.sessionNote}</p>
          </section>
        )}

        {/* 어려웠던 점 */}
        {record.difficultyNote && (
          <section className="rounded-2xl border-l-4 border-l-amber-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-zinc-900">
              <ExclamationIcon className="text-amber-400" />
              어려웠던 점
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600">{record.difficultyNote}</p>
          </section>
        )}

        {/* 잘됐던 점 */}
        {record.didWellNote && (
          <section className="rounded-2xl border-l-4 border-l-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-zinc-900">
              <CheckCircleIcon className="text-emerald-400" />
              좋았던 점
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600">{record.didWellNote}</p>
          </section>
        )}

        {/* 아쉬웠던 점 */}
        {record.improvementNote && (
          <section className="rounded-2xl border-l-4 border-l-sky-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-zinc-900">
              <ArrowUpCircleIcon className="text-sky-400" />
              아쉬웠던 점
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600">{record.improvementNote}</p>
          </section>
        )}
      </main>
    </div>
  )
}

function ArrowLeftIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
    </svg>
  )
}

function ImagePlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-10 w-10 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ExclamationIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ArrowUpCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
