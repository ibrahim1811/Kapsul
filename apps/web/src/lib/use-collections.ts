"use client";

import { getFirebaseFirestore } from "@/lib/firebase";
import { collectionsCollectionPath } from "@kapsul/api";
import type { Collection } from "@kapsul/types";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useCollections(userId: string | undefined) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(getFirebaseFirestore(), collectionsCollectionPath(userId)),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCollections(snapshot.docs.map((d) => d.data() as Collection));
        setLoading(false);
      },
      (error) => {
        console.error("useCollections: snapshot listener failed", error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [userId]);

  return { collections, loading };
}
