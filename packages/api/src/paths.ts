export function userDocPath(userId: string): string {
  return `users/${userId}`;
}

export function itemsCollectionPath(userId: string): string {
  return `users/${userId}/items`;
}

export function itemStoragePath(userId: string, itemId: string, fileName: string): string {
  return `users/${userId}/files/${itemId}/${fileName}`;
}

export function itemChunksCollectionPath(userId: string, itemId: string): string {
  return `users/${userId}/items/${itemId}/chunks`;
}

export function tagsCollectionPath(userId: string): string {
  return `users/${userId}/tags`;
}

export function collectionsCollectionPath(userId: string): string {
  return `users/${userId}/collections`;
}

export function conversationsCollectionPath(userId: string): string {
  return `users/${userId}/conversations`;
}

export function messagesCollectionPath(userId: string, conversationId: string): string {
  return `users/${userId}/conversations/${conversationId}/messages`;
}

export function tasksCollectionPath(userId: string): string {
  return `users/${userId}/tasks`;
}

export function entitiesCollectionPath(userId: string): string {
  return `users/${userId}/entities`;
}

export function relationshipsCollectionPath(userId: string): string {
  return `users/${userId}/relationships`;
}
