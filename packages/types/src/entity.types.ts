import type { FirestoreTimestamp } from "./common.types";

export type EntityType = "person" | "organization" | "location" | "date" | "amount";

export type Entity = {
  id: string;
  userId: string;
  type: EntityType;
  value: string;
  itemIds: string[];
  createdAt: FirestoreTimestamp;
};

export type RelationshipType = "related" | "references" | "duplicate" | "same-topic" | "derived-from";

export type Relationship = {
  id: string;
  userId: string;
  fromItemId: string;
  toItemId: string;
  type: RelationshipType;
  confidence?: number;
  createdAt: FirestoreTimestamp;
};
