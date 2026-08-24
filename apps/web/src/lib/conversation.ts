"use client";

import { askKapsul, searchItemsWithAI } from "@/lib/ai-worker";
import { getFirebaseFirestore } from "@/lib/firebase";
import { conversationsCollectionPath, messagesCollectionPath } from "@kapsul/api";
import type { Citation, Item, Message, SearchableItem } from "@kapsul/types";
import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

const CONTEXT_ITEM_LIMIT = 5;
const CONTEXT_CHAR_LIMIT_PER_ITEM = 6000;
const FALLBACK_ANSWER = "Kaydettiğin içeriklerde bu soruyu kesin olarak cevaplayacak yeterli bilgi bulamadım.";

export type AskStage = "idle" | "searching" | "answering";

export function useKapsulSohbet(userId: string | undefined) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stage, setStage] = useState<AskStage>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(getFirebaseFirestore(), conversationsCollectionPath(userId)),
      orderBy("createdAt", "asc"),
      limit(1)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConversationId(snapshot.docs[0]?.id ?? null);
    });
    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    if (!userId || !conversationId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(getFirebaseFirestore(), messagesCollectionPath(userId, conversationId)),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((d) => d.data() as Message));
    });
    return unsubscribe;
  }, [userId, conversationId]);

  async function ensureConversation(uid: string): Promise<string> {
    if (conversationId) return conversationId;
    const firestore = getFirebaseFirestore();
    const ref = doc(collection(firestore, conversationsCollectionPath(uid)));
    await setDoc(ref, {
      id: ref.id,
      userId: uid,
      title: "Kapsül'e Sor",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setConversationId(ref.id);
    return ref.id;
  }

  async function sendMessage(question: string, scopedItems: Item[]) {
    const trimmed = question.trim();
    if (!userId || !trimmed) return;
    setError(null);

    const convId = await ensureConversation(userId);
    const firestore = getFirebaseFirestore();

    const userMsgRef = doc(collection(firestore, messagesCollectionPath(userId, convId)));
    await setDoc(userMsgRef, {
      id: userMsgRef.id,
      conversationId: convId,
      userId,
      role: "user",
      content: trimmed,
      createdAt: serverTimestamp(),
    });

    try {
      setStage("searching");
      const searchable: SearchableItem[] = scopedItems.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        category: item.category,
        tags: item.tags,
        people: item.metadata?.people,
        organizations: item.metadata?.organizations,
        locations: item.metadata?.locations,
        amounts: item.metadata?.amounts,
        actionItems: item.metadata?.actionItems,
      }));
      const matches = await searchItemsWithAI(trimmed, searchable);
      const topMatches = matches
        .slice(0, CONTEXT_ITEM_LIMIT)
        .map((id) => scopedItems.find((item) => item.id === id))
        .filter((item): item is Item => Boolean(item));

      let answer: string;
      let citations: Citation[] = [];

      if (topMatches.length === 0) {
        answer = FALLBACK_ANSWER;
      } else {
        setStage("answering");
        const context = topMatches
          .map(
            (item) =>
              `### ${item.title}\n${(item.extractedText || item.summary || "").slice(0, CONTEXT_CHAR_LIMIT_PER_ITEM)}`
          )
          .join("\n\n---\n\n");
        answer = await askKapsul(trimmed, context);
        citations = topMatches.map((item) => ({ itemId: item.id, itemTitle: item.title }));
      }

      const assistantMsgRef = doc(collection(firestore, messagesCollectionPath(userId, convId)));
      await setDoc(assistantMsgRef, {
        id: assistantMsgRef.id,
        conversationId: convId,
        userId,
        role: "assistant",
        content: answer,
        ...(citations.length ? { citations } : {}),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kapsül'e Sor şu an yanıt veremedi.");
    } finally {
      setStage("idle");
    }
  }

  return { messages, stage, error, sendMessage };
}
