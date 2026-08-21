"use client";

import { getFirebaseFirestore } from "@/lib/firebase";
import { itemsCollectionPath } from "@kapsul/api";
import type { Item } from "@kapsul/types";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useItem(userId: string | undefined, itemId: string) {
  const [item, setItem] = useState<Item | null | undefined>(undefined);

  useEffect(() => {
    if (!userId) return;
    const ref = doc(getFirebaseFirestore(), itemsCollectionPath(userId), itemId);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setItem(snapshot.exists() ? (snapshot.data() as Item) : null);
      },
      (error) => {
        console.error("useItem: snapshot listener failed", error);
        setItem(null);
      }
    );
    return unsubscribe;
  }, [userId, itemId]);

  return item;
}
