"use client";

import { groupByRelativePathRoot, readDataTransfer } from "@/lib/folder-drop";
import type { UploadState } from "@/lib/use-file-upload";
import { useRef, useState } from "react";

type DirectoryInputProps = { webkitdirectory?: string; directory?: string };

export function UploadDropzone({
  uploads,
  onFiles,
  onFolderFiles,
}: {
  uploads: UploadState[];
  onFiles: (files: FileList | null) => void;
  onFolderFiles?: (folderName: string, files: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragging(false);
          const { folderName, files } = await readDataTransfer(e.dataTransfer);
          if (folderName && onFolderFiles) {
            onFolderFiles(folderName, files);
          } else {
            onFiles(e.dataTransfer.files);
          }
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
        <p className="text-sm font-medium text-bone">Dosyaları ya da bir klasörü buraya sürükle</p>
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

      {onFolderFiles && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            folderInputRef.current?.click();
          }}
          className="mt-2 text-xs text-bone-muted underline-offset-2 hover:text-bone hover:underline"
        >
          veya bir klasör seç
        </button>
      )}
      {onFolderFiles && (
        <input
          ref={folderInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (!e.target.files) return;
            const { folderName, files } = groupByRelativePathRoot(e.target.files);
            if (folderName) onFolderFiles(folderName, files);
            e.target.value = "";
          }}
          {...({ webkitdirectory: "", directory: "" } as DirectoryInputProps)}
        />
      )}

      <UploadProgressList uploads={uploads} />
    </div>
  );
}

export function UploadButton({
  onFiles,
  onFolderFiles,
}: {
  onFiles: (files: FileList | null) => void;
  onFolderFiles?: (folderName: string, files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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
      {onFolderFiles && (
        <>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-ink-border px-4 py-2 text-sm font-medium text-bone-muted transition-colors hover:border-white/20 hover:text-bone"
          >
            <span aria-hidden="true">📁</span> Klasör Yükle
          </button>
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (!e.target.files) return;
              const { folderName, files } = groupByRelativePathRoot(e.target.files);
              if (folderName) onFolderFiles(folderName, files);
              e.target.value = "";
            }}
            {...({ webkitdirectory: "", directory: "" } as DirectoryInputProps)}
          />
        </>
      )}
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
