"use client";

import { useTransition } from "react";
import { deleteRecord } from "@/app/records/[id]/actions";
import { TrashIcon } from "@/components/ui/icons";

export function DeleteRecordButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("이 기록을 삭제하시겠습니까? 삭제하면 되돌릴 수 없습니다.")) return;
    startTransition(() => {
      deleteRecord(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
      aria-label="기록 삭제"
    >
      <TrashIcon />
    </button>
  );
}
