import { getFirebaseFirestore } from "@/lib/firebase";
import { collectionsCollectionPath, itemsCollectionPath } from "@kapsul/api";
import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
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

export async function renameCollection(
  userId: string,
  collectionId: string,
  name: string
): Promise<void> {
  const ref = doc(getFirebaseFirestore(), collectionsCollectionPath(userId), collectionId);
  await updateDoc(ref, { name, updatedAt: serverTimestamp() });
}

export async function deleteCollection(userId: string, collectionId: string): Promise<void> {
  const firestore = getFirebaseFirestore();

  const affectedItems = await getDocs(
    query(
      collection(firestore, itemsCollectionPath(userId)),
      where("collectionIds", "array-contains", collectionId)
    )
  );
  const batch = writeBatch(firestore);
  for (const itemDoc of affectedItems.docs) {
    batch.update(itemDoc.ref, { collectionIds: arrayRemove(collectionId), updatedAt: serverTimestamp() });
  }
  batch.delete(doc(firestore, collectionsCollectionPath(userId), collectionId));
  await batch.commit();
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

export async function moveItemsToCollection(
  userId: string,
  itemIds: string[],
  collectionId: string | null
): Promise<void> {
  const firestore = getFirebaseFirestore();
  const batch = writeBatch(firestore);
  for (const itemId of itemIds) {
    batch.update(doc(firestore, itemsCollectionPath(userId), itemId), {
      collectionIds: collectionId ? [collectionId] : [],
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}
