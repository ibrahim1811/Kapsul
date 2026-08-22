"use client";

import { Logo } from "@/components/logo";
import { authErrorMessage } from "@/lib/auth-errors";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseAuth } from "@/lib/firebase";
import { ensureUserProfile } from "@/lib/user-profile";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace("/");
  }, [authLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      if (displayName.trim()) {
        await updateProfile(credential.user, { displayName: displayName.trim() });
      }
      await ensureUserProfile(credential.user);
      router.replace("/");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink px-4">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-3xl border border-ink-border bg-ink-panel/80 p-8 shadow-card backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-bone">Kapsülüne başla</h1>
            <p className="mt-1 text-sm text-bone-muted">Yeni hesap oluştur</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Ad Soyad (opsiyonel)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-full border border-ink-border bg-black/30 px-4 py-3 text-sm text-bone placeholder:text-bone-muted outline-none transition-colors focus:border-accent/60"
            />
            <input
              type="email"
              required
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-ink-border bg-black/30 px-4 py-3 text-sm text-bone placeholder:text-bone-muted outline-none transition-colors focus:border-accent/60"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Şifre (en az 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border border-ink-border bg-black/30 px-4 py-3 text-sm text-bone placeholder:text-bone-muted outline-none transition-colors focus:border-accent/60"
            />

            {error && <p className="px-2 text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] disabled:opacity-50"
            >
              {submitting ? "Oluşturuluyor…" : "Kayıt ol"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-bone-muted">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </main>
  );
}
