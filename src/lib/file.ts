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
  type: "pdf" | "image" | "document" | "code" | "audio" | "video" | "other"
  size: string
  modified: Date
  parentId: string | null
  url: string // URL to access the file
}

export type FileorFolderType = FileItem["type"] | FolderItem["type"]
export type FileorFolderItem = FileItem | FolderItem

export type FileType = FileItem["type"]