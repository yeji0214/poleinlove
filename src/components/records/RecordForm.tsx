"use client";

import { useActionState, useEffect, useReducer, useRef, useState } from "react";
import { type CreateRecordState } from "@/app/records/new/actions";
import { PRESET_TAGS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { getTodayDateString } from "@/lib/date";
import {
  uploadQueueReducer,
  validateFile,
  createItemId,
  generateStoragePath,
  type UploadItem,
} from "@/lib/uploadQueue";
import {
  CameraIcon,
  ExclamationIcon,
  CheckCircleIcon,
  ArrowUpCircleIcon,
  SpinnerIcon,
  ImagePlaceholderIcon,
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
  // 이미 업로드가 끝난 기존 이미지(수정 화면 진입 시). 재시도 대상이 아니라
  // 삭제만 가능하므로 새로 선택한 파일들의 업로드 큐와 분리해서 관리한다.
  const [existingImages, setExistingImages] = useState<string[]>(
    defaultValues?.images.map((i) => i.url) ?? [],
  );
  const [queue, dispatch] = useReducer(uploadQueueReducer, []);
  const previewUrlsRef = useRef<string[]>([]);
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

  // 파일 하나를 Supabase Storage에 업로드하고 그 결과를 큐 상태에 반영한다.
  // 여러 파일이 선택되면 이 함수가 파일마다 동시에(병렬로) 호출된다.
  async function uploadItem(item: UploadItem) {
    dispatch({ type: "START", id: item.id });

    const validationError = validateFile(item.file);
    if (validationError) {
      dispatch({ type: "FAIL", id: item.id, errorMessage: validationError });
      return;
    }

    const path = generateStoragePath(item.file);
    const { error } = await supabase.storage
      .from("record-images")
      .upload(path, item.file);

    if (error) {
      dispatch({ type: "FAIL", id: item.id, errorMessage: "업로드 실패" });
      return;
    }

    const { data } = supabase.storage.from("record-images").getPublicUrl(path);
    dispatch({ type: "SUCCESS", id: item.id, url: data.publicUrl });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const items: UploadItem[] = files.map((file) => ({
      id: createItemId(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "waiting",
    }));

    previewUrlsRef.current.push(...items.map((item) => item.previewUrl));
    dispatch({ type: "ADD", items });
    items.forEach((item) => {
      void uploadItem(item);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeExistingImage(url: string) {
    setExistingImages((prev) => prev.filter((u) => u !== url));
  }

  function removeQueueItem(id: string) {
    dispatch({ type: "REMOVE", id });
  }

  // 컴포넌트가 사라질 때 로컬 미리보기용으로 만든 blob URL을 정리한다.
  // (매 렌더마다 새로 만드는 값이 아니라 계속 누적되는 ref라, 클린업 시점의
  // 최신 목록을 그대로 참조해야 해서 반응형 의존성 규칙은 여기 적용되지 않는다.)
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const successUrls = queue
    .filter((item): item is UploadItem & { url: string } => item.status === "success")
    .map((item) => item.url);
  const allImageUrls = [...existingImages, ...successUrls];
  const isUploading = queue.some(
    (item) => item.status === "waiting" || item.status === "uploading",
  );

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
      <section className="rounded-2xl bg-surface p-5 shadow-sm">
        <h2 className="mb-5 text-base font-bold text-text">기본 정보</h2>
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="performedAt"
              className="text-sm font-medium text-text-secondary"
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
              className="text-sm font-medium text-text-secondary"
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
              className={`rounded-xl border px-3 py-2.5 text-base text-text-secondary outline-none placeholder:text-text-muted bg-surface ${
                skillNameError
                  ? "border-red-300 focus:border-red-400 dark:border-red-800 dark:focus:border-red-600"
                  : "border-border focus:border-text-muted"
              }`}
            />
            <p className="h-4 truncate text-xs text-red-500">
              {skillNameError && "기술명을 입력해주세요"}
            </p>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-text-secondary">난이도 태그</p>
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
                    ? "bg-inverted text-inverted-text"
                    : "bg-surface-muted text-text-secondary hover:brightness-95 dark:hover:brightness-125"
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
      <section className="rounded-2xl bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-text">사진</h2>

        {(existingImages.length > 0 || queue.length > 0) && (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {existingImages.map((url) => (
              <div key={url} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-full w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(url)}
                  className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/50 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {queue.map((item) => (
              <div key={item.id} className="relative aspect-square">
                {item.status === "error" ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl bg-surface-muted p-1 text-center">
                    <ImagePlaceholderIcon className="h-6 w-6 text-text-muted" />
                    <p className="text-[11px] leading-tight text-text-secondary">
                      {item.errorMessage}
                    </p>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-full w-full rounded-xl object-cover"
                  />
                )}
                {(item.status === "waiting" || item.status === "uploading") && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                    <SpinnerIcon className="text-white" />
                  </div>
                )}
                {item.status === "error" && (
                  <button
                    type="button"
                    onClick={() => removeQueueItem(item.id)}
                    aria-label="삭제"
                    className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/50 text-xs text-white"
                  >
                    ×
                  </button>
                )}
                {item.status === "success" && (
                  <button
                    type="button"
                    onClick={() => removeQueueItem(item.id)}
                    className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/50 text-xs text-white"
                  >
                    ×
                  </button>
                )}
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
        <input type="hidden" name="imageUrls" value={allImageUrls.join(",")} />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 transition-colors hover:border-text-muted"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950">
            <CameraIcon className="text-rose-400" />
          </div>
          <p className="text-sm font-medium text-text-secondary">사진 추가</p>
          <p className="text-xs text-text-muted">탭해서 업로드</p>
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
          className="w-full resize-none border-b border-border py-2 text-base text-text-secondary outline-none placeholder:text-text-muted"
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
          className="w-full resize-none border-b border-border py-2 text-base text-text-secondary outline-none placeholder:text-text-muted"
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
          className="w-full resize-none border-b border-border py-2 text-base text-text-secondary outline-none placeholder:text-text-muted"
        />
      </NoteCard>

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={pending || isUploading || !isValid}
          className="w-full cursor-pointer rounded-2xl bg-rose-300 py-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "저장 중..." : isUploading ? "업로드 중..." : submitLabel}
        </button>
        <p className="h-4 text-center text-xs text-text-muted">
          {hasEmptyRequired && "날짜와 기술명을 입력하면 저장할 수 있어요"}
        </p>
      </div>
    </form>
  );
}
