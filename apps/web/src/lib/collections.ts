import { getFirebaseFirestore } from "@/lib/firebase";
import { collectionsCollectionPath, itemsCollectionPath } from "@kapsul/api";
import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export async function createCollection(userId: string, name: string): Promise<string> {
  const firestore = getFirebaseFirestore();
  const ref = doc(collection(firestore, collectionsCollectionPath(userId)));
  await setDoc(ref, {
    id: ref.id,
    userId,
    name,
    itemCount: 0,
    createdBy: "user",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteCollection(userId: string, collectionId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseFirestore(), collectionsCollectionPath(userId), collectionId));
}

export async function moveItemToCollection(
  userId: string,
  itemId: string,
  collectionId: string | null
): Promise<void> {
  const ref = doc(getFirebaseFirestore(), itemsCollectionPath(userId), itemId);
  await updateDoc(ref, {
    collectionIds: collectionId ? [collectionId] : [],
    updatedAt: serverTimestamp(),
  });
}
