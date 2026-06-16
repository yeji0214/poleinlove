import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TAG_COLORS } from "@/lib/constants";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ImagePlaceholderIcon,
  ExclamationIcon,
  CheckCircleIcon,
  ArrowUpCircleIcon,
  PencilIcon,
} from "@/components/ui/icons";
import { NoteCard } from "@/components/ui/NoteCard";
import { ImageCarousel } from "@/components/records/ImageCarousel";
import { DeleteRecordButton } from "@/components/records/DeleteRecordButton";

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
    <div className="min-h-screen bg-stone-50">
      <header className="mx-auto w-full max-w-xl px-5 pb-4 pt-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              href="/records"
              className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
            >
              <ArrowLeftIcon />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                {record.skillName}
              </h1>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
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
            <Link
              href={`/records/${record.id}/edit`}
              className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
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
        {record.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {record.tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-3 py-1 text-sm font-medium ${TAG_COLORS[tag] ?? "bg-stone-100 text-zinc-600"}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 사진 */}
        {record.images.length === 0 ? (
          <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-zinc-100">
            <ImagePlaceholderIcon className="h-10 w-10 text-zinc-300" />
          </div>
        ) : (
          <ImageCarousel images={record.images} altFallback={record.skillName} />
        )}

        {/* 세션 메모 */}
        {record.sessionNote && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold text-zinc-900">세션 메모</h2>
            <p className="text-sm leading-relaxed text-zinc-600">
              {record.sessionNote}
            </p>
          </section>
        )}

        {record.difficultyNote && (
          <NoteCard
            borderColor="border-l-amber-200"
            icon={<ExclamationIcon className="text-amber-400" />}
            title="어려웠던 점"
          >
            <p className="text-sm leading-relaxed text-zinc-600">
              {record.difficultyNote}
            </p>
          </NoteCard>
        )}

        {record.didWellNote && (
          <NoteCard
            borderColor="border-l-emerald-200"
            icon={<CheckCircleIcon className="text-emerald-400" />}
            title="좋았던 점"
          >
            <p className="text-sm leading-relaxed text-zinc-600">
              {record.didWellNote}
            </p>
          </NoteCard>
        )}

        {record.improvementNote && (
          <NoteCard
            borderColor="border-l-sky-200"
            icon={<ArrowUpCircleIcon className="text-sky-400" />}
            title="아쉬웠던 점"
          >
            <p className="text-sm leading-relaxed text-zinc-600">
              {record.improvementNote}
            </p>
          </NoteCard>
        )}
      </main>
    </div>
  );
}
