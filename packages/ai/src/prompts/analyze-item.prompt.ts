export const ANALYZE_ITEM_PROMPT_VERSION = "v1";

export function buildAnalyzeItemPrompt(text: string): string {
  return `Aşağıdaki içeriği analiz et ve YALNIZCA aşağıdaki JSON şemasına uyan bir çıktı üret. Şema dışına çıkma, açıklama ekleme.

JSON şeması:
{
  "title": string,
  "summary": string,
  "category": string,
  "tags": string[],
  "language": string,
  "dates": string[],
  "people": string[],
  "organizations": string[],
  "locations": string[],
  "amounts": string[],
  "actionItems": string[],
  "importantPoints": string[]
}

Kurallar:
- Yalnızca metinde gerçekten geçen bilgileri kullan, hiçbir şey uydurma.
- "tags" Türkçe, kısa ve içerikle doğrudan ilgili olsun.
- Bilgi yoksa ilgili alanı boş dizi veya boş string olarak bırak.

İçerik:
"""
${text}
"""`;
}
