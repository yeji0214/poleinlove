import RecordForm from "@/components/records/RecordForm";
import { BackButton } from "@/components/ui/BackButton";
import { createRecord } from "./actions";

export default function NewRecordPage() {
  return (
    <div className="min-h-screen bg-page">
      <header className="mx-auto w-full max-w-xl px-5 pb-4 pt-8">
        <div className="flex items-center gap-4">
          <BackButton fallbackHref="/records" />
          <div>
            <h1 className="text-xl font-bold text-text">새 기록</h1>
            <p className="text-sm text-text-secondary">오늘의 폴댄스는 어땠나요?</p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl px-4 pb-12">
        <RecordForm action={createRecord} submitLabel="기록 저장" />
      </main>
    </div>
  );
}
