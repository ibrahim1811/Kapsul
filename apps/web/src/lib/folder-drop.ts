export type DroppedFiles = { folderName: string | null; files: File[] };

function readEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
}

async function collectFilesFromEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return [
      await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject)
      ),
    ];
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const files: File[] = [];
    let batch: FileSystemEntry[];
    do {
      batch = await readEntries(reader);
      for (const child of batch) {
        files.push(...(await collectFilesFromEntry(child)));
      }
    } while (batch.length > 0);
    return files;
  }
  return [];
}

export async function readDataTransfer(dataTransfer: DataTransfer): Promise<DroppedFiles> {
  const items = dataTransfer.items;
  const entries = items
    ? Array.from(items)
        .map((item) => item.webkitGetAsEntry?.())
        .filter((e): e is FileSystemEntry => !!e)
    : [];

  const dirEntry = entries.find((e) => e.isDirectory);
  if (!dirEntry) {
    return { folderName: null, files: Array.from(dataTransfer.files ?? []) };
  }

  const files = await collectFilesFromEntry(dirEntry);
  return { folderName: dirEntry.name, files };
}

export function groupByRelativePathRoot(files: FileList): DroppedFiles {
  const list = Array.from(files);
  const first = list[0] as (File & { webkitRelativePath?: string }) | undefined;
  const relPath = first?.webkitRelativePath;
  if (!relPath) return { folderName: null, files: list };
  return { folderName: relPath.split("/")[0] ?? null, files: list };
}
