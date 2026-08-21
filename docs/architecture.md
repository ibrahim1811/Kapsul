# Mimari

KAPSÜL, tek bir Firebase projesine bağlanan üç istemciden oluşur: Android (Kotlin/Compose), Web (Next.js) ve PC Agent (Windows, ileride). Firebase Spark (ücretsiz) planında kalınıyor; bu yüzden hem dosya depolama hem de AI pipeline'ı Blaze gerektiren Firebase servisleri (Storage, Cloud Functions) yerine Cloudflare Workers üzerinde çalışır.

```
Android ─┐
Web      ├─► Firebase (Auth, Firestore)
PC Agent ─┘
Web ──► Cloudflare Worker (apps/storage-worker) ──► R2 (dosyalar)
Web ──► Cloudflare Worker (apps/ai-worker) ──► Firestore REST + Groq API
```

## Katmanlar

- **apps/** — istemci uygulamaları. Her biri kendi UI/state yönetimini yapar, iş mantığını `packages/` altındaki paylaşılan kütüphanelere bırakır.
- **apps/storage-worker** — Cloudflare Worker, Firebase ID token doğrulayıp R2'de kullanıcı-izole dosya okuma/yazma/silme yapar (`docs/firebase.md`'de detay).
- **apps/ai-worker** — Cloudflare Worker, Firebase ID token doğrulayıp içerik çıkarma (metin/PDF/görsel/ses) + Groq analiz pipeline'ını çalıştırır; sonuçları Firestore REST API üzerinden (servis hesabı ile) yazar.
- **packages/types** — Firestore doküman şemaları, tüm client'ların ortak tip kaynağı.
- **packages/firebase** — client SDK (web) başlatma sarmalayıcısı.
- **packages/ai** — Groq abstraction, prompt şablonları. `apps/ai-worker` içinden kullanılır.
- **packages/api** — Firestore path/repository yardımcıları.
- **packages/utils** — hash, chunking, cosine similarity gibi provider-bağımsız yardımcılar.

## Veri akışı (item pipeline)

Upload → R2 (storage-worker) → Firestore item (pending) → client `ai-worker`'ı tetikler → extract/OCR → Groq analiz → Firestore güncelleme (completed) → istemcide realtime listener ile UI güncellenir.

Detaylar için: `docs/firebase.md`, `docs/ai.md`, `docs/rag.md`, `docs/security.md`.
