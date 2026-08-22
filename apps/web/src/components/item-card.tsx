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
  completed: "Hazır",
  failed: "Başarısız",
};

const STATUS_CLASS: Record<Item["processingStatus"], string> = {
  pending: "bg-white/5 text-bone-muted",
  processing: "bg-accent/10 text-accent animate-pulse",
  completed: "bg-accent/15 text-accent",
  failed: "bg-red-500/10 text-red-400",
};

export function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-ink-border bg-ink-panel/60 p-4 shadow-card backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-accent/40"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-base">
          {TYPE_ICON[item.type]}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_CLASS[item.processingStatus]}`}
        >
          {STATUS_LABEL[item.processingStatus]}
        </span>
      </div>
      <div>
        <p className="truncate text-sm font-medium text-bone">{item.title}</p>
        {item.summary && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-bone-muted">{item.summary}</p>
        )}
      </div>
    </Link>
  );
}
