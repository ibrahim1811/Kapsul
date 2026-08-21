# Web

Next.js (App Router) + TypeScript, `apps/web`.

## Durum (PHASE 2)

- Auth: `AuthProvider` (`src/lib/auth-context.tsx`), `/login` ve `/register` (e-posta/şifre), `ProtectedRoute`, ilk girişte `users/{uid}` profil dokümanı (`src/lib/user-profile.ts`).
- Item CRUD: `src/lib/items.ts` (create via upload, update, delete), `src/lib/use-items.ts` / `use-item.ts` (realtime Firestore listener'lar).
- Drag & drop upload: `src/components/upload-dropzone.tsx`, dosyalar Cloudflare R2'ye `src/lib/storage-worker.ts` üzerinden yüklenir (bkz. `docs/firebase.md`).
- Item detay: `src/app/items/[id]/page.tsx` — başlık/etiket düzenleme, indirme, silme.

## Gelecek fazlar
- PHASE 4/5: arama ve "Kapsül'e Sor" ekranı.

## Çalıştırma

```bash
npm install
npm run dev --workspace=apps/web
```

`.env.local` dosyasına `NEXT_PUBLIC_FIREBASE_*` değerlerini ekle (bkz. `.env.example`).
