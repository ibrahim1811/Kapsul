# Güvenlik

## Firestore / Storage kuralları

- Tüm veri `users/{userId}/...` altında tutulur.
- Kural: `request.auth != null && request.auth.uid == userId` — kullanıcı yalnızca kendi verisine erişebilir.
- Varsayılan davranış deny-all (`firestore.rules` / `storage.rules` sonundaki catch-all kural).
- Admin/yönetimsel işlemler yalnızca `apps/ai-worker` (Firestore'a servis hesabıyla yazan Cloudflare Worker) üzerinden yapılır, client'tan asla.

## API key yönetimi

- `GROQ_API_KEY` ve Firestore servis hesabı anahtarı (`FIRESTORE_CLIENT_EMAIL`/`FIRESTORE_PRIVATE_KEY`) yalnızca `apps/ai-worker` Cloudflare secret'ı olarak tutulur (`wrangler secret put`).
- Client bundle'a (`NEXT_PUBLIC_*` hariç) hiçbir gizli anahtar konmaz.
- `.env` dosyaları `.gitignore` içinde, repoya commit edilmez.

## App Check

Mümkün olan client'larda (Web: reCAPTCHA v3, Android: Play Integrity) App Check aktif edilecek — bot/otomasyon kaynaklı Firestore/Functions çağrılarını engeller.

## Test

Firebase Security Rules için `@firebase/rules-unit-testing` ile testler PHASE 1'de eklenecek: kullanıcı kendi verisine erişebiliyor mu, başka kullanıcının verisine erişemiyor mu, kimliksiz istek reddediliyor mu.
