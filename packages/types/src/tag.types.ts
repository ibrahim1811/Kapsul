import type { FirestoreTimestamp } from "./common.types";

export type Tag = {
  id: string;
  userId: string;
  name: string;
  itemCount: number;
  createdBy: "user" | "ai";
  createdAt: FirestoreTimestamp;
};

export type Collection = {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  description?: string;
  itemCount: number;
  createdBy: "user" | "ai";
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};
