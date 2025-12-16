import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import type { FileorFolderItem, FileType } from "@/lib/file"
import { createFileAction } from "../actions/file-actions"
import { toast } from "sonner"
import { getFilesandFoldersAction } from "../actions/other-actions"
import { getFileExtension } from "./client-only-utils"

/* These utils can be used on both client and server */

// Makes it easier to merge class names conditionally
// and handle Tailwind CSS conflicts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to format dates
export const formatDate = (date: Date) => {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === now.toDateString()) {
    return "Today"
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday"
  } else {
    return format(date, "MMM d, yyyy")
  }
}
export const getFileType = (fileName: string): FileType => {
  /* This function determines the type of file based on its extension. */
  const ext = getFileExtension(fileName);
  switch (ext) {
    // Document types
    case "doc":
    case "docx":
    case "txt":
    case "md":

      return "document";

    case "pdf":
      return "pdf";

    // Image types
    case "jpg":
    case "jpeg":
    case "png":
    case "apng":
    case "svg":
    case "gif":
    case "avif":
    case "webp":
    case "tiff":
    case "tif":
    case "woff":
    case "woff2":
    case "ico":

      return "image";

    // Code types
    case "html":
    case "xhtml":
    case "css":
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
    case "py":
    case "c":
    case "h":
    case "cpp":
    case "hpp":
    case "java":
    case "rb":
    case "go":
    case "rs":
    case "php":
    case "swift":
    case "sh":
    case "json":
    case "xml":
    case "yaml":
    case "yml":
    case "sql":

      return "code";

    // Audio types
    case "aac":
    case "mp3":
    case "oga":
    case "wav":
    case "ogg":
    case "flac":
    case "m4a":
    case "weba":

      return "audio";

    // Video types
    case "mp4":
    case "mpeg":
    case "ogv":
    case "mov":
    case "avi":
    case "mkv":
    case "webm":

      return "video";

    // Sheet types
    case "xls":
    case "xlsx":
    case "csv":
    case "ods":

      return "sheet";

    // Unable to determine type
    default:
      return "other"; // Default type for unrecognized extensions
  }
};
export const convertFileSize = (size: number): string => {
  /* This function converts file size from bytes to a human-readable format. */
  // I think having 1 decimal place looks more natural
  // 2 just looks weird
  if (size < 1024) return `${size} B`;
  else if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  else if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  else return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export async function handleFileUpload(files: File[], onProgress: (file: File, progress: number) => void, onSuccess: (file: File) => void, currParentId: string | null, onError: (file: File, error: Error) => void, setCurrFiles: React.Dispatch<React.SetStateAction<FileorFolderItem[]>>) {
  try {
    const uploadPromises = files.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        // Use XMLHttpRequest for progress events
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/upload");

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              onProgress(file, progress);
            }
          };

          xhr.onload = async () => {
            if (xhr.status === 200) {
              onSuccess(file);

              await createFileAction(
                file.name,
                getFileType(file.name),
                convertFileSize(file.size),
                new Date(),
                getFileExtension(file.name),
                currParentId,
                // TODO -> Switch to using file URL from server response
                `/uploads/${file.name}`
              );

              resolve();

            } else {
              onError(file, new Error(xhr.responseText || "Upload failed"));
              reject(new Error(xhr.responseText || "Upload failed"));
            }
          };

          xhr.onerror = () => {
            onError(file, new Error("Network error"));
            reject(new Error("Network error"));
          };

          xhr.send(formData);
        });
      } catch (error) {
        onError(
          file,
          error instanceof Error ? error : new Error("Upload failed")
        );
      }
    });

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // Show success message after all uploads are done
    toast.success("File uploaded successfully!");

    // Update file list by fetching new list from server
    const newFiles = await getFilesandFoldersAction(currParentId);

    // Replace previous files with new ones
    // This ensures that the UI reflects the latest state of files
    // and folders in the current directory
    setCurrFiles(() => newFiles);


  } catch (error) {
    // This handles any error that might occur outside the individual upload processes
    console.error("Unexpected error during upload:", error);
  }
}