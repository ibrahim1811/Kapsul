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

const GARBLE_ALLOWED = /[\p{L}\p{N}\s.,;:!?'"()%/–—-]/u;

function isUpper(ch: string): boolean {
  return ch === ch.toUpperCase() && ch !== ch.toLowerCase();
}

// Font kodlaması bozuk PDF'lerde çıkarılan glyph'ler geçerli harfler olur ama
// kelime içinde rastgele büyük/küçük harf değişir (ör. "niRxiYE") — normal
// metinde bu neredeyse hiç olmaz, bu yüzden en güvenilir sinyal bu.
function wordInternalCaseTransitionRatio(text: string): number {
  const words = text.match(/\p{L}+/gu) ?? [];
  let transitions = 0;
  let letters = 0;
  for (const word of words) {
    if (word.length < 3) continue;
    letters += word.length;
    for (let i = 1; i < word.length; i++) {
      if (isUpper(word.charAt(i - 1)) !== isUpper(word.charAt(i))) transitions++;
    }
  }
  return letters >= 30 ? transitions / letters : 0;
}

export function isLikelyGarbledText(text: string): boolean {
  if (!text || text.length < 20) return false;
  const sample = text.slice(0, 2000);

  let allowed = 0;
  for (const ch of sample) {
    if (GARBLE_ALLOWED.test(ch)) allowed++;
  }
  const symbolRatioBad = allowed / sample.length < 0.85;

  return symbolRatioBad || wordInternalCaseTransitionRatio(sample) > 0.12;
}
