import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, type JSX } from "react"
import { ImageIcon,
    FileIcon as FilePDF,
    FileText
} from "lucide-react"
import type { FileItem, FileorFolderItem, FileorFolderType } from "./file"

import Image from "next/image"


export function FilePreview({  previewModalOpen,
  setPreviewModalOpen, activeFile, formatDate, getFileIcon } : {
  previewModalOpen: boolean,
  setPreviewModalOpen: (open: boolean) => void,
  activeFile: FileorFolderItem | null,
  formatDate: (date: Date) => string,
  getFileIcon: (type: FileorFolderType) => JSX.Element
}) {

  const [imagePreviewError, setImagePreviewError] = useState(false)

    return (
        <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {getFileIcon(activeFile?.type ?? "other")}
              <span className="ml-2">{activeFile?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-4 min-h-[300px]">
            {activeFile?.type === "image" ? (
              // Need relative here or image will fill the grandparent div
              <div className="w-full h-[300px] bg-muted rounded-md flex items-center justify-center relative overflow-hidden">
                {!imagePreviewError ? (
                  <Image
                  src={activeFile.url}
                  alt={activeFile.name}
                  fill
                  sizes="(min-width: 808px) 50vw, 100vw"
                  style={{
                    // The image will be scaled down to fit the container and preserve aspect ratio.
                    // See: https://nextjs.org/docs/app/api-reference/components/image#other-props
                    objectFit: 'contain', 
                  }}
                  onError={() => setImagePreviewError(true)} // Diplay image icon if image fails to load
                  className="rounded-md"
                />
                ) : (
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
            ) : activeFile?.type === "pdf" ? (
              // TODO -> Add PDF preview support
              // Tried using react-pdf but couldn't get onDocumentLoadSuccess to work
              // React PDF sample for Next.js App Router: https://github.com/wojtekmaj/react-pdf/tree/main/sample/next-app
              // This doesn't work
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
                {/* Active File can be null, so leave the question or there will be runtime error */}
                {(activeFile as FileItem)?.size || "Unknown size"}
              </Badge>
              <Badge variant="outline">{formatDate(activeFile?.modified ?? new Date())}</Badge>
            </div>

            <Button onClick={() => setPreviewModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
}