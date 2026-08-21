import { getFirebaseAuth } from "@/lib/firebase";

const WORKER_URL = process.env.NEXT_PUBLIC_STORAGE_WORKER_URL ?? "";

async function authToken(): Promise<string> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Oturum bulunamadı.");
  return user.getIdToken();
}

function workerUrl(userId: string, itemId: string, fileName: string): string {
  return `${WORKER_URL}/files/${userId}/${itemId}/${encodeURIComponent(fileName)}`;
}

export function uploadFile(
  userId: string,
  itemId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    authToken()
      .then((token) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", workerUrl(userId, itemId, file.name));
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Yükleme başarısız (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Ağ hatası, yükleme başarısız."));
        xhr.send(file);
      })
      .catch(reject);
  });
}

export async function deleteFile(userId: string, itemId: string, fileName: string): Promise<void> {
  const token = await authToken();
  try {
    const res = await fetch(workerUrl(userId, itemId, fileName), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(`deleteFile: worker returned ${res.status} for ${itemId}/${fileName}`);
    }
  } catch (err) {
    console.error("deleteFile: request failed", err);
  }
}

export async function downloadFile(userId: string, itemId: string, fileName: string): Promise<Blob> {
  const token = await authToken();
  const res = await fetch(workerUrl(userId, itemId, fileName), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Dosya indirilemedi (${res.status})`);
  return res.blob();
}
