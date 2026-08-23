import { getFirebaseFirestore } from "@/lib/firebase";
import { userDocPath } from "@kapsul/api";
import type { UserProfile } from "@kapsul/types";
import { type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

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

export async function updateUserProfile(
  userId: string,
  patch: Partial<Pick<UserProfile, "localePreference" | "themePreference" | "autoFolderEnabled">>
): Promise<void> {
  const ref = doc(getFirebaseFirestore(), userDocPath(userId));
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}
