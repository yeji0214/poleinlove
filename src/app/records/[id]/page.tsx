import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TAG_COLORS, sortByPresetOrder } from "@/lib/constants";
import {
  CalendarIcon,
  ImagePlaceholderIcon,
  ExclamationIcon,
  CheckCircleIcon,
  ArrowUpCircleIcon,
  PencilIcon,
} from "@/components/ui/icons";
import { BackButton } from "@/components/ui/BackButton";
import { NoteCard } from "@/components/ui/NoteCard";
import { ImageCarousel } from "@/components/records/ImageCarousel";
import { DeleteRecordButton } from "@/components/records/DeleteRecordButton";
import { ShareRecordButton } from "@/components/records/ShareRecordButton";
import { AISummary } from "@/components/records/AISummary";

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await prisma.record.findUnique({
    where: { id: Number(id) },
    include: { images: { orderBy: { order: "asc" } } },
  });

  if (!record) notFound();

  return (
    <div className="min-h-screen bg-page">
      <header className="mx-auto w-full max-w-xl px-5 pb-4 pt-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <BackButton fallbackHref="/records" />
            <div>
              <h1 className="text-xl font-bold text-text">
                {record.skillName || '미분류'}
              </h1>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                <CalendarIcon />
                {record.performedAt.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ShareRecordButton id={record.id} skillName={record.skillName} />
            <Link
              href={`/records/${record.id}/edit`}
              className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
              aria-label="기록 수정"
            >
              <PencilIcon />
            </Link>
            <DeleteRecordButton id={record.id} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-12">
        {/* 태그 */}
        {record.tags.filter((t) => t !== '미분류').length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sortByPresetOrder([...new Set(record.tags.filter((t) => t !== '미분류'))]).map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-3 py-1 text-sm font-medium ${TAG_COLORS[tag] ?? "bg-surface-muted text-text-secondary"}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 사진 */}
        {record.images.length === 0 ? (
          <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-surface-muted">
            <ImagePlaceholderIcon className="h-10 w-10 text-text-muted" />
          </div>
        ) : (
          <ImageCarousel images={record.images} altFallback={record.skillName} />
        )}

        {/* 인스타그램 캡션 + 링크 */}
        {(record.sessionNote || record.instagramUrl) && (
          <section className="rounded-2xl bg-surface p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-text">인스타그램 캡션</h2>
              {record.instagramUrl && (
                <a
                  href={record.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-xl bg-surface-muted px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:brightness-95 dark:hover:brightness-125"
                >
                  릴스 보러가기 →
                </a>
              )}
            </div>
            {record.sessionNote && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                {record.sessionNote}
              </p>
            )}
            {record.sessionNote && (
              <div className="mt-3">
                <AISummary recordId={record.id} />
              </div>
            )}
          </section>
        )}

        {record.difficultyNote && (
          <NoteCard
            borderColor="border-l-amber-200 dark:border-l-amber-700"
            icon={<ExclamationIcon className="text-amber-400" />}
            title="어려웠던 점"
          >
            <p className="text-sm leading-relaxed text-text-secondary">
              {record.difficultyNote}
            </p>
          </NoteCard>
        )}

        {record.didWellNote && (
          <NoteCard
            borderColor="border-l-emerald-200 dark:border-l-emerald-700"
            icon={<CheckCircleIcon className="text-emerald-400" />}
            title="좋았던 점"
          >
            <p className="text-sm leading-relaxed text-text-secondary">
              {record.didWellNote}
            </p>
          </NoteCard>
        )}

        {record.improvementNote && (
          <NoteCard
            borderColor="border-l-sky-200 dark:border-l-sky-700"
            icon={<ArrowUpCircleIcon className="text-sky-400" />}
            title="아쉬웠던 점"
          >
            <p className="text-sm leading-relaxed text-text-secondary">
              {record.improvementNote}
            </p>
          </NoteCard>
        )}
      </main>
    </div>
  );
}
