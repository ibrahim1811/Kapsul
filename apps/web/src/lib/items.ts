import { triggerItemProcessing } from "@/lib/ai-worker";
import { inferItemType } from "@/lib/item-type";
import { getFirebaseFirestore } from "@/lib/firebase";
import { deleteFile, uploadFile } from "@/lib/storage-worker";
import { itemStoragePath, itemsCollectionPath } from "@kapsul/api";
import type { Item } from "@kapsul/types";
import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function stripExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx > 0 ? fileName.slice(0, idx) : fileName;
}

export async function uploadItemFile(
  userId: string,
  file: File,
  onProgress?: (percent: number) => void,
  collectionId?: string
): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Dosya çok büyük (maks ${MAX_UPLOAD_BYTES / 1024 / 1024}MB).`);
  }

  const firestore = getFirebaseFirestore();
  const itemRef = doc(collection(firestore, itemsCollectionPath(userId)));

  await uploadFile(userId, itemRef.id, file, onProgress);

  const item: Omit<Item, "createdAt" | "updatedAt"> = {
    id: itemRef.id,
    userId,
    type: inferItemType(file.type),
    title: stripExtension(file.name),
    originalFileName: file.name,
    storagePath: itemStoragePath(userId, itemRef.id, file.name),
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
    collectionIds: collectionId ? [collectionId] : [],
    tags: [],
    processingStatus: "pending",
    aiStatus: "pending",
  };
  await setDoc(itemRef, {
    ...item,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  void triggerItemProcessing(itemRef.id);
  return itemRef.id;
}

export async function updateItem(
  userId: string,
  itemId: string,
  data: Partial<Pick<Item, "title" | "tags" | "category">>
): Promise<void> {
  const ref = doc(getFirebaseFirestore(), itemsCollectionPath(userId), itemId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteItem(
  userId: string,
  itemId: string,
  originalFileName?: string
): Promise<void> {
  if (originalFileName) {
    await deleteFile(userId, itemId, originalFileName);
  }
  await deleteDoc(doc(getFirebaseFirestore(), itemsCollectionPath(userId), itemId));
}

export async function deleteItems(userId: string, items: Pick<Item, "id" | "originalFileName">[]): Promise<void> {
  await Promise.all(items.map((item) => deleteItem(userId, item.id, item.originalFileName)));
}
