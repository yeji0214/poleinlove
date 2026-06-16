"use client";

import { useState, useTransition } from "react";
import { deleteRecord } from "@/app/records/[id]/actions";
import { TrashIcon } from "@/components/ui/icons";

export function DeleteRecordButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(() => {
      deleteRecord(id);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-500"
        aria-label="기록 삭제"
      >
        <TrashIcon />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 transition-colors hover:text-zinc-700"
              aria-label="닫기"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-lg font-bold text-zinc-900">
              기록을 삭제할까요?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              삭제하면 되돌릴 수 없습니다.
            </p>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-stone-100 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-stone-200"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="flex-1 rounded-xl bg-red-400 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {pending ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
