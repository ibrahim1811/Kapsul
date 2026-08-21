# AI

## Provider abstraction

`packages/ai/src/ai-provider.interface.ts` içindeki `AIProvider` interface'i tüm AI sağlayıcılarının uyması gereken sözleşmedir. Şu an tek implementasyon: `GroqProvider` (`groq.service.ts`).

Provider değiştirmek için:
1. `AIProvider` interface'ini implemente eden yeni bir sınıf yaz (ör. `OpenAIProvider`).
2. `ai.service.ts` içindeki `getAIProvider()` fabrikasını güncelle.

## Structured output

Groq'tan her zaman JSON formatında cevap istenir (`response_format: json_object`). `groq.service.ts` içindeki `parseAnalysisJson` fonksiyonu:
- JSON parse hatasında boş-ama-geçerli bir `AIAnalysisResult` döner (uygulama çökmez).
- Eksik/yanlış tipli alanları güvenli varsayılanlarla doldurur.

## Prompt versiyonlama

`packages/ai/src/prompts/` altındaki her prompt dosyası bir `_PROMPT_VERSION` sabiti taşır. Prompt değiştiğinde versiyon artırılır, böylece hangi analiz sonucunun hangi prompt versiyonuyla üretildiği izlenebilir (ileride `Item.metadata` içine eklenebilir).

## Maliyet kontrolü

Aynı içerik tekrar analiz edilmez: `contentHash` (sha256) ile duplicate tespiti yapılır, `processingStatus`/`aiStatus` alanları işlemin tekrar tetiklenmesini önler.
