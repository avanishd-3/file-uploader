import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import type { FileType } from "@/lib/file"
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