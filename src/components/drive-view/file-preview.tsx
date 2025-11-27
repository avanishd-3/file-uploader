import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEffect, useState, type JSX } from "react"
import { ImageIcon,
    FileIcon as FilePDF,
    FileText
} from "lucide-react"
import type { FileItem, FileorFolderItem, FileorFolderType } from "../../lib/file"

import Image from "next/image"
import { AudioPlayerButton, AudioPlayerDuration, AudioPlayerProgress, AudioPlayerProvider, AudioPlayerSpeed, AudioPlayerTime } from "../ui/audio-player"

import { checkFileExistsAction } from "@/lib/actions/other-actions";

export function FilePreview({  previewModalOpen,
  setPreviewModalOpen, activeFile, formatDate, getFileIcon } : {
  previewModalOpen: boolean,
  setPreviewModalOpen: (open: boolean) => void,
  activeFile: FileorFolderItem | null,
  formatDate: (date: Date) => string,
  getFileIcon: (type: FileorFolderType) => JSX.Element
}) {

  // This should only be used if activeFile is an audio file
  const track = {
    id: activeFile?.id || "track-1",
    src: activeFile && (activeFile as FileItem).url ? (activeFile as FileItem).url : "",
    data: { title: activeFile?.name || "Unknown", artist: "Unknown" },
  }

  const [fileExists, setFileExists] = useState(true);

  // Check if file exists for preview
  useEffect(() => {
    const checkFileExists = async () => {
      if (activeFile) {
        const exists = await checkFileExistsAction((activeFile as FileItem).url);
        setFileExists(exists);
      }
    };

    checkFileExists();
  }, [activeFile]);


    return (
        <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
          <DialogContent className="sm:max-w-[600px] md:max-w-[95vh] md:min-h-[60vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {getFileIcon(activeFile?.type ?? "other")}
                <span className="ml-2">{activeFile?.name}</span>
              </DialogTitle>
            </DialogHeader>

            {activeFile?.type === "image" ? (
              // Need relative here or image will fill the grandparent div
              <div className="w-full h-[60vh] bg-muted rounded-md flex items-center justify-center relative overflow-hidden">
                {fileExists ? (
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
                  className="rounded-md"
                />
                ) : (
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
            ) : activeFile?.type === "pdf" ? (
              <div className="w-full h-[60vh] bg-muted rounded-md flex items-center justify-center">
                {!fileExists ? (
                  // Fallback PDF icon
                  <>
                    <FilePDF className="h-16 w-16 text-red-500" />
                    <span className="sr-only">PDF preview</span>
                  </>
                  
                ) : (
                  <iframe src={activeFile.url} className="w-full h-full"/>
                )}
                
              </div>
            ) : activeFile?.type === "audio" ? (
              <AudioPlayerProvider>
                <div className="flex items-center gap-4">
                  <AudioPlayerButton item={track} />
                  <AudioPlayerTime />
                  <AudioPlayerProgress className="flex-1" />
                  <AudioPlayerDuration />
                  <AudioPlayerSpeed />
                </div>  
              </AudioPlayerProvider>
            ): (
              <div className="w-full h-[60vh] bg-muted rounded-md flex items-center justify-center">
                {!fileExists ? (
                  // Fallback file icon
                  <>
                    <FileText className="h-16 w-16 text-muted-foreground" />
                  </>
                ) : (
                  <iframe src={(activeFile as FileItem)?.url} className="w-full h-full"/>
                )}
                
              </div>
            )}

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