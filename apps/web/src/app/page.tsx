"use client";

import { Logo } from "@/components/logo";
import { ItemCard } from "@/components/item-card";
import { ItemFilters } from "@/components/item-filters";
import { ProtectedRoute } from "@/components/protected-route";
import { UploadDropzone } from "@/components/upload-dropzone";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseAuth } from "@/lib/firebase";
import { useItems } from "@/lib/use-items";
import type { Item } from "@kapsul/types";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { items, loading } = useItems(user?.uid);

  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<Item["type"] | null>(null);
  const [activeStatus, setActiveStatus] = useState<Item["processingStatus"] | null>(null);

  const availableTypes = useMemo(
    () => Array.from(new Set(items.map((item) => item.type))),
    [items]
  );
  const availableStatuses = useMemo(
    () => Array.from(new Set(items.map((item) => item.processingStatus))),
    [items]
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (activeType && item.type !== activeType) return false;
      if (activeStatus && item.processingStatus !== activeStatus) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [items, query, activeType, activeStatus]);

  async function handleSignOut() {
    await signOut(getFirebaseAuth());
    router.replace("/login");
  }

  return (
    <main className="relative min-h-screen bg-ink">
      <div className="pointer-events-none absolute inset-0 h-[420px] bg-radial-glow" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-ink-border px-3 py-1.5 text-xs text-bone-muted sm:inline">
              {user?.displayName || user?.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-ink-border px-4 py-1.5 text-xs font-medium text-bone transition-colors hover:border-white/30"
            >
              Çıkış yap
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-bone sm:text-4xl">
            Aklında ne varsa, <span className="text-accent">bırak</span>.
          </h1>
          <p className="mt-2 text-sm text-bone-muted">
            {loading ? "Yükleniyor…" : `${items.length} öge kapsülünde saklanıyor`}
          </p>
        </div>

        {user && <UploadDropzone userId={user.uid} />}

        {!loading && items.length > 0 && (
          <ItemFilters
            query={query}
            onQueryChange={setQuery}
            types={availableTypes}
            activeType={activeType}
            onTypeChange={setActiveType}
            statuses={availableStatuses}
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
          />
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-ink-border bg-ink-panel/40" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-ink-border py-16 text-center">
            <p className="text-sm font-medium text-bone">Henüz öge yok</p>
            <p className="text-xs text-bone-muted">Bir dosya yükleyerek kapsülünü doldurmaya başla.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-ink-border py-16 text-center">
            <p className="text-sm font-medium text-bone">Eşleşen öge yok</p>
            <p className="text-xs text-bone-muted">Arama ya da filtreyi değiştirmeyi dene.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
