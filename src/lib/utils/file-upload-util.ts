import { toast } from "sonner";
import { createFileAction } from "../actions/file-actions";
import { getFilesandFoldersAction } from "../actions/other-actions";
import type { FileorFolderItem, FileWithParent } from "../file";
import { getFileExtension } from "./utils";
import { getFileType, convertFileSize } from "./utils";

import { z } from "zod";

// This is in its own file b/c it uses server code and having it with the other utils doesn't work w/ Vitest

const FileUploadServerResponse = z.object({
  message: z.string(),
  filePath: z.string(),
});

export async function handleFileUpload(files: File[], onProgress: (file: File, progress: number) => void, onSuccess: (file: File) => void, currParentId: string | null, onError: (file: File, error: Error) => void, setCurrFiles: React.Dispatch<React.SetStateAction<FileorFolderItem[]>>) {
  try {
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

              // Use Zod to ensure server response is valid
              const response = FileUploadServerResponse.safeParse(JSON.parse(xhr.responseText));

              if (!response.success) {
                onError(file, new Error("Invalid server response"));
                reject(new Error("Invalid server response"));
                return;
              }

              const filePath = response.data.filePath;
              console.log("File uploaded to:", filePath);

              await createFileAction(
                file.name,
                getFileType(file.name),
                convertFileSize(file.size),
                new Date(),
                getFileExtension(file.name),
                currParentId,
                filePath
              );

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
          error instanceof Error ? error : new Error("Upload failed")
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
}

export async function handleFileUploadWithDifferentParents(filesInfo: FileWithParent[], onProgress: (file: File, progress: number) => void, onSuccess: (file: File) => void, currParentId: string | null, onError: (file: File, error: Error) => void, setCurrFiles: React.Dispatch<React.SetStateAction<FileorFolderItem[]>>) {
  try {
    const uploadPromises = filesInfo.map(async (fileInfo) => {
      try {
        const formData = new FormData();
        const currFile = fileInfo.file;
        const parentId = fileInfo.parentId;
        formData.append("file", currFile);

        // Use XMLHttpRequest for progress events
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/upload");

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              onProgress(currFile, progress);
            }
          };

          xhr.onload = async () => {
            if (xhr.status === 200) {
              onSuccess(currFile);

              // Use Zod to ensure server response is valid
              const response = FileUploadServerResponse.safeParse(JSON.parse(xhr.responseText));

              if (!response.success) {
                onError(currFile, new Error("Invalid server response"));
                reject(new Error("Invalid server response"));
                return;
              }

              const filePath = response.data.filePath;
              console.log("File uploaded to:", filePath);
              

              await createFileAction(
                currFile.name,
                getFileType(currFile.name),
                convertFileSize(currFile.size),
                new Date(),
                getFileExtension(currFile.name),
                parentId,
                filePath
              );

              resolve();

            } else {
              onError(currFile, new Error(xhr.responseText || "Upload failed"));
              reject(new Error(xhr.responseText || "Upload failed"));
            }
          };

          xhr.onerror = () => {
            onError(currFile, new Error("Network error"));
            reject(new Error("Network error"));
          };

          xhr.send(formData);
        });
      } catch (error) {
        onError(
          fileInfo.file,
          error instanceof Error ? error : new Error("Upload failed")
        );
      }
    });

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // Show success message after all uploads are done
    toast.success("Files uploaded successfully!");

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
}