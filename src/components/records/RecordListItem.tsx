import Link from "next/link";
import { TAG_COLORS } from "@/lib/constants";
import { CalendarIcon, ImagePlaceholderIcon } from "@/components/ui/icons";

export type RecordListItemData = {
  id: number;
  performedAt: Date;
  skillName: string;
  sessionNote: string | null;
  tags: string[];
  images: { url: string; alt: string | null }[];
};

export function RecordListItem({ record }: { record: RecordListItemData }) {
  return (
    <li>
      <Link
        href={`/records/${record.id}`}
        className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      >
        {/* 이미지 썸네일 */}
        {record.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={record.images[0].url}
            alt={record.images[0].alt ?? record.skillName}
            className="h-24 w-24 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
            <ImagePlaceholderIcon className="h-6 w-6 text-zinc-300" />
          </div>
        )}

        {/* 내용 */}
        <div className="flex min-w-0 flex-col justify-center gap-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <CalendarIcon />
            {record.performedAt.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
          <p className="font-bold text-zinc-900">
            {record.skillName || "미분류"}
          </p>
          {record.sessionNote && (
            <p className="line-clamp-2 text-sm text-zinc-500">
              {record.sessionNote}
            </p>
          )}
          {record.tags.filter((t) => t !== "미분류").length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {[...new Set(record.tags.filter((t) => t !== "미분류"))].map((t) => (
                <span
                  key={t}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TAG_COLORS[t] ?? "bg-stone-100 text-zinc-600"}`}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}
