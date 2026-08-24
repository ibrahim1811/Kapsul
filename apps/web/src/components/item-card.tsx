import { formatRelativeDate } from "@/lib/format";
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

export function ItemCard({
  item,
  index = 0,
  selectable = false,
  selected = false,
  onToggleSelect,
}: {
  item: Item;
  index?: number;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (itemId: string) => void;
}) {
  const className =
    "group relative flex animate-fade-in-up flex-col gap-2.5 rounded-2xl border p-4 shadow-card backdrop-blur-sm transition-all active:scale-[0.98] " +
    (selected
      ? "border-accent/60 bg-accent/10"
      : "border-ink-border bg-ink-panel/60 hover:-translate-y-0.5 hover:border-accent/40");
  const style = { animationDelay: `${Math.min(index, 12) * 30}ms` };

  const checkbox = selectable && (
    <span
      aria-hidden="true"
      className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
        selected ? "border-accent bg-accent text-ink" : "border-ink-border bg-black/30 text-transparent"
      }`}
    >
      ✓
    </span>
  );

  if (selectable) {
    return (
      <button type="button" onClick={() => onToggleSelect?.(item.id)} style={style} className={className}>
        {checkbox}
        <ItemCardBody item={item} />
      </button>
    );
  }

  return (
    <Link href={`/items/${item.id}`} style={style} className={className}>
      <ItemCardBody item={item} />
    </Link>
  );
}

function ItemCardBody({ item }: { item: Item }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-base">
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
      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-bone-muted/70">
        <span>{formatRelativeDate(item.createdAt)}</span>
        {item.tags[0] && (
          <>
            <span aria-hidden="true">•</span>
            <span className="truncate text-accent/80">#{item.tags[0]}</span>
          </>
        )}
      </div>
    </>
  );
}
