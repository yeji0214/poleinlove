import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RecordForm from "@/components/records/RecordForm";
import { BackButton } from "@/components/ui/BackButton";
import { updateRecord } from "./actions";

export default async function EditRecordPage({
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

  const boundUpdateRecord = updateRecord.bind(null, record.id);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950">
      <header className="mx-auto w-full max-w-xl px-5 pb-4 pt-8">
        <div className="flex items-center gap-4">
          <BackButton fallbackHref={`/records/${record.id}`} />
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">기록 수정</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">내용을 수정해보세요</p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl px-4 pb-12">
        {record.sessionNote && (
          <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
            <p className="mb-2 text-xs font-medium text-zinc-400 dark:text-zinc-500">인스타그램 캡션</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {record.sessionNote}
            </p>
          </div>
        )}
        <RecordForm
          action={boundUpdateRecord}
          submitLabel="수정 완료"
          recordId={record.id}
          defaultValues={{
            skillName: record.skillName,
            performedAt: record.performedAt.toISOString().slice(0, 10),
            tags: record.tags,
            difficultyNote: record.difficultyNote ?? "",
            didWellNote: record.didWellNote ?? "",
            improvementNote: record.improvementNote ?? "",
            images: record.images.map((img) => ({ url: img.url })),
          }}
        />
      </main>
    </div>
  );
}
