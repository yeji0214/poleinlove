import Link from "next/link";
import RecordForm from "@/components/records/RecordForm";

export default function NewRecordPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="mx-auto w-full max-w-xl px-5 pb-4 pt-8">
        <div className="flex items-center gap-4">
          <Link href="/records" className="text-zinc-600 hover:text-zinc-900">
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">새 기록</h1>
            <p className="text-sm text-zinc-600">오늘의 폴댄스는 어땠나요?</p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl px-4 pb-12">
        <RecordForm />
      </main>
    </div>
  );
}
