"use server"

import { createFolder, createFolderReturnId, deleteFolder, getAllFolders, getFolderById, moveFolder, renameFolder } from "@/data-access/folder-access";

export async function getAllFoldersAction() {
    // This function fetches all folders from the database
    // It should be called when the user opens the drive view
    return await getAllFolders();
}

export async function getFolderByIdAction(folderId: string) {
    // This function fetches a folder by its ID
    // It should be called when the user wants to view a specific folder
    return await getFolderById(folderId);
}

export async function createFolderAction(
    name: string,
    modifiedAt: Date,
    parentId: string | null
) {
    return await createFolder(name, modifiedAt, parentId);
}

export async function createFolderReturnIdAction(
    name: string,
    modifiedAt: Date,
    parentId: string | null
) {
    const newFolderId = await createFolderReturnId(name, modifiedAt, parentId);
    return newFolderId;
}

export async function moveFolderAction(
    folderId: string,
    newParentId: string | null
) {
    // This function moves a folder to a new parent folder
    // It should be called when the user confirms moving a folder
    return await moveFolder(folderId, newParentId);
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

