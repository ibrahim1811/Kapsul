"use client";

import type { UploadState } from "@/lib/use-file-upload";
import { useRef, useState } from "react";

export function UploadDropzone({
  uploads,
  onFiles,
}: {
  uploads: UploadState[];
  onFiles: (files: FileList | null) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed px-6 py-12 text-center backdrop-blur-sm transition-all ${
          dragging
            ? "border-accent bg-accent/5 shadow-glow"
            : "border-ink-border bg-ink-panel/40 hover:border-white/20"
        }`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-lg text-accent">
          ↑
        </span>
        <p className="text-sm font-medium text-bone">Dosyaları buraya sürükle ya da tıkla</p>
        <p className="text-xs text-bone-muted">PDF, görsel, ses, video, belge — maks 25MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <UploadProgressList uploads={uploads} />
    </div>
  );
}

export function UploadButton({
  onFiles,
}: {
  onFiles: (files: FileList | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
      >
        <span aria-hidden="true">↑</span> Yükle
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

export function UploadProgressList({ uploads }: { uploads: UploadState[] }) {
  if (uploads.length === 0) return null;
  return (
    <ul className="mt-3 space-y-2">
      {uploads.map((u) => (
        <li key={u.fileName} className="rounded-2xl border border-ink-border bg-ink-panel/60 px-4 py-2.5 text-xs">
          <div className="flex justify-between">
            <span className="truncate text-bone">{u.fileName}</span>
            <span className={u.error ? "text-red-400" : "text-bone-muted"}>
              {u.error ?? `${u.progress}%`}
            </span>
          </div>
          {!u.error && (
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-1 rounded-full bg-accent transition-all"
                style={{ width: `${u.progress}%` }}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
