# Android

Kotlin + Jetpack Compose, MVVM + Repository Pattern.

```
UI (Compose) → ViewModel → Repository → Firebase SDK
```

## Durum

Henüz başlanmadı — PHASE 6'da `apps/android` altında Gradle projesi olarak kurulacak.

## Planlanan modüller

- Login / Register / Google Sign-In
- Home, Inbox, Search, Item Detail, AI Chat, Collections, Tags, Settings, Profile
- Share Intent (text/URL/image/PDF)
- Kamera → OCR → AI analiz akışı
- Offline-first: pending queue + sync

Aynı Firebase projesine bağlanır, veri modeli `packages/types` ile birebir eşleşecek şekilde Kotlin data class'larına çevrilecek.
