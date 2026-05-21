import Link from "next/link";
import RecordForm from "@/components/records/RecordForm";

function ArrowLeftIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  )
}

export default function NewRecordPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="mx-auto w-full max-w-xl px-5 pb-4 pt-8">
        <div className="flex items-center gap-4">
          <Link href="/records" className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800">
            <ArrowLeftIcon />
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
