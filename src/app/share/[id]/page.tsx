import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TAG_COLORS, sortByPresetOrder } from "@/lib/constants";
import { CalendarIcon, ImagePlaceholderIcon } from "@/components/ui/icons";
import { NoteCard } from "@/components/ui/NoteCard";
import { ImageCarousel } from "@/components/records/ImageCarousel";
import {
  ExclamationIcon,
  CheckCircleIcon,
  ArrowUpCircleIcon,
} from "@/components/ui/icons";

const getSharedRecord = cache(async (id: number) => {
  return prisma.record.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } } },
  });
});

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const record = await getSharedRecord(Number(id));

  if (!record) return { title: "poleinlove" };

  const MAX_TITLE_LENGTH = 30;
  const rawTitle = record.skillName || "미분류";
  const title =
    rawTitle.length > MAX_TITLE_LENGTH
      ? `${rawTitle.slice(0, MAX_TITLE_LENGTH)}...`
      : rawTitle;
  const description = record.performedAt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const image = record.images[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: image ? [{ url: image, width: 1200, height: 1600 }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function SharedRecordPage({ params }: Props) {
  const { id } = await params;
  const record = await getSharedRecord(Number(id));

  if (!record) notFound();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="mx-auto w-full max-w-xl px-5 pb-4 pt-8">
        <h1 className="text-xl font-bold text-zinc-900">
          {record.skillName || "미분류"}
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
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-12">
        {record.tags.filter((t) => t !== "미분류").length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sortByPresetOrder([
              ...new Set(record.tags.filter((t) => t !== "미분류")),
            ]).map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-3 py-1 text-sm font-medium ${TAG_COLORS[tag] ?? "bg-stone-100 text-zinc-600"}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {record.images.length === 0 ? (
          <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-zinc-100">
            <ImagePlaceholderIcon className="h-10 w-10 text-zinc-300" />
          </div>
        ) : (
          <ImageCarousel
            images={record.images}
            altFallback={record.skillName}
          />
        )}

        {record.sessionNote && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold text-zinc-900">인스타그램 캡션</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
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

        <p className="pt-4 text-center text-xs text-zinc-400">
          poleinlove에서 공유된 기록이에요.
        </p>
      </main>
    </div>
  );
}
