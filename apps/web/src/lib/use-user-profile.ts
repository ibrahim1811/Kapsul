"use client";

import { getFirebaseFirestore } from "@/lib/firebase";
import { userDocPath } from "@kapsul/api";
import type { UserProfile } from "@kapsul/types";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    if (!userId) return;
    const ref = doc(getFirebaseFirestore(), userDocPath(userId));
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
      },
      (error) => {
        console.error("useUserProfile: snapshot listener failed", error);
        setProfile(null);
      }
    );
    return unsubscribe;
  }, [userId]);

  return profile;
}
