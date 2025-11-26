import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import type { FileItem } from "@/components/drive-view/file"

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
export const getFileType = (fileName: string): FileItem["type"] => {
  /* This function determines the type of file based on its extension. */
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    // Document types
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
    case "md":

      return "document";

    // Image types
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":

      return "image";

    // Code types
    case "html":
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
    case "json":
    case "xml":
    case "yaml":
    case "yml":
    case "sql":

      return "code";

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
