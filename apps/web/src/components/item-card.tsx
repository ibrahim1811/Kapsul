import type { Item } from "@kapsul/types";
import Link from "next/link";

const TYPE_ICON: Record<Item["type"], string> = {
  pdf: "📄",
  image: "🖼️",
  document: "📝",
  text: "📃",
  url: "🔗",
  audio: "🎵",
  video: "🎬",
  note: "🗒️",
};

const STATUS_LABEL: Record<Item["processingStatus"], string> = {
  pending: "Bekliyor",
  processing: "İşleniyor",
  completed: "Tamamlandı",
  failed: "Başarısız",
};

export function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{TYPE_ICON[item.type]}</span>
        <span className="truncate text-sm font-medium">{item.title}</span>
      </div>
      {item.summary && (
        <p className="line-clamp-2 text-xs text-neutral-500">{item.summary}</p>
      )}
      <span
        className={`w-fit rounded-full px-2 py-0.5 text-[11px] ${
          item.processingStatus === "failed"
            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
            : item.processingStatus === "completed"
              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
        }`}
      >
        {STATUS_LABEL[item.processingStatus]}
      </span>
    </Link>
  );
}
