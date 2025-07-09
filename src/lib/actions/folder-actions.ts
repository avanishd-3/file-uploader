"use server"

import { createFolder, deleteFolder, renameFolder } from "@/data-access/folder-access";

export async function createFolderAction(
    name: string,
    modifiedAt: Date,
    parentId: string | null
) {
    return await createFolder(name, modifiedAt, parentId);
}

export async function renameFolderAction(
    folderId: string,
    newName: string
) {
    // This function renames a folder
    // It should be called when the user confirms renaming a folder
    // It will not change the parentId or any other properties of the folder
    return await renameFolder(folderId, newName);
}

export async function deleteFolderAction(folderId: string) {
    // This function deletes a folder and all its contents
    // It should be called when the user confirms deletion of a folder
    // It will also delete all files and subfolders within that folder
    return await deleteFolder(folderId);
}

