"use client";

import { useActionState, useRef, useState } from "react";
import { type CreateRecordState } from "@/app/records/new/actions";
import { PRESET_TAGS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { getTodayDateString } from "@/lib/date";
import {
  CameraIcon,
  ExclamationIcon,
  CheckCircleIcon,
  ArrowUpCircleIcon,
} from "@/components/ui/icons";
import { NoteCard } from "@/components/ui/NoteCard";
import { DatePicker } from "@/components/ui/DatePicker";

type RecordFormProps = {
  action: (
    prevState: CreateRecordState,
    formData: FormData,
  ) => Promise<CreateRecordState>;
  submitLabel: string;
  recordId?: number;
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
  recordId,
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
  const [skillName, setSkillName] = useState(defaultValues?.skillName ?? "");
  const [performedAt, setPerformedAt] = useState(
    defaultValues?.performedAt ?? "",
  );
  const [skillNameTouched, setSkillNameTouched] = useState(false);
  const [performedAtTouched, setPerformedAtTouched] = useState(false);
  const [tagSuggesting, setTagSuggesting] = useState(false);

  function handleSkillNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (skillName !== "" && value === "") setSkillNameTouched(true);
    setSkillName(value);
  }

  const performedAtError = performedAtTouched && performedAt === "";
  const skillNameError = skillNameTouched && skillName.trim() === "";
  const hasEmptyRequired = skillName.trim() === "" || performedAt === "";
  const isValid = !hasEmptyRequired;

  async function suggestTags() {
    if (!recordId) return
    setTagSuggesting(true)
    try {
      const res = await fetch(`/api/records/${recordId}/suggest-tags`, { method: 'POST' })
      const data = await res.json()
      if (data.tags?.length) setSelectedTags(data.tags)
    } finally {
      setTagSuggesting(false)
    }
  }

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
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-950 dark:text-red-400"
        >
          <ExclamationIcon className="shrink-0 text-red-400" />
          {state.error}
        </div>
      )}

      {/* 기본 정보 */}
      <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-5 text-base font-bold text-zinc-900 dark:text-zinc-100">기본 정보</h2>
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="performedAt"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              날짜 <span className="text-rose-400">*</span>
            </label>
            <DatePicker
              id="performedAt"
              value={performedAt}
              onChange={setPerformedAt}
              onBlur={() => setPerformedAtTouched(true)}
              max={getTodayDateString()}
              invalid={performedAtError}
            />
            <input type="hidden" name="performedAt" value={performedAt} />
            <p className="h-4 truncate text-xs text-red-500">
              {performedAtError && "날짜를 선택해주세요"}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="skillName"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              기술명 <span className="text-rose-400">*</span>
            </label>
            <input
              id="skillName"
              name="skillName"
              type="text"
              required
              value={skillName}
              onChange={handleSkillNameChange}
              onBlur={() => setSkillNameTouched(true)}
              aria-invalid={skillNameError}
              placeholder="예) 발레리나"
              className={`rounded-xl border px-3 py-2.5 text-base text-zinc-700 outline-none placeholder:text-zinc-400 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 ${
                skillNameError
                  ? "border-red-300 focus:border-red-400 dark:border-red-800 dark:focus:border-red-600"
                  : "border-zinc-200 focus:border-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-500"
              }`}
            />
            <p className="h-4 truncate text-xs text-red-500">
              {skillNameError && "기술명을 입력해주세요"}
            </p>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">난이도 태그</p>
            {recordId && (
              <button
                type="button"
                onClick={suggestTags}
                disabled={tagSuggesting}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-600 disabled:opacity-50 dark:text-violet-400 dark:hover:text-violet-300"
              >
                {tagSuggesting ? '추천 중…' : '✦ AI 추천'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-stone-100 text-zinc-700 hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
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
      <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-bold text-zinc-900 dark:text-zinc-100">사진</h2>

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
          className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 py-10 transition-colors hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:border-zinc-500"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950">
            <CameraIcon className="text-rose-400" />
          </div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {uploading ? "업로드 중..." : "사진 추가"}
          </p>
          {!uploading && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">탭해서 업로드</p>
          )}
        </button>
      </section>

      <NoteCard
        borderColor="border-l-amber-200 dark:border-l-amber-700"
        icon={<ExclamationIcon className="text-amber-400" />}
        title="어려웠던 점"
      >
        <textarea
          name="difficultyNote"
          rows={3}
          defaultValue={defaultValues?.difficultyNote}
          placeholder="어떤 게 힘들었나요?"
          className="w-full resize-none border-b border-zinc-200 py-2 text-base text-zinc-700 outline-none placeholder:text-zinc-400 dark:border-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-500"
        />
      </NoteCard>

      <NoteCard
        borderColor="border-l-emerald-200 dark:border-l-emerald-700"
        icon={<CheckCircleIcon className="text-emerald-400" />}
        title="좋았던 점"
      >
        <textarea
          name="didWellNote"
          rows={3}
          defaultValue={defaultValues?.didWellNote}
          placeholder="무엇을 잘 했나요?"
          className="w-full resize-none border-b border-zinc-200 py-2 text-base text-zinc-700 outline-none placeholder:text-zinc-400 dark:border-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-500"
        />
      </NoteCard>

      <NoteCard
        borderColor="border-l-sky-200 dark:border-l-sky-700"
        icon={<ArrowUpCircleIcon className="text-sky-400" />}
        title="아쉬웠던 점"
      >
        <textarea
          name="improvementNote"
          rows={3}
          defaultValue={defaultValues?.improvementNote}
          placeholder="다음에 신경써볼 것은?"
          className="w-full resize-none border-b border-zinc-200 py-2 text-base text-zinc-700 outline-none placeholder:text-zinc-400 dark:border-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-500"
        />
      </NoteCard>

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={pending || uploading || !isValid}
          className="w-full cursor-pointer rounded-2xl bg-rose-300 py-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "저장 중..." : submitLabel}
        </button>
        <p className="h-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
          {hasEmptyRequired && "날짜와 기술명을 입력하면 저장할 수 있어요"}
        </p>
      </div>
    </form>
  );
}
