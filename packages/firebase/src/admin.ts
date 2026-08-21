import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let adminApp: App | undefined;

export function initFirebaseAdmin(): App {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    adminApp = initializeApp();
    return adminApp;
  }

  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: `${projectId}.appspot.com`,
  });
  return adminApp;
}

export function getAdminAuth() {
  return getAuth(initFirebaseAdmin());
}

export function getAdminFirestore() {
  return getFirestore(initFirebaseAdmin());
}

export function getAdminStorage() {
  return getStorage(initFirebaseAdmin());
}
