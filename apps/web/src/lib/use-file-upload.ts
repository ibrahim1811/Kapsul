"use client";

import { uploadItemFile } from "@/lib/items";
import { useCallback, useState } from "react";

export type UploadState = { fileName: string; progress: number; error?: string };

export function useFileUpload(userId: string | undefined) {
  const [uploads, setUploads] = useState<UploadState[]>([]);

  const handleFiles = useCallback(
    (files: FileList | File[] | null, collectionId?: string) => {
      if (!userId || !files) return;

      Array.from(files).forEach((file) => {
        setUploads((prev) => [...prev, { fileName: file.name, progress: 0 }]);

        uploadItemFile(
          userId,
          file,
          (percent) => {
            setUploads((prev) =>
              prev.map((u) => (u.fileName === file.name ? { ...u, progress: percent } : u))
            );
          },
          collectionId
        )
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
    },
    [userId]
  );

  return { uploads, handleFiles };
}
