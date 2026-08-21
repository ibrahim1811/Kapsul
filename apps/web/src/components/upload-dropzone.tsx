"use client";

import { uploadItemFile } from "@/lib/items";
import { useRef, useState } from "react";

type UploadState = { fileName: string; progress: number; error?: string };

export function UploadDropzone({ userId }: { userId: string }) {
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      setUploads((prev) => [...prev, { fileName: file.name, progress: 0 }]);

      uploadItemFile(userId, file, (percent) => {
        setUploads((prev) =>
          prev.map((u) => (u.fileName === file.name ? { ...u, progress: percent } : u))
        );
      })
        .then(() => {
          setUploads((prev) => prev.filter((u) => u.fileName !== file.name));
        })
        .catch((err) => {
          setUploads((prev) =>
            prev.map((u) =>
              u.fileName === file.name ? { ...u, error: (err as Error).message } : u
            )
          );
        });
    });
  }

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
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging
            ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900"
            : "border-neutral-300 dark:border-neutral-700"
        }`}
      >
        <p className="text-sm font-medium">Dosyaları buraya sürükle veya tıkla</p>
        <p className="mt-1 text-xs text-neutral-500">PDF, görsel, ses, video, belge — maks 25MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {uploads.length > 0 && (
        <ul className="mt-3 space-y-2">
          {uploads.map((u) => (
            <li key={u.fileName} className="text-xs">
              <div className="flex justify-between">
                <span className="truncate">{u.fileName}</span>
                <span className={u.error ? "text-red-600" : "text-neutral-500"}>
                  {u.error ?? `${u.progress}%`}
                </span>
              </div>
              {!u.error && (
                <div className="mt-1 h-1 w-full rounded bg-neutral-200 dark:bg-neutral-800">
                  <div
                    className="h-1 rounded bg-neutral-900 dark:bg-white"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
