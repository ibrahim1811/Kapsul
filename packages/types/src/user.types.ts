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
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};
