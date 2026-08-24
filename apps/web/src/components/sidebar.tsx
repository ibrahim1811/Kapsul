"use client";

import { Logo } from "@/components/logo";
import type { Collection } from "@kapsul/types";
import type { User } from "firebase/auth";
import Link from "next/link";
import { useState } from "react";

export function Sidebar({
  user,
  collections,
  activeCollectionId,
  onSelectCollection,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onOpenAsk,
  onSignOut,
}: {
  user: User;
  collections: Collection[];
  activeCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
  onCreateCollection: (name: string) => void;
  onRenameCollection: (id: string, name: string) => void;
  onDeleteCollection: (id: string) => void;
  onOpenAsk: () => void;
  onSignOut: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function submitNewCollection() {
    const trimmed = name.trim();
    if (trimmed) onCreateCollection(trimmed);
    setName("");
    setCreating(false);
  }

  function startRename(c: Collection) {
    setRenamingId(c.id);
    setRenameValue(c.name);
  }

  function submitRename() {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (trimmed) onRenameCollection(renamingId, trimmed);
    setRenamingId(null);
    setRenameValue("");
  }

  function handleDeleteCollection(c: Collection) {
    if (!confirm(`"${c.name}" klasörünü silmek istediğine emin misin? Ögeler silinmez, sadece klasörden çıkarılır.`)) return;
    onDeleteCollection(c.id);
  }

  const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col gap-4 border-r border-ink-border bg-ink-soft/60 px-3 py-4">
      <Logo className="px-1" />

      <div className="flex items-center gap-2.5 rounded-2xl border border-ink-border bg-ink-panel/60 px-2.5 py-2.5">
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
            {initial}
          </span>
        )}
        <span className="truncate text-xs font-medium text-bone">
          {user.displayName || user.email}
        </span>
      </div>

      <nav className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onSelectCollection(null)}
          className={`relative flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition-colors active:scale-[0.98] ${
            activeCollectionId === null
              ? "bg-accent/15 text-accent before:absolute before:-left-3 before:top-1/2 before:h-3.5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent"
              : "text-bone-muted hover:bg-white/5 hover:text-bone"
          }`}
        >
          <span aria-hidden="true">⌂</span> Tüm Ögeler
        </button>
        <button
          type="button"
          onClick={onOpenAsk}
          className="relative flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs font-medium text-bone-muted transition-colors active:scale-[0.98] hover:bg-white/5 hover:text-bone"
        >
          <span aria-hidden="true">✦</span> Kapsül'e Sor
        </button>
      </nav>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-bone-muted/60">
            Klasörler
          </span>
        </div>

        {collections.map((c) =>
          renamingId === c.id ? (
            <input
              key={c.id}
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") setRenamingId(null);
              }}
              className="mx-0.5 rounded-xl border border-accent/40 bg-black/30 px-2.5 py-1.5 text-xs text-bone outline-none"
            />
          ) : (
            <div
              key={c.id}
              className={`group relative flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
                activeCollectionId === c.id
                  ? "bg-accent/15 text-accent before:absolute before:-left-3 before:top-1/2 before:h-3.5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent"
                  : "text-bone-muted hover:bg-white/5 hover:text-bone"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectCollection(c.id)}
                className="min-w-0 flex-1 truncate text-left active:scale-[0.98]"
              >
                📁 {c.name}
              </button>
              <span className="hidden shrink-0 items-center gap-1 group-hover:flex">
                <button
                  type="button"
                  onClick={() => startRename(c)}
                  aria-label="Yeniden adlandır"
                  className="rounded-md px-1 text-bone-muted/70 transition-colors hover:text-bone active:scale-[0.9]"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCollection(c)}
                  aria-label="Sil"
                  className="rounded-md px-1 text-bone-muted/70 transition-colors hover:text-red-400 active:scale-[0.9]"
                >
                  ✕
                </button>
              </span>
            </div>
          )
        )}

        {creating ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={submitNewCollection}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNewCollection();
              if (e.key === "Escape") {
                setName("");
                setCreating(false);
              }
            }}
            placeholder="Klasör adı…"
            className="mx-0.5 rounded-xl border border-accent/40 bg-black/30 px-2.5 py-1.5 text-xs text-bone outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-xl px-2.5 py-1.5 text-left text-xs text-bone-muted transition-colors active:scale-[0.98] hover:bg-white/5 hover:text-bone"
          >
            + Yeni klasör
          </button>
        )}
      </div>

      <div className="flex flex-col gap-0.5 border-t border-ink-border pt-2">
        <Link
          href="/settings"
          className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-bone-muted transition-colors active:scale-[0.98] hover:bg-white/5 hover:text-bone"
        >
          ⚙ Ayarlar
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-xl px-2.5 py-1.5 text-left text-xs font-medium text-bone-muted transition-colors active:scale-[0.98] hover:bg-white/5 hover:text-bone"
        >
          ⏻ Sign out
        </button>
      </div>
    </aside>
  );
}
