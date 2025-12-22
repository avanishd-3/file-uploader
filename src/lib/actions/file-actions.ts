"use server"

import { createFile, deleteFile, moveFile, renameFile, getFilesByParentName} from "@/data-access/file-access";
import { getFileParentIdByFilePath } from "@/data-access/folder-access";
import { type FileType } from "@/lib/file";

export async function createFileAction(
    name: string,
    type: FileType,
    size: string,
    createdAt: Date,
    extension: string,
    parentId: string | null,
    url: string
) {
    return await createFile(name, type, size, createdAt, extension, parentId, url);
}

export async function renameFileAction(fileId: string, newName: string) {
    // This function renames a file
    // It should be called when the user confirms renaming a file
    // It will not change the parentId or any other properties of the file
    return await renameFile(fileId, newName);
}

export async function moveFileAction(fileId: string, newParentId: string | null) {
    // This function moves a file to a new parent folder
    // It should be called when the user confirms moving a file
    // It will update the parentId of the file in the database
    return await moveFile(fileId, newParentId);
}

export async function deleteFileAction(fileId: string) {
    // This function deletes a file
    // It should be called when the user confirms deletion of a file
    // It will also remove the file from the storage (e.g., Supabase, S3, etc.)
    return await deleteFile(fileId);
}

export async function getFilesByParentNameAction(parentName: string) {
    // This function fetches all files under a specific parent folder based on the parent folder's name
    return await getFilesByParentName(parentName);
}

export async function getFileParentIdByFilePathAction(currentParentId: string | null, filePath: string): Promise<string | null> {
    /**
     * @param filePath - The path of the file whose parent ID is to be retrieved.
     * @description Retrieves the parent ID of a file based on its file path.
     * @returns A promise that resolves to the parent ID of the file, or null if not found.
     */
    const pathSegments = filePath.split('/').filter(segment => segment.length > 0);
    if (pathSegments.length <= 1) {
        // File is at the root level, so it has no parent
        return null;
    }

    // Remove the last segment (the file name) to get the parent folder path
    const parentFolderPath = pathSegments.slice(0, -1).join('/');

    return await getFileParentIdByFilePath(currentParentId, parentFolderPath);
}