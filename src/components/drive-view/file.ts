// Folder type
export interface FolderItem {
  id: string
  name: string
  type: "folder" // So can get proper icon
  items: number
  modified: Date
  parentId: string | null
}

// File type
export interface FileItem {
  id: string
  name: string
  type: "pdf" | "image" | "document" | "code" | "other"
  size: string
  modified: Date
  parentId: string | null
}

export type FileorFolderType = FileItem["type"] | FolderItem["type"]
export type FileorFolderItem = FileItem | FolderItem