import type { FirestoreTimestamp } from "./common.types";

export type Citation = {
  itemId: string;
  itemTitle: string;
  pageNumber?: number;
  chunkId?: string;
};

export type Conversation = {
  id: string;
  userId: string;
  title: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

export type MessageRole = "user" | "assistant";

export type Message = {
  id: string;
  conversationId: string;
  userId: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  createdAt: FirestoreTimestamp;
};
