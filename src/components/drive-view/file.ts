
// File types
export type FileType = "folder" | "pdf" | "image" | "document" | "code" | "other"

// File interface
export interface FileItem {
  id: string
  name: string
  type: FileType
  size: string
  items?: number
  modified: Date
  path: string[]
}