"use server"

import { createFile, deleteFile } from "@/data-access/file-access";

export async function createFileAction(
    name: string,
    type: "pdf" | "image" | "document" | "code" | "other",
    size: string,
    createdAt: Date,
    parentId: string | null,
    url: string
) {
    return await createFile(name, type, size, createdAt, parentId, url);
}
export async function deleteFileAction(fileId: string) {
    // This function deletes a file
    // It should be called when the user confirms deletion of a file
    // It will also remove the file from the storage (e.g., Supabase, S3, etc.)
    return await deleteFile(fileId);
}

