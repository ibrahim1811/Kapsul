"use client";

import { ItemCard } from "@/components/item-card";
import { ItemFilters } from "@/components/item-filters";
import { KapsulSohbet } from "@/components/kapsul-sohbet";
import { ProtectedRoute } from "@/components/protected-route";
import { Sidebar } from "@/components/sidebar";
import { UploadButton, UploadDropzone, UploadProgressList } from "@/components/upload-dropzone";
import { searchItemsWithAI } from "@/lib/ai-worker";
import { useAuth } from "@/lib/auth-context";
import { createCollection, deleteCollection, renameCollection } from "@/lib/collections";
import { getFirebaseAuth } from "@/lib/firebase";
import { useCollections } from "@/lib/use-collections";
import { useFileUpload } from "@/lib/use-file-upload";
import { useGlobalDrop } from "@/lib/use-global-drop";
import { useItems } from "@/lib/use-items";
import type { Item, SearchableItem } from "@kapsul/types";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { items, loading } = useItems(user?.uid);
  const { collections } = useCollections(user?.uid);
  const { uploads, handleFiles } = useFileUpload(user?.uid);
  const dragging = useGlobalDrop(handleFiles, (folderName, files) => handleFolderFiles(folderName, files));

  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<Item["type"] | null>(null);
  const [activeStatus, setActiveStatus] = useState<Item["processingStatus"] | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [aiMatches, setAiMatches] = useState<string[] | null>(null);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);
  const [askOpen, setAskOpen] = useState(false);

  function handleQueryChange(value: string) {
    setQuery(value);
    setAiMatches(null);
    setAiSearchError(null);
  }

  async function handleAiSearch() {
    if (!query.trim()) return;
    setAiSearchLoading(true);
    setAiSearchError(null);
    try {
      const searchable: SearchableItem[] = scopedItems.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        category: item.category,
        tags: item.tags,
        people: item.metadata?.people,
        organizations: item.metadata?.organizations,
        locations: item.metadata?.locations,
        amounts: item.metadata?.amounts,
        actionItems: item.metadata?.actionItems,
      }));
      const matches = await searchItemsWithAI(query, searchable);
      setAiMatches(matches);
    } catch (err) {
      setAiSearchError(err instanceof Error ? err.message : "AI arama başarısız oldu.");
    } finally {
      setAiSearchLoading(false);
    }
  }

  function handleClearAiSearch() {
    setAiMatches(null);
    setAiSearchError(null);
  }

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
    const base = aiMatches
      ? aiMatches
          .map((id) => scopedItems.find((item) => item.id === id))
          .filter((item): item is Item => Boolean(item))
      : scopedItems;
    return base.filter((item) => {
      if (activeType && item.type !== activeType) return false;
      if (activeStatus && item.processingStatus !== activeStatus) return false;
      if (activeTag && !item.tags.includes(activeTag)) return false;
      if (aiMatches) return true;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [scopedItems, query, activeType, activeStatus, activeTag, aiMatches]);

  const activeCollectionName = activeCollectionId
    ? collections.find((c) => c.id === activeCollectionId)?.name
    : null;

  async function handleSignOut() {
    await signOut(getFirebaseAuth());
    router.replace("/login");
  }

  async function handleFolderFiles(folderName: string, files: File[]) {
    if (!user) return;
    const collectionId = await createCollection(user.uid, folderName);
    handleFiles(files, collectionId);
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
        onRenameCollection={(id, name) => renameCollection(user.uid, id, name)}
        onDeleteCollection={(id) => {
          if (activeCollectionId === id) setActiveCollectionId(null);
          deleteCollection(user.uid, id);
        }}
        onOpenAsk={() => setAskOpen(true)}
        onSignOut={handleSignOut}
      />

      <main className="relative min-h-screen flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grain" />
        <div className="pointer-events-none absolute inset-0 h-[480px] bg-radial-glow" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
          {!loading && items.length === 0 ? (
            <>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-bone sm:text-4xl">
                  Aklında ne varsa, <span className="text-accent">bırak</span>.
                </h1>
                <p className="mt-2 text-sm text-bone-muted">Henüz kapsülünde öge yok.</p>
              </div>
              <UploadDropzone uploads={uploads} onFiles={handleFiles} onFolderFiles={handleFolderFiles} />
            </>
          ) : (
            <>
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-bone">
                      {activeCollectionName ?? "Tüm Ögeler"}
                    </h1>
                    <p className="mt-0.5 text-sm text-bone-muted">
                      {loading ? "Yükleniyor…" : `${scopedItems.length} öge`}
                    </p>
                  </div>
                  <UploadButton onFiles={handleFiles} onFolderFiles={handleFolderFiles} />
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              <UploadProgressList uploads={uploads} />

              <ItemFilters
                query={query}
                onQueryChange={handleQueryChange}
                types={availableTypes}
                activeType={activeType}
                onTypeChange={setActiveType}
                statuses={availableStatuses}
                activeStatus={activeStatus}
                onStatusChange={setActiveStatus}
                tags={availableTags}
                activeTag={activeTag}
                onTagChange={setActiveTag}
                onAiSearch={handleAiSearch}
                aiSearchLoading={aiSearchLoading}
                aiSearchActive={aiMatches !== null}
                onClearAiSearch={handleClearAiSearch}
              />

              {aiSearchError && <p className="text-xs text-red-400">{aiSearchError}</p>}

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
                  {filteredItems.map((item, index) => (
                    <ItemCard key={item.id} item={item} index={index} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {dragging && (
          <div className="pointer-events-none fixed inset-0 z-50 flex animate-fade-in-scale items-center justify-center border-4 border-dashed border-accent bg-ink/80 backdrop-blur-sm">
            <p className="text-lg font-semibold text-accent">Yüklemek için bırak</p>
          </div>
        )}
      </main>

      <KapsulSohbet
        open={askOpen}
        onClose={() => setAskOpen(false)}
        userId={user.uid}
        items={items}
        collections={collections}
      />
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
