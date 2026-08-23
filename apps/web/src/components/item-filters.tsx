import type { Item } from "@kapsul/types";

const TYPE_LABEL: Record<Item["type"], string> = {
  pdf: "PDF",
  image: "Görsel",
  document: "Belge",
  text: "Metin",
  url: "Bağlantı",
  audio: "Ses",
  video: "Video",
  note: "Not",
};

const STATUS_LABEL: Record<Item["processingStatus"], string> = {
  pending: "Bekliyor",
  processing: "İşleniyor",
  completed: "Hazır",
  failed: "Başarısız",
};

function TagChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-md border border-dashed px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-accent/60 bg-accent/10 text-accent"
          : "border-ink-border/70 text-bone-muted/80 hover:border-white/30 hover:text-bone-muted"
      }`}
    >
      #{label}
    </button>
  );
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-accent/60 bg-accent/15 text-accent"
          : "border-ink-border text-bone-muted hover:border-white/30 hover:text-bone"
      }`}
    >
      {label}
    </button>
  );
}

export function ItemFilters({
  query,
  onQueryChange,
  types,
  activeType,
  onTypeChange,
  statuses,
  activeStatus,
  onStatusChange,
  tags,
  activeTag,
  onTagChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  types: Item["type"][];
  activeType: Item["type"] | null;
  onTypeChange: (type: Item["type"] | null) => void;
  statuses: Item["processingStatus"][];
  activeStatus: Item["processingStatus"] | null;
  onStatusChange: (status: Item["processingStatus"] | null) => void;
  tags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Başlık ya da etikette ara…"
        className="w-full rounded-full border border-ink-border bg-black/30 px-4 py-2.5 text-sm text-bone placeholder:text-bone-muted outline-none transition-colors focus:border-accent/60"
      />

      {(types.length > 0 || statuses.length > 0) && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {types.map((type) => (
            <Pill
              key={type}
              label={TYPE_LABEL[type]}
              active={activeType === type}
              onClick={() => onTypeChange(activeType === type ? null : type)}
            />
          ))}
          {statuses.map((status) => (
            <Pill
              key={status}
              label={STATUS_LABEL[status]}
              active={activeStatus === status}
              onClick={() => onStatusChange(activeStatus === status ? null : status)}
            />
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="text-xs font-medium uppercase tracking-wide text-bone-muted/60">
            Etiketler
          </span>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                active={activeTag === tag}
                onClick={() => onTagChange(activeTag === tag ? null : tag)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
