"use client";

import { getFirebaseFirestore } from "@/lib/firebase";
import { itemsCollectionPath } from "@kapsul/api";
import type { Item } from "@kapsul/types";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useItems(userId: string | undefined) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(getFirebaseFirestore(), itemsCollectionPath(userId)),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setItems(snapshot.docs.map((d) => d.data() as Item));
        setLoading(false);
      },
      (error) => {
        console.error("useItems: snapshot listener failed", error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [userId]);

  return { items, loading };
}
