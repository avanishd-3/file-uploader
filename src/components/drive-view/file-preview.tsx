import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { JSX } from "react"
import { ImageIcon,
    FileIcon as FilePDF,
    FileText
} from "lucide-react"
import type { FileorFolderItem, FileorFolderType } from "./file"


export function FilePreview({  previewModalOpen,
  setPreviewModalOpen, activeFile, formatDate, getFileIcon } : {
  previewModalOpen: boolean,
  setPreviewModalOpen: (open: boolean) => void,
  activeFile: FileorFolderItem | null,
  formatDate: (date: Date) => string,
  getFileIcon: (type: FileorFolderType) => JSX.Element
}) {
    return (
        <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {getFileIcon(activeFile?.type || "other")}
              <span className="ml-2">{activeFile?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-4 min-h-[300px]">
            {activeFile?.type === "image" ? (
              <div className="w-full h-[300px] bg-muted rounded-md flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
                <span className="sr-only">Image preview</span>
              </div>
            ) : activeFile?.type === "pdf" ? (
              <div className="w-full h-[300px] bg-muted rounded-md flex items-center justify-center">
                <FilePDF className="h-16 w-16 text-red-500" />
                <span className="sr-only">PDF preview</span>
              </div>
            ) : (
              <div className="w-full h-[300px] bg-muted rounded-md flex items-center justify-center">
                <FileText className="h-16 w-16 text-muted-foreground" />
                <span className="sr-only">File preview</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div>
              <Badge variant="outline" className="mr-2">
                {activeFile?.size || "Unknown size"}
              </Badge>
              <Badge variant="outline">{formatDate(activeFile?.modified || new Date())}</Badge>
            </div>

            <Button onClick={() => setPreviewModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
}