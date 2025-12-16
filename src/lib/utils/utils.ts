import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import type { FileType } from "@/lib/file"
import mime from "mime"

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
    // This returns the date according to the user's local time zone
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

export const getFileExtension = (fileName: string): string => {
    /***
     * @param fileName - The name of the file (e.g., "document.pdf")
     * This function extracts the file extension from a given file name. If the file name does not have a period, it returns an empty string.
     * This manually handles the ".tar.gz" case to return "tar.gz" as the extension.
     * extname does not handle this case correctly, so use this function on the server side as well.
     * @returns The file extension (e.g., "pdf"). If no extension is found, returns an empty string.
     ***/
    const hasPeriod = fileName.includes(".");
    const hasTarGz = fileName.toLowerCase().endsWith(".tar.gz");
    if (hasTarGz) {
        return "tar.gz";
    }
    else if (!hasPeriod) {
        return "";
    }
    else {
        // Convert to lowercase just in case
        return fileName.split(".").pop()?.toLowerCase() ?? "";
    }
};

export const getMimeType = (extension: string): string => {
    /***
     * @param extension - The file extension (e.g., "pdf")
     * This function returns the MIME type based on the file extension.
     * @returns The corresponding MIME type as a string. If the extension is unrecognized, returns "application/octet-stream".
     ***/

    const potentialType = mime.getType(extension);
    if (potentialType === null) {
        return "application/octet-stream";
    }
    else {
      return potentialType;
    }
};