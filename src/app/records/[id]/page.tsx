import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

const TAG_COLORS: Record<string, string> = {
  입문: 'bg-green-100 text-green-600',
  초급: 'bg-yellow-100 text-yellow-600',
  중급: 'bg-amber-100 text-amber-600',
  고급: 'bg-rose-100 text-rose-600',
  후굴: 'bg-purple-100 text-purple-600',
  측굴: 'bg-blue-100 text-blue-600',
  장요: 'bg-teal-100 text-teal-600',
  어깨유연성: 'bg-indigo-100 text-indigo-600',
  힘기술: 'bg-orange-100 text-orange-600',
  고정폴: 'bg-sky-100 text-sky-600',
}

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
          <Link href="/records" className="mt-1 text-zinc-600 hover:text-zinc-900">
            ←
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
          <section className="rounded-2xl border-l-4 border-l-amber-400 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-zinc-900">
              <ExclamationIcon className="text-amber-400" />
              어려웠던 점
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600">{record.difficultyNote}</p>
          </section>
        )}

        {/* 잘됐던 점 */}
        {record.didWellNote && (
          <section className="rounded-2xl border-l-4 border-l-emerald-400 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-zinc-900">
              <CheckCircleIcon className="text-emerald-400" />
              좋았던 점
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600">{record.didWellNote}</p>
          </section>
        )}

        {/* 아쉬웠던 점 */}
        {record.improvementNote && (
          <section className="rounded-2xl border-l-4 border-l-sky-400 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-zinc-900">
              <LightbulbIcon className="text-sky-400" />
              아쉬웠던 점
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600">{record.improvementNote}</p>
          </section>
        )}
      </main>
    </div>
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

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  )
}
