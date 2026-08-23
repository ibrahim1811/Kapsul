"use client";

import { readDataTransfer } from "@/lib/folder-drop";
import { useEffect, useState } from "react";

export function useGlobalDrop(
  onDrop: (files: FileList) => void,
  onFolderDrop?: (folderName: string, files: File[]) => void
) {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    function handleDragOver(e: DragEvent) {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault();
      setDragging(true);
    }
    function handleDragLeave(e: DragEvent) {
      if (!e.relatedTarget) setDragging(false);
    }
    async function handleDrop(e: DragEvent) {
      e.preventDefault();
      setDragging(false);
      if (!e.dataTransfer) return;
      const { folderName, files } = await readDataTransfer(e.dataTransfer);
      if (folderName && onFolderDrop) {
        onFolderDrop(folderName, files);
      } else if (e.dataTransfer.files?.length) {
        onDrop(e.dataTransfer.files);
      }
    }

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onDrop, onFolderDrop]);

  return dragging;
}
