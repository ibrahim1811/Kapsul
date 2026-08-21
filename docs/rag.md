# RAG — "Kapsül'e Sor"

## Akış

```
Soru → embedding → Firestore'daki chunk embedding'leriyle cosine similarity → top-k chunk → context assembly → Groq → cevap + citation
```

## Grounding kuralları

- AI yalnızca getirilen chunk'lara dayanarak cevap verir (`prompts/answer-question.prompt.ts`).
- Yeterli kaynak yoksa sabit fallback cümlesi döner: *"Kaydettiğin içeriklerde bu soruyu kesin olarak cevaplayacak yeterli bilgi bulamadım."*
- Her cevap `[Belge adı — Sayfa X]` formatında kaynak listesiyle biter.

## Vector similarity — ilk aşama yaklaşımı

Firestore native vector query sağlamadığı için ilk aşamada:
- Embedding'ler `chunks` alt koleksiyonunda `number[]` olarak saklanır.
- Benzerlik hesaplama `apps/ai-worker` içinde `packages/utils/src/vector.ts::cosineSimilarity` ile yapılacak.
- Bu yaklaşım item sayısı arttıkça (binlerce chunk) CPU/latency açısından ölçeklenmez — büyüme durumunda Vertex AI Vector Search veya benzeri bir extension'a geçiş planlanmalı (PHASE 4/8 sonrası değerlendirilecek).

## Durum

RAG akışı henüz implemente edilmedi. PHASE 5'te `apps/ai-worker` içine embedding + soru-cevap endpoint'i olarak eklenecek.
