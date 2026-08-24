import type { SearchableItem } from "@kapsul/types";

export const SEARCH_ITEMS_PROMPT_VERSION = "v1";

function formatItem(item: SearchableItem): string {
  const lines = [
    `id: ${item.id}`,
    `başlık: ${item.title}`,
    item.category ? `kategori: ${item.category}` : "",
    item.summary ? `özet: ${item.summary}` : "",
    item.tags.length ? `etiketler: ${item.tags.join(", ")}` : "",
    item.people?.length ? `kişiler: ${item.people.join(", ")}` : "",
    item.organizations?.length ? `kurumlar: ${item.organizations.join(", ")}` : "",
    item.locations?.length ? `konumlar: ${item.locations.join(", ")}` : "",
    item.amounts?.length ? `tutarlar: ${item.amounts.join(", ")}` : "",
    item.actionItems?.length ? `aksiyon maddeleri: ${item.actionItems.join(", ")}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

export function buildSearchItemsPrompt(query: string, items: SearchableItem[]): string {
  const catalog = items.map(formatItem).join("\n---\n");

  return `Kullanıcının kişisel içerik kasasında (KAPSÜL) doğal dil sorgusuna göre alakalı içerikleri bulan bir arama asistanısın.

KURALLAR:
- Sadece aşağıdaki İÇERİK LİSTESİ'ndeki id'leri kullan, uydurma id döndürme.
- Sorguyla anlamca gerçekten alakalı olan içerikleri seç; sadece yüzeysel kelime benzerliği yeterli değil.
- Sonuçları en alakalıdan en az alakalıya doğru sırala.
- Hiçbir içerik alakalı değilse boş dizi döndür.
- YALNIZCA şu JSON şemasına uyan çıktı üret, açıklama ekleme: {"matches": string[]}

İÇERİK LİSTESİ:
"""
${catalog}
"""

SORGU:
${query}`;
}
