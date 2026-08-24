"use client";

import { useKapsulSohbet } from "@/lib/conversation";
import type { Collection, Item } from "@kapsul/types";
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
  const { messages, stage, error, sendMessage } = useKapsulSohbet(userId);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scopedItems = useMemo(
    () => (scopeId ? items.filter((item) => item.collectionIds?.includes(scopeId)) : items),
    [items, scopeId]
  );

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, stage]);

  if (!open) return null;

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || stage !== "idle") return;
    setInput("");
    sendMessage(trimmed, scopedItems);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-full w-full max-w-md animate-slide-in-right flex-col border-l border-ink-border bg-ink-soft">
        <div className="flex items-center justify-between border-b border-ink-border px-4 py-3.5">
          <h2 className="text-sm font-semibold text-bone">✦ Kapsül'e Sor</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg px-2 py-1 text-bone-muted transition-colors hover:text-bone active:scale-[0.9]"
          >
            ✕
          </button>
        </div>

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
                  {renderWithBold(message.content)}
                </div>
                {message.citations && message.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {message.citations.map((c) => (
                      <span
                        key={c.itemId}
                        className="rounded-full border border-ink-border px-2 py-0.5 text-[10px] text-bone-muted/80"
                      >
                        📎 {c.itemTitle}
                      </span>
                    ))}
                  </div>
                )}
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
  );
}
