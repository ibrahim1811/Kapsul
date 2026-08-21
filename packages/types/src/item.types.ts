import type { FirestoreTimestamp, ProcessingStatus } from "./common.types";

export type ItemType =
  | "pdf"
  | "image"
  | "document"
  | "text"
  | "url"
  | "audio"
  | "video"
  | "note";

export type ItemMetadata = {
  language?: string;
  pageCount?: number;
  dates?: string[];
  people?: string[];
  organizations?: string[];
  locations?: string[];
  amounts?: string[];
  actionItems?: string[];
};

export type Item = {
  id: string;
  userId: string;

  type: ItemType;

  title: string;
  summary?: string;

  originalFileName?: string;
  storagePath?: string;
  mimeType?: string;
  fileSize?: number;

  sourceUrl?: string;

  extractedText?: string;
  contentHash?: string;

  category?: string;
  tags: string[];
  collectionIds?: string[];

  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;

  processingStatus: ProcessingStatus;
  aiStatus: ProcessingStatus;
  processingError?: string;

  metadata?: ItemMetadata;
};

export type ItemChunk = {
  id: string;
  itemId: string;
  userId: string;
  text: string;
  pageNumber?: number;
  chunkIndex: number;
  embedding?: number[];
  createdAt: FirestoreTimestamp;
};
