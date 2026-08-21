import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";
import { type FirebaseStorage, getStorage } from "firebase/storage";

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;
let storageInstance: FirebaseStorage | undefined;

export function initFirebaseClient(config: FirebaseClientConfig): FirebaseApp {
  if (getApps().length === 0) {
    app = initializeApp(config);
  }
  return app!;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    if (!app) throw new Error("Firebase client not initialized. Call initFirebaseClient first.");
    authInstance = getAuth(app);
  }
  return authInstance;
}

export function getFirebaseFirestore(): Firestore {
  if (!firestoreInstance) {
    if (!app) throw new Error("Firebase client not initialized. Call initFirebaseClient first.");
    firestoreInstance = getFirestore(app);
  }
  return firestoreInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    if (!app) throw new Error("Firebase client not initialized. Call initFirebaseClient first.");
    storageInstance = getStorage(app);
  }
  return storageInstance;
}
