
// File types
export type FileorFolderType = "folder" | "pdf" | "image" | "document" | "code" | "other"
export type FileType = "pdf" | "image" | "document" | "code" | "other"
export type FolderType = "folder"

// File interface
export interface FileorFolderItem {
  id: string
  name: string
  type: FileorFolderType
  size: string
  items?: number
  modified: Date
  path: string[]
}

// File and folder item interfaces
export interface FileItem extends FileorFolderItem {
  type: Exclude<FileorFolderType, "folder">
}

export interface FolderItem extends FileorFolderItem {
  type: "folder"
}