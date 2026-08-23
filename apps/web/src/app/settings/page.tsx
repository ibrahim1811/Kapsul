"use client";

import { ProtectedRoute } from "@/components/protected-route";
import Link from "next/link";

function SettingsPage() {
  return (
    <main className="relative min-h-screen bg-ink">
      <div className="pointer-events-none absolute inset-0 h-[320px] bg-radial-glow" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
        <Link href="/" className="w-fit text-sm text-bone-muted transition-colors hover:text-accent">
          ← Kapsüle dön
        </Link>

        <h1 className="text-2xl font-semibold text-bone">Ayarlar</h1>

        <div className="rounded-3xl border border-ink-border bg-ink-panel/60 p-6 shadow-card backdrop-blur-sm">
          <p className="text-sm text-bone-muted">
            Dil ve premium ayarları yakında burada olacak.
          </p>
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
