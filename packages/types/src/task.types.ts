import type { FirestoreTimestamp } from "./common.types";

export type TaskStatus = "open" | "done" | "cancelled";

export type Task = {
  id: string;
  userId: string;
  title: string;
  dueDate?: FirestoreTimestamp;
  status: TaskStatus;
  sourceItemId?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};
