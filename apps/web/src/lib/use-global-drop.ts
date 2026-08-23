"use client";

import { useEffect, useState } from "react";

export function useGlobalDrop(onDrop: (files: FileList) => void) {
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
    function handleDrop(e: DragEvent) {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer?.files?.length) onDrop(e.dataTransfer.files);
    }

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onDrop]);

  return dragging;
}
