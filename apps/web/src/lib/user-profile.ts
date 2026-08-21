import { getFirebaseFirestore } from "@/lib/firebase";
import { userDocPath } from "@kapsul/api";
import type { UserProfile } from "@kapsul/types";
import { type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export async function ensureUserProfile(user: User): Promise<void> {
  const ref = doc(getFirebaseFirestore(), userDocPath(user.uid));
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) return;

  const profile: Omit<UserProfile, "createdAt" | "updatedAt"> = {
    id: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? undefined,
    photoURL: user.photoURL ?? undefined,
    themePreference: "system",
    localePreference: "tr",
  };

  await setDoc(ref, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
