import "server-only";

import { getFolderById } from "@/data-access/folder-access";


/* Utils for db stuff, which should only be used on the server side */

// parentId is null so currrentFolderId can be null
export async function getBreadcrumbs(parentId: string | null) {
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