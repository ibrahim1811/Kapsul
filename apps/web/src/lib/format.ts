import type { Item } from "@kapsul/types";

export function formatRelativeDate(ts: Item["createdAt"] | undefined): string {
  if (!ts?.seconds) return "";
  const date = new Date(ts.seconds * 1000);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  const time = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays <= 0) return `Bugün, ${time}`;
  if (diffDays === 1) return `Dün, ${time}`;
  if (diffDays < 7) return `${diffDays} gün önce, ${time}`;
  return `${Math.floor(diffDays / 7)} hafta önce, ${time}`;
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
