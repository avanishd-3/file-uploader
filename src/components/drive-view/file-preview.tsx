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
    FileText,
    File
} from "lucide-react"
import type { FileItem, FileorFolderItem, FileorFolderType } from "../../lib/file"

import Image from "next/image"
import { checkFileExistsAction } from "@/lib/actions/other-actions";
import { MediaPlayer, MediaPlayerAudio, MediaPlayerControls, MediaPlayerLoop, MediaPlayerPlay, MediaPlayerPlaybackSpeed, MediaPlayerSeek, MediaPlayerSeekBackward, MediaPlayerSeekForward, MediaPlayerVolume } from "../ui/media-player"


// Note: If an iframe fails to render something that exists, it will download it instead.
export function FilePreview({  previewModalOpen,
  setPreviewModalOpen, activeFile, formatDate, getFileIcon } : {
  previewModalOpen: boolean,
  setPreviewModalOpen: (open: boolean) => void,
  activeFile: FileorFolderItem | null,
  formatDate: (date: Date) => string,
  getFileIcon: (type: FileorFolderType) => JSX.Element
}) {

  // This should only be used if activeFile is an audio file
  const activeFileUrl = activeFile && (activeFile as FileItem).url ? (activeFile as FileItem).url : ""

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
                  </>
                  
                ) : (
                  <iframe src={activeFile.url} className="w-full h-full"/>
                )}
                
              </div>
            ) : activeFile?.type === "audio" ? (
              <MediaPlayer className="h-20">
                <MediaPlayerAudio className="sr-only">
                  <source src={activeFileUrl} type="audio/mp3" />
                </MediaPlayerAudio>
                <MediaPlayerControls className="flex-col items-start gap-2.5">
                  <MediaPlayerSeek withTime />
                  <div className="flex w-full items-center justify-center gap-2">
                    <MediaPlayerSeekBackward />
                    <MediaPlayerPlay />
                    <MediaPlayerSeekForward />
                    <MediaPlayerVolume />
                    <MediaPlayerPlaybackSpeed />
                    <MediaPlayerLoop />
                  </div>
                </MediaPlayerControls>
              </MediaPlayer>
            ): activeFile?.type === "document" ? (
              <div className="w-full h-[60vh] bg-muted rounded-md flex items-center justify-center">
                {/* TODO: Add docx preview support. Currently, the iframe will download the file instead */}
                {!fileExists || activeFile.url.split('.').pop() === "docx" ? (
                  // Fallback file icon
                  <>
                    <FileText className="h-16 w-16 text-muted-foreground" />
                  </>
                ) : (
                  <iframe src={(activeFile as FileItem)?.url} className="w-full h-full"/>
                )}
                
              </div>
            ) : (
                <div className="w-full h-[60vh] bg-muted rounded-md flex items-center justify-center">
                  <File className="h-16 w-16 text-gray-500" />
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