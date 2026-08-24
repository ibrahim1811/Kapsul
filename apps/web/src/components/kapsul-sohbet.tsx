"use client";

import { deleteConversation, useConversations, useKapsulSohbet } from "@/lib/conversation";
import { formatRelativeDate } from "@/lib/format";
import type { Citation, Collection, Conversation, Item } from "@kapsul/types";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const STAGE_LABEL: Record<"searching" | "answering", string> = {
  searching: "İlgili içerikler aranıyor…",
  answering: "Cevap hazırlanıyor…",
};

function renderWithBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-bone">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderMessageContent(content: string, citations: Citation[] | undefined) {
  if (!citations || citations.length === 0) return renderWithBold(content);

  const titlePattern = citations.map((c) => escapeRegExp(c.itemTitle)).join("|");
  const combined = new RegExp(`\\*\\*(${titlePattern})\\*\\*|(${titlePattern})`, "g");
  const itemIdByTitle = new Map(citations.map((c) => [c.itemTitle, c.itemId]));

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = combined.exec(content))) {
    if (match.index > lastIndex) {
      nodes.push(<span key={key++}>{renderWithBold(content.slice(lastIndex, match.index))}</span>);
    }
    const title = (match[1] ?? match[2])!;
    const itemId = itemIdByTitle.get(title);
    nodes.push(
      <Link
        key={key++}
        href={`/items/${itemId}`}
        className={`text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent ${
          match[1] ? "font-semibold" : ""
        }`}
      >
        {title}
      </Link>
    );
    lastIndex = combined.lastIndex;
  }
  if (lastIndex < content.length) {
    nodes.push(<span key={key++}>{renderWithBold(content.slice(lastIndex))}</span>);
  }
  return nodes;
}

function ScopePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-[0.96] ${
        active
          ? "border-accent/60 bg-accent/15 text-accent"
          : "border-ink-border text-bone-muted hover:border-white/30 hover:text-bone"
      }`}
    >
      {label}
    </button>
  );
}

function ConversationRail({
  userId,
  conversations,
  activeConversationId,
  onSelect,
  onNew,
}: {
  userId: string;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm("Bu sohbet silinsin mi?")) return;
    setDeletingId(id);
    try {
      await deleteConversation(userId, id);
      if (activeConversationId === id) onNew();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={onNew}
          className="w-full rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition-all active:scale-[0.97] hover:bg-accent/15"
        >
          + Yeni Soru
        </button>
      </div>
      <div className="mt-2 flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-[11px] text-bone-muted">Henüz sohbet yok.</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-1 rounded-lg px-2 py-2 text-left transition-colors ${
                  c.id === activeConversationId ? "bg-accent/10 text-bone" : "text-bone-muted hover:bg-white/5"
                }`}
              >
                <button type="button" onClick={() => onSelect(c.id)} className="flex-1 overflow-hidden text-left">
                  <p className="truncate text-xs font-medium">{c.title || "Kapsül'e Sor"}</p>
                  <p className="mt-0.5 text-[10px] text-bone-muted/70">{formatRelativeDate(c.updatedAt)}</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  aria-label="Sohbeti sil"
                  className="shrink-0 rounded-md px-1.5 py-1 text-xs text-bone-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 disabled:opacity-60"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function KapsulSohbet({
  open,
  onClose,
  userId,
  items,
  collections,
}: {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  items: Item[];
  collections: Collection[];
}) {
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [autoSelected, setAutoSelected] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const conversations = useConversations(userId);
  const { messages, stage, error, sendMessage } = useKapsulSohbet(userId, conversationId, (id) => {
    setConversationId(id);
    setAutoSelected(true);
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  const scopedItems = useMemo(
    () => (scopeId ? items.filter((item) => item.collectionIds?.includes(scopeId)) : items),
    [items, scopeId]
  );

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, stage]);

  useEffect(() => {
    if (!open) {
      setAutoSelected(false);
      return;
    }
    const mostRecent = conversations[0];
    if (!autoSelected && conversationId === null && mostRecent) {
      setConversationId(mostRecent.id);
      setAutoSelected(true);
    }
  }, [open, conversations, conversationId, autoSelected]);

  if (!open) return null;

  function handleNewConversation() {
    setConversationId(null);
    setAutoSelected(true);
    setMobileListOpen(false);
  }

  function handleSelectConversation(id: string) {
    setConversationId(id);
    setAutoSelected(true);
    setMobileListOpen(false);
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || stage !== "idle") return;
    setInput("");
    sendMessage(trimmed, scopedItems);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-full w-full max-w-3xl animate-slide-in-right flex-col border-l border-ink-border bg-ink-soft">
        <div className="flex items-center justify-between border-b border-ink-border px-4 py-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileListOpen((v) => !v)}
              aria-label="Sohbetler"
              className="rounded-lg px-2 py-1 text-bone-muted transition-colors hover:text-bone active:scale-[0.9] sm:hidden"
            >
              ☰
            </button>
            <h2 className="text-sm font-semibold text-bone">✦ Kapsül'e Sor</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg px-2 py-1 text-bone-muted transition-colors hover:text-bone active:scale-[0.9]"
          >
            ✕
          </button>
        </div>

        <div className="relative flex flex-1 overflow-hidden">
          {userId && (
            <aside className="hidden w-56 shrink-0 flex-col border-r border-ink-border sm:flex">
              <ConversationRail
                userId={userId}
                conversations={conversations}
                activeConversationId={conversationId}
                onSelect={handleSelectConversation}
                onNew={handleNewConversation}
              />
            </aside>
          )}

          {userId && mobileListOpen && (
            <div className="absolute inset-0 z-10 flex flex-col bg-ink-soft sm:hidden">
              <ConversationRail
                userId={userId}
                conversations={conversations}
                activeConversationId={conversationId}
                onSelect={handleSelectConversation}
                onNew={handleNewConversation}
              />
            </div>
          )}

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex gap-2 overflow-x-auto scrollbar-none border-b border-ink-border px-4 py-3">
              <ScopePill label="Hepsi" active={scopeId === null} onClick={() => setScopeId(null)} />
              {collections.map((c) => (
                <ScopePill key={c.id} label={c.name} active={scopeId === c.id} onClick={() => setScopeId(c.id)} />
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && stage === "idle" && (
            <p className="mt-6 text-center text-sm text-bone-muted">
              Kapsülündeki her şeye soru sorabilirsin — "kira sözleşmemde depozito ne kadardı?" gibi.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col gap-1.5 ${message.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
                    message.role === "user"
                      ? "bg-accent/15 text-bone"
                      : "border border-ink-border bg-ink-panel/60 text-bone"
                  }`}
                >
                  {renderMessageContent(message.content, message.citations)}
                </div>
              </div>
            ))}

            {stage !== "idle" && (
              <div className="flex items-start">
                <div className="flex items-center gap-2 rounded-2xl border border-ink-border bg-ink-panel/60 px-3.5 py-2.5 text-sm text-bone-muted">
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent [animation-delay:300ms]" />
                  </span>
                  {STAGE_LABEL[stage]}
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 border-t border-ink-border px-4 py-3.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Bir şey sor…"
            disabled={stage !== "idle"}
            className="w-full rounded-full border border-ink-border bg-black/30 px-4 py-2.5 text-sm text-bone placeholder:text-bone-muted outline-none transition-colors focus:border-accent/60 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || stage !== "idle"}
            className="shrink-0 rounded-full border border-accent/60 bg-accent/10 px-3.5 py-2.5 text-sm font-medium text-accent transition-all active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Gönder
          </button>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
