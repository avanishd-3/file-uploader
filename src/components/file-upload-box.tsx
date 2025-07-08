"use client";
 
import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  type FileUploadProps,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Upload, X } from "lucide-react";
import * as React from "react";
import { toast, Toaster } from "sonner";
import type { FileItem, FileorFolderItem } from "./drive-view/file";
import type { Dispatch, SetStateAction } from "react";
import { createFileAction, getFilesandFoldersAction } from "@/lib/actions";

const getFileType = (fileName: string): FileItem["type"] => {
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

      return "code";

    // Unable to determine type
    default:
      return "other"; // Default type for unrecognized extensions
  }
}

const convertFileSize = (size: number): string => {
  /* This function converts file size from bytes to a human-readable format. */

  // I think having 1 decimal place looks more natural
  // 2 just looks weird
  if (size < 1024) return `${size} B`;
  else if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  else if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  else return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
 
export const FileUploadBox = ({
  setCurrFiles,
  currParentId
}: {
  setCurrFiles: Dispatch<SetStateAction<FileorFolderItem[]>>
  currParentId: string | null;
}) => {
  const [files, setFiles] = React.useState<File[]>([]);

  // This function handles the file upload process
 
  const onUpload: NonNullable<FileUploadProps["onUpload"]> = React.useCallback(
    async (files, { onProgress, onSuccess, onError }) => {
      try {
        // Process each file individually
        const uploadPromises = files.map(async (file) => {
          try {
            const formData = new FormData();
            formData.append("file", file);

            // Use XMLHttpRequest for progress events
            await new Promise<void>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open("POST", "/api/upload");

              xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                  const progress = (event.loaded / event.total) * 100;
                  onProgress(file, progress);
                }
              };

              xhr.onload = async () => {
                if (xhr.status === 200) {
                  onSuccess(file);
                  
                  await createFileAction(
                    file.name,
                    getFileType(file.name),
                    convertFileSize(file.size),
                    new Date(),
                    currParentId,
                    // TODO -> Switch to using file URL from server response
                    `/uploads/${file.name}`, // Assumes file is saved in the public/uploads directory
                  )

                  resolve();

                } else {
                  onError(file, new Error(xhr.responseText || "Upload failed"));
                  reject(new Error(xhr.responseText || "Upload failed"));
                }
              };

              xhr.onerror = () => {
                onError(file, new Error("Network error"));
                reject(new Error("Network error"));
              };

              xhr.send(formData);
            });
          } catch (error) {
            onError(
              file,
              error instanceof Error ? error : new Error("Upload failed"),
            );
          }
        });

        // Wait for all uploads to complete
        await Promise.all(uploadPromises);

         // Show success message after all uploads are done
        toast.success("File uploaded successfully!");

        // Update file list by fetching new list from server
        const newFiles = await getFilesandFoldersAction(currParentId);

        // Replace previous files with new ones
        // This ensures that the UI reflects the latest state of files
        // and folders in the current directory
        setCurrFiles(() => newFiles);

       
      } catch (error) {
        // This handles any error that might occur outside the individual upload processes
        console.error("Unexpected error during upload:", error);
      }
    },
    [],
  );
 
  const onFileReject = React.useCallback((file: File, message: string) => {
    toast(message, {
      description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" has been rejected`,
    });
  }, []);
 
  return (
    <>
      <FileUpload
        value={files}
        onValueChange={setFiles}
        onUpload={onUpload}
        onFileReject={onFileReject}
        maxFiles={2}
        className="w-full max-w-md"
        multiple
      >
        <FileUploadDropzone>
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center justify-center rounded-full border p-2.5">
              <Upload className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">Drag & drop files here</p>
            <p className="text-muted-foreground text-xs">
              Or click to browse (max 2 files)
            </p>
          </div>
          <FileUploadTrigger asChild>
            <Button variant="outline" size="sm" className="mt-2 w-fit">
              Browse files
            </Button>
          </FileUploadTrigger>
        </FileUploadDropzone>
        <FileUploadList>
          {files.map((file, index) => (
            <FileUploadItem key={index} value={file} className="flex-col">
              <div className="flex w-full items-center gap-2">
                <FileUploadItemPreview />
                <FileUploadItemMetadata />
                <FileUploadItemDelete asChild>
                  <Button variant="ghost" size="icon" className="size-7">
                    <X />
                  </Button>
                </FileUploadItemDelete>
              </div>
              <FileUploadItemProgress />
            </FileUploadItem>
          ))}
        </FileUploadList>
      </FileUpload>
      <Toaster>
      </Toaster>
    </> 
  );
}