"use server"

import { createFolder, deleteFolder } from "@/data-access/folder-access";

export async function createFolderAction(
    name: string,
    modifiedAt: Date,
    parentId: string | null
) {
    return await createFolder(name, modifiedAt, parentId);
}

export async function deleteFolderAction(folderId: string) {
    // This function deletes a folder and all its contents
    // It should be called when the user confirms deletion of a folder
    // It will also delete all files and subfolders within that folder
    return await deleteFolder(folderId);
}

