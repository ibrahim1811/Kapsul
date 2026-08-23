"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { ensureUserProfile, updateUserProfile } from "@/lib/user-profile";
import { useUserProfile } from "@/lib/use-user-profile";
import Link from "next/link";
import { useEffect } from "react";

function SettingsPage() {
  const { user } = useAuth();
  const profile = useUserProfile(user?.uid);

  useEffect(() => {
    if (user) void ensureUserProfile(user);
  }, [user]);

  const autoFolderEnabled = profile?.autoFolderEnabled === true;

  return (
    <main className="relative min-h-screen bg-ink">
      <div className="pointer-events-none absolute inset-0 h-[320px] bg-radial-glow" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
        <Link href="/" className="w-fit text-sm text-bone-muted transition-colors hover:text-accent">
          ← Kapsüle dön
        </Link>

        <h1 className="text-2xl font-semibold text-bone">Ayarlar</h1>

        <div className="rounded-3xl border border-ink-border bg-ink-panel/60 p-6 shadow-card backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-bone">Otomatik klasörleme</p>
              <p className="mt-1 text-xs leading-relaxed text-bone-muted">
                Açarsan, yeni bir öge yüklediğinde AI içeriği mevcut klasörlerinden biriyle
                gerçekten uyuşuyorsa ögeyi otomatik olarak o klasöre yerleştirir. AI yeni klasör
                oluşturmaz — sadece senin oluşturduğun klasörlere bakar.
              </p>
            </div>
            <button
              type="button"
              disabled={!user}
              onClick={() => user && updateUserProfile(user.uid, { autoFolderEnabled: !autoFolderEnabled })}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                autoFolderEnabled ? "bg-accent" : "bg-white/10"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-transform ${
                  autoFolderEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="mt-5 border-t border-ink-border pt-5">
            <p className="text-sm font-medium text-bone">Dil</p>
            <p className="mt-1 text-xs text-bone-muted">Yakında burada olacak.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
}
