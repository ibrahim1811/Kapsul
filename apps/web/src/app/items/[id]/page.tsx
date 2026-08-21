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

function ItemDetail({ itemId }: { itemId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const item = useItem(user?.uid, itemId);

  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setTagsInput(item.tags.join(", "));
    }
  }, [item]);

  if (item === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-neutral-500">Yükleniyor...</p>
      </main>
    );
  }

  if (item === null || !user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-neutral-500">Öge bulunamadı.</p>
        <Link href="/" className="text-sm underline">Geri dön</Link>
      </main>
    );
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await updateItem(user.uid, itemId, { title: title.trim() || item!.title, tags });
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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-8">
      <Link href="/" className="text-sm text-neutral-500 underline">
        ← Geri
      </Link>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-xl font-semibold outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">{item.type}</span>
        <span>{item.processingStatus}</span>
        {item.originalFileName && <span>{item.originalFileName}</span>}
      </div>

      <label className="text-sm font-medium">Etiketler</label>
      <input
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="etiket1, etiket2"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          Kaydet
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-50 dark:border-red-900"
        >
          Sil
        </button>
        {item.originalFileName && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium disabled:opacity-50 dark:border-neutral-700"
          >
            İndir
          </button>
        )}
      </div>

      {item.summary && (
        <div>
          <h2 className="text-sm font-medium">Özet</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.summary}</p>
        </div>
      )}

      {item.extractedText && (
        <div>
          <h2 className="text-sm font-medium">İçerik</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
            {item.extractedText}
          </p>
        </div>
      )}
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
