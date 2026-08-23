"use client";

import { ItemCard } from "@/components/item-card";
import { ItemFilters } from "@/components/item-filters";
import { ProtectedRoute } from "@/components/protected-route";
import { Sidebar } from "@/components/sidebar";
import { UploadButton, UploadDropzone, UploadProgressList } from "@/components/upload-dropzone";
import { useAuth } from "@/lib/auth-context";
import { createCollection } from "@/lib/collections";
import { getFirebaseAuth } from "@/lib/firebase";
import { useCollections } from "@/lib/use-collections";
import { useFileUpload } from "@/lib/use-file-upload";
import { useGlobalDrop } from "@/lib/use-global-drop";
import { useItems } from "@/lib/use-items";
import type { Item } from "@kapsul/types";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { items, loading } = useItems(user?.uid);
  const { collections } = useCollections(user?.uid);
  const { uploads, handleFiles } = useFileUpload(user?.uid);
  const dragging = useGlobalDrop(handleFiles);

  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<Item["type"] | null>(null);
  const [activeStatus, setActiveStatus] = useState<Item["processingStatus"] | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const scopedItems = useMemo(
    () =>
      activeCollectionId
        ? items.filter((item) => item.collectionIds?.includes(activeCollectionId))
        : items,
    [items, activeCollectionId]
  );

  const availableTypes = useMemo(
    () => Array.from(new Set(scopedItems.map((item) => item.type))),
    [scopedItems]
  );
  const availableStatuses = useMemo(
    () => Array.from(new Set(scopedItems.map((item) => item.processingStatus))),
    [scopedItems]
  );
  const availableTags = useMemo(
    () => Array.from(new Set(scopedItems.flatMap((item) => item.tags))).sort(),
    [scopedItems]
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scopedItems.filter((item) => {
      if (activeType && item.type !== activeType) return false;
      if (activeStatus && item.processingStatus !== activeStatus) return false;
      if (activeTag && !item.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [scopedItems, query, activeType, activeStatus, activeTag]);

  const activeCollectionName = activeCollectionId
    ? collections.find((c) => c.id === activeCollectionId)?.name
    : null;

  async function handleSignOut() {
    await signOut(getFirebaseAuth());
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar
        user={user}
        collections={collections}
        activeCollectionId={activeCollectionId}
        onSelectCollection={setActiveCollectionId}
        onCreateCollection={(name) => createCollection(user.uid, name)}
        onSignOut={handleSignOut}
      />

      <main className="relative min-h-screen flex-1">
        <div className="pointer-events-none absolute inset-0 h-[320px] bg-radial-glow" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
          {!loading && items.length === 0 ? (
            <>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-bone sm:text-4xl">
                  Aklında ne varsa, <span className="text-accent">bırak</span>.
                </h1>
                <p className="mt-2 text-sm text-bone-muted">Henüz kapsülünde öge yok.</p>
              </div>
              <UploadDropzone uploads={uploads} onFiles={handleFiles} />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold text-bone">
                    {activeCollectionName ?? "Tüm Ögeler"}
                  </h1>
                  <p className="text-xs text-bone-muted">
                    {loading ? "Yükleniyor…" : `${scopedItems.length} öge`}
                  </p>
                </div>
                <UploadButton onFiles={handleFiles} />
              </div>

              <UploadProgressList uploads={uploads} />

              <ItemFilters
                query={query}
                onQueryChange={setQuery}
                types={availableTypes}
                activeType={activeType}
                onTypeChange={setActiveType}
                statuses={availableStatuses}
                activeStatus={activeStatus}
                onStatusChange={setActiveStatus}
                tags={availableTags}
                activeTag={activeTag}
                onTagChange={setActiveTag}
              />

              {loading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-xl border border-ink-border bg-ink-panel/40" />
                  ))}
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
            </>
          )}
        </div>

        {dragging && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center border-4 border-dashed border-accent bg-ink/80 backdrop-blur-sm">
            <p className="text-lg font-semibold text-accent">Yüklemek için bırak</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
