export const TAG_COLORS: Record<string, string> = {
  입문: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300/90",
  초급: "bg-sky-100 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300/90",
  중급: "bg-orange-100 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300/90",
  고급: "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300/90",
};

export const PRESET_TAGS = Object.keys(TAG_COLORS);

export function sortByPresetOrder(tags: string[]): string[] {
  return [...tags].sort((a, b) => PRESET_TAGS.indexOf(a) - PRESET_TAGS.indexOf(b));
}
