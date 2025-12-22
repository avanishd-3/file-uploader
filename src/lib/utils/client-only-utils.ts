/* Utils that can only run on client side */
/* They all rely on browser APIs, like window */

import { toast } from "sonner";

export async function downloadFileClient(file_info: string, uri = "/api/downloadFile") {
  /**
   * Client-side function to download a file from the server.
   * @param file_info - The path or identifier of the file to download. For folders, this is the folder name. For files, 
   * this is the file URL.
   * @param uri - The API endpoint to fetch the file from. Defaults to "/api/downloadFile". For folders, use "/api/downloadFolder".
   */

  // See: https://www.geeksforgeeks.org/reactjs/how-to-implement-file-download-in-nextjs-using-an-api-route/
  await fetch(uri + "?path=" + encodeURIComponent(file_info)).then(async res => { // Path is a misnomer for folder, but it keeps consistency
    if (!res.ok) {
      toast.error("Failed to download file.");
      return;
    }
    const responseBlob = await res.blob();

    // Create a temporary anchor element to trigger the download
    const url = window.URL.createObjectURL(new Blob([responseBlob.slice()], { type: responseBlob.type }));
    const link = document.createElement('a');

    link.href = url;

    // Set filename received in response
    const downloadFileName = file_info.split('/').pop() ?? 'downloaded_file';
    link.setAttribute('download', downloadFileName);

    // Append to the document and trigger click
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    });
}

export type TraversedEntry = 
  | { type: "file"; file: File; relativePath: string }
  | { type: "folder"; relativePath: string };


export async function traverseLocalFileTreeWithFolders(
  item: FileSystemEntry | null, 
  path = ""
): Promise<TraversedEntry[]> {
  /**
   * @param item - The FileSystemEntry to traverse.
   * @param path - The current path prefix for the entry.
   * @description Traverses a local file tree starting from the given FileSystemEntry using BFS.
   * @returns A promise that resolves to an array of TraversedEntry objects representing files and folders and their relative paths.
   */
  if (!item) return [];

  const queue: Array<{ entry: FileSystemEntry; path: string }> = [{ entry: item, path }];
  const result: TraversedEntry[] = [];

  while (queue.length > 0) {
    const { entry, path: currentPath } = queue.shift()!;

    if (entry.isFile) {
      const file = await new Promise<File>((resolve) => {
        (entry as FileSystemFileEntry).file((file: File) => resolve(file));
      });
      result.push({ type: "file", file, relativePath: currentPath + file.name });
    } else if (entry.isDirectory) {
      result.push({ type: "folder", relativePath: currentPath + entry.name + "/" });

      const entries: FileSystemEntry[] = await new Promise((resolve) => {
        (entry as FileSystemDirectoryEntry).createReader().readEntries((entries: FileSystemEntry[]) => resolve(entries));
      });
      for (const child of entries) {
        queue.push({ entry: child, path: currentPath + entry.name + "/" });
      }
    }
  }

  return result;
}