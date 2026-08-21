# Firebase

## Servisler

- **Authentication** — email/password (Google Sign-In kaldırıldı).
- **Firestore** — ana veritabanı, `users/{userId}/...` altında kullanıcı-izole koleksiyonlar.

Cloud Functions kullanılmıyor — Spark (ücretsiz) planda kalmak için Blaze gerektiren tüm server-side işler (dosya depolama, AI pipeline) Cloudflare Workers'a taşındı.

## Dosya depolama (Cloudflare R2)

Firebase Storage yerine `apps/storage-worker` (Cloudflare Worker) + R2 bucket `kapsul-files` kullanılıyor — Firebase Storage Blaze plan gerektiriyor, R2'nin ücretsiz kotası yeterli.

## AI pipeline (Cloudflare Worker)

Cloud Functions yerine `apps/ai-worker` kullanılıyor: client, item oluşturduktan sonra Firebase ID token ile worker'ı tetikler; worker içerik çıkarma + Groq analizini çalıştırıp sonucu Firestore REST API üzerinden (bir servis hesabı ile) yazar. Detay: `docs/architecture.md`.

- Web, dosya yükleme/indirme/silme isteklerini Worker'a `Authorization: Bearer <Firebase ID token>` ile atar.
- Worker, token'ı Google'ın JWKS'i ile doğrular (`securetoken@system.gserviceaccount.com`), `sub` claim'i istekteki `userId` ile eşleşmezse reddeder.
- R2 anahtar formatı Firestore `storagePath` ile birebir aynı: `users/{userId}/files/{itemId}/{fileName}`.
- Deploy: `npm run deploy:storage-worker` (bkz. `apps/storage-worker/wrangler.jsonc`).
- **App Check** — mümkün olan client'larda aktif edilecek (Android: Play Integrity, Web: reCAPTCHA v3).

## Firestore koleksiyon yapısı

```
users/{userId}
users/{userId}/items/{itemId}
users/{userId}/items/{itemId}/chunks/{chunkId}
users/{userId}/tags/{tagId}
users/{userId}/collections/{collectionId}
users/{userId}/conversations/{conversationId}
users/{userId}/conversations/{conversationId}/messages/{messageId}
users/{userId}/tasks/{taskId}
users/{userId}/entities/{entityId}
users/{userId}/relationships/{relationshipId}
```

## Kurulum

1. Firebase Console'da proje oluştur.
2. Authentication → Email/Password ve Google sağlayıcılarını aç.
3. Firestore ve Storage'ı oluştur (production mode).
4. `.firebaserc.example` dosyasını `.firebaserc` olarak kopyala, `default` proje ID'sini güncelle.
5. `firebase deploy --only firestore:rules,storage:rules` ile kuralları yayınla.
6. Service account oluşturup `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` değerlerini `.env`'e ekle.
