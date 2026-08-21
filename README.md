# KAPSÜL

Kişisel bilgi yönetim platformu. Belge, fotoğraf, ekran görüntüsü, PDF, web sayfası, metin veya ses kaydı bırakırsın; AI içeriği anlar, kategorize eder, özetler, etiketler, indeksler ve doğal dille aranabilir hale getirir.

> Kullanıcı bırakır. KAPSÜL anlar. KAPSÜL organize eder. KAPSÜL hatırlar.

## Mimari

Detaylı mimari için `docs/architecture.md`. Kısaca:

```
Android (Kotlin/Compose)  ─┐
Web (Next.js)              ├─► Firebase (Auth/Firestore, Spark plan)
PC Agent (Windows, ileride) ┘
Web ──► Cloudflare Worker (apps/storage-worker) ──► R2 (dosyalar)
Web ──► Cloudflare Worker (apps/ai-worker) ──► Firestore REST + Groq API
```

## Teknoloji stack

| Katman | Teknoloji |
|---|---|
| Web | Next.js, TypeScript, Tailwind |
| Android | Kotlin, Jetpack Compose, MVVM |
| Backend | Firebase (Auth, Firestore — Spark plan), Cloudflare Workers (storage, AI pipeline) |
| AI | Groq API (abstraction katmanı ile provider-değiştirilebilir) |
| Monorepo | npm workspaces |

## Proje yapısı

```
apps/
  web/            Next.js web uygulaması
  storage-worker/ Cloudflare Worker — R2 dosya deposu
  ai-worker/      Cloudflare Worker — içerik çıkarma + Groq analiz pipeline'ı
  android/        Kotlin/Compose Android uygulaması (PHASE 6)
  desktop/        PC Agent (PHASE 10)
packages/
  types/      Paylaşılan Firestore veri modelleri
  firebase/   Client SDK wrapper'ı
  ai/         Groq abstraction, prompt şablonları
  api/        Firestore path/repository yardımcıları
  utils/      hash, chunking, cosine similarity
docs/         Mimari ve alt sistem dokümantasyonu
```

## Kurulum

### Gereksinimler

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- Bir Firebase projesi (Spark plan — Blaze gerekmiyor)
- Bir Cloudflare hesabı (Workers + R2, ücretsiz kotada)
- Groq API key ([console.groq.com](https://console.groq.com))

### Adımlar

```bash
git clone <repo-url> kapsul
cd kapsul
npm install
cp .env.example .env
```

`.env` dosyasını doldur (bkz. aşağıdaki Environment Variables bölümü).

### Firebase kurulumu

1. [Firebase Console](https://console.firebase.google.com)'da yeni proje oluştur (Spark planı yeterli).
2. Authentication → Email/Password sağlayıcısını aktif et.
3. Firestore Database oluştur (production mode, bir bölge seç).
4. `.firebaserc.example` → `.firebaserc` olarak kopyala, `default` proje ID'ni yaz.
5. Kuralları yayınla:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```
6. `apps/ai-worker`'ın Firestore'a yazabilmesi için bir servis hesabı (service account) oluştur, JSON'daki `client_email` ve `private_key` değerlerini worker secret'ı olarak ekle (bkz. aşağıda).

Detay: `docs/firebase.md`.

### Cloudflare Workers kurulumu

1. `npm run dev:storage-worker` / `npm run dev:ai-worker` ile lokal geliştirme; `npm run deploy:storage-worker` / `npm run deploy:ai-worker` ile deploy.
2. Secret'ları ayarla:
   ```bash
   npx wrangler secret put GROQ_API_KEY --workspace=apps/ai-worker
   npx wrangler secret put FIRESTORE_CLIENT_EMAIL --workspace=apps/ai-worker
   npx wrangler secret put FIRESTORE_PRIVATE_KEY --workspace=apps/ai-worker
   ```
3. Deploy edilen worker URL'lerini `apps/web/.env.local` içine `NEXT_PUBLIC_STORAGE_WORKER_URL` / `NEXT_PUBLIC_AI_WORKER_URL` olarak yaz.

### Groq API kurulumu

1. [console.groq.com](https://console.groq.com) üzerinden API key oluştur.
2. `apps/ai-worker` secret'ı olarak `GROQ_API_KEY` ekle (yukarıya bkz).
3. Key yalnızca worker ortamında kullanılır, client'a asla expose edilmez (bkz. `docs/security.md`).

## Environment variables

| Değişken | Nerede kullanılır |
|---|---|
| `GROQ_API_KEY` | apps/ai-worker (Cloudflare secret) |
| `FIRESTORE_CLIENT_EMAIL` | apps/ai-worker (Cloudflare secret) |
| `FIRESTORE_PRIVATE_KEY` | apps/ai-worker (Cloudflare secret) |
| `NEXT_PUBLIC_FIREBASE_*` | apps/web (client SDK, tarayıcıya expose edilir) |
| `NEXT_PUBLIC_STORAGE_WORKER_URL` | apps/web (client SDK, tarayıcıya expose edilir) |
| `NEXT_PUBLIC_AI_WORKER_URL` | apps/web (client SDK, tarayıcıya expose edilir) |

Tam liste: `.env.example`.

## Development

```bash
npm run dev:web          # Next.js dev server
npm run typecheck        # tüm workspace'lerde tsc --noEmit
npm run build:packages   # packages/* derlemesi
```

### Android çalıştırma

Henüz mevcut değil (PHASE 6). Kurulduğunda: `apps/android` içinde Android Studio ile aç, Gradle sync, çalıştır.

### Web çalıştırma

```bash
npm run dev:web
```

`http://localhost:3000` adresinde açılır.

## Firebase deploy

```bash
firebase deploy --only firestore:rules,storage:rules
```

## Cloudflare Workers deploy

```bash
npm run deploy:storage-worker
npm run deploy:ai-worker
```

## Testing

```bash
npm run test
```

Kapsam: JSON parsing (AI response), authentication/authorization, file upload, search, RAG — bkz. `docs/security.md`.

## Troubleshooting

| Sorun | Çözüm |
|---|---|
| `Firebase client not initialized` hatası | `initFirebaseClient` çağrılmadan `getFirebaseAuth`/`getFirebaseFirestore` kullanılmış. `apps/web/src/lib/firebase.ts`'in import edildiğinden emin ol. |
| `ai-worker`'da `GROQ_API_KEY is required` | `wrangler secret put GROQ_API_KEY --workspace=apps/ai-worker` ile key set edilmemiş. |
| RAG (embedding, soru-cevap) çalışmıyor | Henüz ilgili fazda implemente edilmedi — bkz. PHASE planı aşağıda. |

## Development fazları

PHASE 0 (bu commit) → 1 (Auth) → 2 (Item CRUD) → 3 (AI) → 4 (Search) → 5 (RAG) → 6 (Android) → 7 (Advanced Inputs) → 8 (Smart Knowledge) → 9 (Actions) → 10 (PC Agent) → 11 (Polish).

## Dokümantasyon

- `docs/architecture.md`
- `docs/firebase.md`
- `docs/ai.md`
- `docs/rag.md`
- `docs/android.md`
- `docs/web.md`
- `docs/desktop.md`
- `docs/security.md`
