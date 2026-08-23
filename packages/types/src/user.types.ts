import type { FirestoreTimestamp } from "./common.types";

export type ThemePreference = "light" | "dark" | "system";
export type LocalePreference = "tr" | "en";

export type UserProfile = {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  themePreference: ThemePreference;
  localePreference: LocalePreference;
  autoFolderEnabled?: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};
