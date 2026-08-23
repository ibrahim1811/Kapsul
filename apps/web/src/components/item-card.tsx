import type { Item } from "@kapsul/types";
import Link from "next/link";

function formatRelativeDate(ts: Item["createdAt"] | undefined): string {
  if (!ts?.seconds) return "";
  const date = new Date(ts.seconds * 1000);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  const time = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays <= 0) return `Bugün, ${time}`;
  if (diffDays === 1) return `Dün, ${time}`;
  if (diffDays < 7) return `${diffDays} gün önce, ${time}`;
  return `${Math.floor(diffDays / 7)} hafta önce, ${time}`;
}

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

export function ItemCard({ item, index = 0 }: { item: Item; index?: number }) {
  return (
    <Link
      href={`/items/${item.id}`}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      className="group flex animate-fade-in-up flex-col gap-2.5 rounded-2xl border border-ink-border bg-ink-panel/60 p-4 shadow-card backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 active:scale-[0.98]"
    >
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
    </Link>
  );
}
