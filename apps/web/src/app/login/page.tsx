"use client";

import { Logo } from "@/components/logo";
import { authErrorMessage } from "@/lib/auth-errors";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseAuth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
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
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
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
            <h1 className="text-xl font-semibold text-bone">Tekrar hoş geldin</h1>
            <p className="mt-1 text-sm text-bone-muted">Hesabına giriş yap</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
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
              placeholder="Şifre"
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
              {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-bone-muted">
          Hesabın yok mu?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>
    </main>
  );
}
