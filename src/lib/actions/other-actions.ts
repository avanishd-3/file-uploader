"use server"

import { getFilesByParentId } from "@/data-access/file-access";
import { getFolderById, getFoldersByParentId } from "@/data-access/folder-access";

export async function getBreadcrumbsAction(parentId: string | null) {
    const breadcrumbs = [];
    let currentFolderId = parentId;

    while (currentFolderId !== null) {
        const folder = await getFolderById(currentFolderId);
        if (folder) {
            breadcrumbs.unshift(folder);
            currentFolderId = folder.parentId;
        } else {
            break;
        }
    }

    return breadcrumbs;
}

export async function getFilesandFoldersAction(parentId: string | null) {
    const [files, folders] = await Promise.all([
        getFilesByParentId(parentId),
        getFoldersByParentId(parentId),
    ]);

    // Combine files and folders into a single array
    // Put folders first, so they are displayed at the top (this looks better)
    const initialStuff = [...folders, ...files];

    return initialStuff;

}

