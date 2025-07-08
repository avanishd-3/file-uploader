"use server"

import type { FolderItem } from "@/components/drive-view/file";
import { getFilesByParentId } from "@/data-access/file-access";
import { getFolderById, getFoldersByParentId } from "@/data-access/folder-access";
import { getBreadCrumb } from "@/data-access/other-access";

export async function getBreadcrumbsAction(parentId: string | null) {

    // Get the breadcrumb trail for the given parentId
    const folders = await getBreadCrumb(parentId);

    // Convert the breadcrumbs to FolderItem[]
    const initialItems = folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        items: folder.items || 0, // Default to 0 if items is not present
        modified: folder.modified || new Date().toISOString(), // Default to current date if modified is not present
        // TS needs to know that this is a folder, not just any string
        type: "folder" as const, // Assumes all items in breadcrumbs are folders
    }));

    return initialItems as FolderItem[];
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

