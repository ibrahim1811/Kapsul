"use client";

export const runtime = "edge";

import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { deleteItem, updateItem } from "@/lib/items";
import { downloadFile } from "@/lib/storage-worker";
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

function ItemDetail({ itemId }: { itemId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const item = useItem(user?.uid, itemId);

  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

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

  return (
    <main className="relative min-h-screen bg-ink">
      <div className="pointer-events-none absolute inset-0 h-[320px] bg-radial-glow" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
        <Link href="/" className="w-fit text-sm text-bone-muted transition-colors hover:text-accent">
          ← Kapsüle dön
        </Link>

        <div className="rounded-3xl border border-ink-border bg-ink-panel/60 p-6 shadow-card backdrop-blur-sm">
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
            {item.originalFileName && <span className="truncate">{item.originalFileName}</span>}
          </div>

          {item.processingStatus === "failed" && item.processingError && (
            <p className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
              {item.processingError}
            </p>
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
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            {item.originalFileName && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-full border border-ink-border px-4 py-2 text-sm font-medium text-bone transition-colors hover:border-white/30 disabled:opacity-50"
              >
                {downloading ? "İndiriliyor…" : "İndir"}
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:border-red-500/60 disabled:opacity-50"
            >
              {deleting ? "Siliniyor…" : "Sil"}
            </button>
          </div>
        </div>

        {PREVIEWABLE_TYPES.has(item.type) && item.originalFileName && (
          <div className="overflow-hidden rounded-3xl border border-ink-border bg-ink-panel/60 backdrop-blur-sm">
            {previewError ? (
              <p className="p-6 text-sm text-bone-muted">Önizleme yüklenemedi.</p>
            ) : !previewUrl ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-border border-t-accent" />
              </div>
            ) : item.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={item.title} className="max-h-[70vh] w-full object-contain" />
            ) : item.type === "pdf" ? (
              <iframe src={previewUrl} title={item.title} className="h-[70vh] w-full" />
            ) : item.type === "audio" ? (
              <audio src={previewUrl} controls className="w-full p-6" />
            ) : (
              <video src={previewUrl} controls className="max-h-[70vh] w-full" />
            )}
          </div>
        )}

        {item.summary && (
          <div className="rounded-3xl border border-ink-border bg-ink-panel/60 p-6 backdrop-blur-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-bone-muted">Özet</h2>
            <p className="mt-2 text-sm leading-relaxed text-bone">{item.summary}</p>
          </div>
        )}

        {item.extractedText && (
          <div className="rounded-3xl border border-ink-border bg-ink-panel/60 p-6 backdrop-blur-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-bone-muted">İçerik</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-bone-muted">
              {item.extractedText}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <ItemDetail itemId={params.id} />
    </ProtectedRoute>
  );
}
