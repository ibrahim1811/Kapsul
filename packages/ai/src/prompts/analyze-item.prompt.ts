export const ANALYZE_ITEM_PROMPT_VERSION = "v1";

export function buildAnalyzeItemPrompt(
  text: string,
  existingTags: string[] = [],
  existingFolders: string[] = []
): string {
  const existingTagsSection =
    existingTags.length > 0
      ? `\nKullanıcının mevcut etiketleri:\n${existingTags.map((t) => `- ${t}`).join("\n")}\n`
      : "";

  const existingFoldersSection =
    existingFolders.length > 0
      ? `\nKullanıcının mevcut klasörleri:\n${existingFolders.map((f) => `- ${f}`).join("\n")}\n`
      : "";

  return `Aşağıdaki içeriği analiz et ve YALNIZCA aşağıdaki JSON şemasına uyan bir çıktı üret. Şema dışına çıkma, açıklama ekleme.

JSON şeması:
{
  "title": string,
  "summary": string,
  "category": string,
  "tags": string[],
  "folder": string,
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
- "tags" için ÖNCE kullanıcının mevcut etiketleri arasında içeriğe uyan var mı diye bak; uyuyorsa o etiketi harfiyen aynı yazımla kullan. Aynı anlama gelen yeni bir etiket UYDURMA. Hiçbiri uymuyorsa yeni, kısa bir etiket oluştur.
- "folder" SADECE kullanıcının mevcut klasörleri arasından seçilir: içerik bu klasörlerden birine gerçekten uyuyorsa o klasörün adını harfiyen aynı yazımla yaz. Yeni klasör adı UYDURMA. Hiçbiri açıkça uymuyorsa "folder" alanını boş string bırak.
${existingTagsSection}${existingFoldersSection}
İçerik:
"""
${text}
"""`;
}
