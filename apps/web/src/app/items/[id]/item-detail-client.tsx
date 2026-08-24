"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { triggerItemProcessing } from "@/lib/ai-worker";
import { useAuth } from "@/lib/auth-context";
import { moveItemToCollection } from "@/lib/collections";
import { formatFileSize, formatRelativeDate, isLikelyGarbledText } from "@/lib/format";
import { deleteItem, updateItem } from "@/lib/items";
import { downloadFile } from "@/lib/storage-worker";
import { useCollections } from "@/lib/use-collections";
import { useItem } from "@/lib/use-item";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  pending: "Bekliyor",
  processing: "İşleniyor",
  completed: "Hazır",
  failed: "Başarısız",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-white/5 text-bone-muted",
  processing: "bg-accent/10 text-accent",
  completed: "bg-accent/15 text-accent",
  failed: "bg-red-500/10 text-red-400",
};

const PREVIEWABLE_TYPES = new Set(["image", "pdf", "audio", "video"]);

type MetadataArrayKey = "dates" | "people" | "organizations" | "locations" | "amounts" | "actionItems";

const METADATA_GROUPS: { key: MetadataArrayKey; label: string }[] = [
  { key: "dates", label: "Tarihler" },
  { key: "people", label: "Kişiler" },
  { key: "organizations", label: "Kurumlar" },
  { key: "locations", label: "Konumlar" },
  { key: "amounts", label: "Tutarlar" },
  { key: "actionItems", label: "Yapılacaklar" },
];

function ItemDetail({ itemId }: { itemId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const item = useItem(user?.uid, itemId);
  const { collections } = useCollections(user?.uid);

  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [movingFolder, setMovingFolder] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
    }
  }, [item]);

  useEffect(() => {
    if (!user || !item?.originalFileName || !PREVIEWABLE_TYPES.has(item.type)) return;

    let objectUrl: string | null = null;
    let cancelled = false;
    downloadFile(user.uid, itemId, item.originalFileName)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setPreviewError(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, itemId, item?.originalFileName, item?.type]);

  if (item === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-border border-t-accent" />
      </main>
    );
  }

  if (item === null || !user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink">
        <p className="text-sm text-bone-muted">Öge bulunamadı.</p>
        <Link href="/" className="text-sm text-accent hover:underline">
          Geri dön
        </Link>
      </main>
    );
  }

  const hasPreview = PREVIEWABLE_TYPES.has(item.type) && !!item.originalFileName;

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await updateItem(user.uid, itemId, { title: title.trim() || item!.title });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    if (!confirm("Bu ögeyi silmek istediğine emin misin?")) return;
    setDeleting(true);
    try {
      await deleteItem(user.uid, itemId, item!.originalFileName);
      router.replace("/");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload() {
    if (!user || !item?.originalFileName) return;
    setDownloading(true);
    try {
      const blob = await downloadFile(user.uid, itemId, item.originalFileName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.originalFileName;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  async function handleMoveFolder(collectionId: string) {
    if (!user) return;
    setMovingFolder(true);
    try {
      await moveItemToCollection(user.uid, itemId, collectionId || null);
    } finally {
      setMovingFolder(false);
    }
  }

  async function handleRetry() {
    setRetrying(true);
    try {
      await triggerItemProcessing(itemId);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-ink">
      <div className="pointer-events-none absolute inset-0 h-[320px] bg-radial-glow" />

      <div
        className={`relative z-10 flex flex-col gap-6 px-4 py-6 sm:px-6 ${
          hasPreview
            ? "lg:grid lg:h-[calc(100vh-3rem)] lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:items-stretch lg:gap-8"
            : "mx-auto max-w-2xl py-8"
        }`}
      >
        <Link
          href="/"
          className={`w-fit text-sm text-bone-muted transition-colors hover:text-accent ${hasPreview ? "lg:col-span-2" : ""}`}
        >
          ← Kapsüle dön
        </Link>

        {hasPreview && (
          <div
            style={{ animationDelay: "80ms" }}
            className="animate-fade-in-up overflow-hidden rounded-3xl border border-ink-border bg-ink-panel/60 backdrop-blur-sm lg:h-full"
          >
            {previewError ? (
              <p className="p-6 text-sm text-bone-muted">Önizleme yüklenemedi.</p>
            ) : !previewUrl ? (
              <div className="flex h-48 items-center justify-center lg:h-full">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-border border-t-accent" />
              </div>
            ) : item.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={item.title} className="h-full max-h-[80vh] w-full object-contain lg:max-h-none" />
            ) : item.type === "pdf" ? (
              <iframe src={previewUrl} title={item.title} className="h-[80vh] w-full lg:h-full" />
            ) : item.type === "audio" ? (
              <audio src={previewUrl} controls className="w-full p-6" />
            ) : (
              <video src={previewUrl} controls className="h-full max-h-[80vh] w-full lg:max-h-none" />
            )}
          </div>
        )}

        <div className="flex flex-col gap-6 lg:h-full lg:overflow-y-auto lg:pr-1">
        <div className="animate-fade-in-up rounded-3xl border border-ink-border bg-ink-panel/60 p-6 shadow-card backdrop-blur-sm">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-2xl font-semibold text-bone outline-none placeholder:text-bone-muted"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-bone-muted">
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-bone">{item.type}</span>
            <span className={`rounded-full px-2.5 py-1 ${STATUS_CLASS[item.processingStatus] ?? "bg-white/5 text-bone-muted"}`}>
              {STATUS_LABEL[item.processingStatus] ?? item.processingStatus}
            </span>
            {item.aiStatus !== item.processingStatus && (
              <span className={`rounded-full px-2.5 py-1 ${STATUS_CLASS[item.aiStatus] ?? "bg-white/5 text-bone-muted"}`}>
                AI: {STATUS_LABEL[item.aiStatus] ?? item.aiStatus}
              </span>
            )}
            {item.originalFileName && <span className="truncate">{item.originalFileName}</span>}
            {item.fileSize ? <span>{formatFileSize(item.fileSize)}</span> : null}
            {item.createdAt && <span>{formatRelativeDate(item.createdAt)}</span>}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-bone-muted">
            <label htmlFor="collection-select">Klasör:</label>
            <select
              id="collection-select"
              value={item.collectionIds?.[0] ?? ""}
              onChange={(e) => handleMoveFolder(e.target.value)}
              disabled={movingFolder}
              className="rounded-full border border-ink-border bg-black/30 px-2.5 py-1 text-xs text-bone outline-none disabled:opacity-50"
            >
              <option value="">Klasörsüz</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {(item.processingStatus === "failed" || item.aiStatus === "failed") && item.processingError && (
            <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
              <p>
                {item.aiStatus === "failed" && item.processingStatus !== "failed" ? "AI analizi başarısız: " : ""}
                {item.processingError}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="mt-1.5 rounded-full border border-red-500/30 px-2.5 py-1 text-red-300 transition-colors hover:border-red-500/60 active:scale-[0.96] disabled:opacity-50"
              >
                {retrying ? "Yeniden deneniyor…" : "Yeniden Dene"}
              </button>
            </div>
          )}

          {item.tags.length > 0 && (
            <>
              <label className="mt-5 block text-xs font-medium text-bone-muted">Etiketler</label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-ink-border bg-black/30 px-3 py-1 text-xs text-bone-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            {item.originalFileName && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-full border border-ink-border px-4 py-2 text-sm font-medium text-bone transition-all hover:border-white/30 active:scale-[0.97] disabled:opacity-50"
              >
                {downloading ? "İndiriliyor…" : "İndir"}
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:border-red-500/60 active:scale-[0.97] disabled:opacity-50"
            >
              {deleting ? "Siliniyor…" : "Sil"}
            </button>
          </div>
        </div>

        {item.summary && (
          <div
            style={{ animationDelay: "120ms" }}
            className="animate-fade-in-up rounded-3xl border border-ink-border bg-ink-panel/60 p-6 backdrop-blur-sm"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-bone-muted">Özet</h2>
            <p className="mt-2 text-sm leading-relaxed text-bone">{item.summary}</p>
          </div>
        )}

        {item.extractedText && (
          <div
            style={{ animationDelay: "160ms" }}
            className="animate-fade-in-up rounded-3xl border border-ink-border bg-ink-panel/60 p-6 backdrop-blur-sm"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-bone-muted">İçerik</h2>
            {isLikelyGarbledText(item.extractedText) ? (
              <p className="mt-2 text-sm leading-relaxed text-bone-muted/70">
                Bu belgenin metni PDF içindeki font kodlamasından dolayı doğru çıkarılamadı.
              </p>
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-bone-muted">
                {item.extractedText}
              </p>
            )}
          </div>
        )}

        {item.metadata && METADATA_GROUPS.some(({ key }) => item.metadata?.[key]?.length) && (
          <div
            style={{ animationDelay: "200ms" }}
            className="animate-fade-in-up flex flex-col gap-4 rounded-3xl border border-ink-border bg-ink-panel/60 p-6 backdrop-blur-sm"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-bone-muted">
              AI Analizi
            </h2>
            {METADATA_GROUPS.map(({ key, label }) => {
              const values = item.metadata?.[key];
              if (!values?.length) return null;
              return (
                <div key={key}>
                  <p className="text-xs font-medium text-bone-muted/70">{label}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {values.map((value) => (
                      <span
                        key={value}
                        className="rounded-full border border-ink-border bg-black/30 px-3 py-1 text-xs text-bone-muted"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </main>
  );
}

export default function ItemDetailClient({ itemId }: { itemId: string }) {
  return (
    <ProtectedRoute>
      <ItemDetail itemId={itemId} />
    </ProtectedRoute>
  );
}
