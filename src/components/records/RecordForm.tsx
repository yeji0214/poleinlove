"use client";

import { useActionState, useState } from "react";
import {
  createRecord,
  type CreateRecordState,
} from "@/app/records/new/actions";
import { PRESET_TAGS } from "@/lib/constants";
import {
  CameraIcon,
  ExclamationIcon,
  CheckCircleIcon,
  ArrowUpCircleIcon,
} from "@/components/ui/icons";

const initialState: CreateRecordState = null;

export default function RecordForm() {
  const [state, formAction, pending] = useActionState(
    createRecord,
    initialState,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <p className="text-sm text-red-500" aria-live="polite">
          {state.error}
        </p>
      )}

      {/* 기본 정보 */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-base font-bold text-zinc-900">기본 정보</h2>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="performedAt"
              className="text-sm font-medium text-zinc-700"
            >
              날짜
            </label>
            <input
              id="performedAt"
              name="performedAt"
              type="date"
              required
              className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="skillName"
              className="text-sm font-medium text-zinc-700"
            >
              기술명
            </label>
            <input
              id="skillName"
              name="skillName"
              type="text"
              required
              placeholder="예) 발레리나, 버터플라이"
              className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            />
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700">태그</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-zinc-800 text-white"
                    : "bg-stone-100 text-zinc-700 hover:bg-stone-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <input type="hidden" name="tags" value={selectedTags.join(",")} />
        </div>
      </section>

      {/* 사진 */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-zinc-900">사진</h2>
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
            <CameraIcon className="text-rose-400" />
          </div>
          <p className="text-sm font-medium text-zinc-700">사진 추가</p>
          <p className="text-xs text-zinc-400">드래그하거나 탭해서 업로드</p>
        </div>
      </section>

      {/* 어려웠던 점 */}
      <section className="rounded-2xl border-l-4 border-l-amber-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-zinc-900">
          <ExclamationIcon className="text-amber-400" />
          어려웠던 점
        </h2>
        <textarea
          name="difficultyNote"
          rows={3}
          placeholder="어떤 게 힘들었나요?"
          className="w-full resize-none border-b border-zinc-200 py-2 text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
        />
      </section>

      {/* 잘 됐던 점 */}
      <section className="rounded-2xl border-l-4 border-l-emerald-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-zinc-900">
          <CheckCircleIcon className="text-emerald-400" />
          좋았던 점
        </h2>
        <textarea
          name="didWellNote"
          rows={3}
          placeholder="무엇을 잘 했나요?"
          className="w-full resize-none border-b border-zinc-200 py-2 text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
        />
      </section>

      {/* 다음에 개선할 점 */}
      <section className="rounded-2xl border-l-4 border-l-sky-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-zinc-900">
          <ArrowUpCircleIcon className="text-sky-400" />
          아쉬웠던 점
        </h2>
        <textarea
          name="improvementNote"
          rows={3}
          placeholder="다음에 신경써볼 것은?"
          className="w-full resize-none border-b border-zinc-200 py-2 text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
        />
      </section>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-rose-300 py-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "저장 중..." : "기록 저장"}
      </button>
    </form>
  );
}

