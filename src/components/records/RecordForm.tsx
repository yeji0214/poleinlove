"use client";

import { useActionState, useRef, useState } from "react";
import { type CreateRecordState } from "@/app/records/new/actions";
import { PRESET_TAGS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import {
  CameraIcon,
  ExclamationIcon,
  CheckCircleIcon,
  ArrowUpCircleIcon,
} from "@/components/ui/icons";
import { NoteCard } from "@/components/ui/NoteCard";

type RecordFormProps = {
  action: (
    prevState: CreateRecordState,
    formData: FormData,
  ) => Promise<CreateRecordState>;
  submitLabel: string;
  defaultValues?: {
    skillName: string;
    performedAt: string;
    tags: string[];
    difficultyNote: string;
    didWellNote: string;
    improvementNote: string;
    images: { url: string }[];
  };
};

export default function RecordForm({
  action,
  submitLabel,
  defaultValues,
}: RecordFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    defaultValues?.tags ?? [],
  );
  const [imageUrls, setImageUrls] = useState<string[]>(
    defaultValues?.images.map((i) => i.url) ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    for (const file of files) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("record-images")
        .upload(path, file);
      if (!error) {
        const { data } = supabase.storage
          .from("record-images")
          .getPublicUrl(path);
        setImageUrls((prev) => [...prev, data.publicUrl]);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(url: string) {
    setImageUrls((prev) => prev.filter((u) => u !== url));
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
              defaultValue={defaultValues?.performedAt}
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
              defaultValue={defaultValues?.skillName}
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
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors ${
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

        {imageUrls.length > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {imageUrls.map((url) => (
              <div key={url} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-full w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/50 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <input type="hidden" name="imageUrls" value={imageUrls.join(",")} />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 py-10 transition-colors hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
            <CameraIcon className="text-rose-400" />
          </div>
          <p className="text-sm font-medium text-zinc-700">
            {uploading ? "업로드 중..." : "사진 추가"}
          </p>
          {!uploading && (
            <p className="text-xs text-zinc-400">탭해서 업로드</p>
          )}
        </button>
      </section>

      <NoteCard
        borderColor="border-l-amber-200"
        icon={<ExclamationIcon className="text-amber-400" />}
        title="어려웠던 점"
      >
        <textarea
          name="difficultyNote"
          rows={3}
          defaultValue={defaultValues?.difficultyNote}
          placeholder="어떤 게 힘들었나요?"
          className="w-full resize-none border-b border-zinc-200 py-2 text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
        />
      </NoteCard>

      <NoteCard
        borderColor="border-l-emerald-200"
        icon={<CheckCircleIcon className="text-emerald-400" />}
        title="좋았던 점"
      >
        <textarea
          name="didWellNote"
          rows={3}
          defaultValue={defaultValues?.didWellNote}
          placeholder="무엇을 잘 했나요?"
          className="w-full resize-none border-b border-zinc-200 py-2 text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
        />
      </NoteCard>

      <NoteCard
        borderColor="border-l-sky-200"
        icon={<ArrowUpCircleIcon className="text-sky-400" />}
        title="아쉬웠던 점"
      >
        <textarea
          name="improvementNote"
          rows={3}
          defaultValue={defaultValues?.improvementNote}
          placeholder="다음에 신경써볼 것은?"
          className="w-full resize-none border-b border-zinc-200 py-2 text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
        />
      </NoteCard>

      <button
        type="submit"
        disabled={pending || uploading}
        className="w-full cursor-pointer rounded-2xl bg-rose-300 py-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "저장 중..." : submitLabel}
      </button>
    </form>
  );
}
