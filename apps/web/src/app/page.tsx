"use client";

import { ItemCard } from "@/components/item-card";
import { ProtectedRoute } from "@/components/protected-route";
import { UploadDropzone } from "@/components/upload-dropzone";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseAuth } from "@/lib/firebase";
import { useItems } from "@/lib/use-items";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { items, loading } = useItems(user?.uid);

  async function handleSignOut() {
    await signOut(getFirebaseAuth());
    router.replace("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">KAPSÜL</h1>
          <p className="text-sm text-neutral-500">{user?.displayName || user?.email}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium dark:border-neutral-700"
        >
          Çıkış yap
        </button>
      </div>

      {user && <UploadDropzone userId={user.uid} />}

      {loading ? (
        <p className="text-sm text-neutral-500">Yükleniyor...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">Henüz öge yok. Bir dosya yükleyerek başla.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
