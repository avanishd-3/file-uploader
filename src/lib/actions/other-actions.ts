"use server"

import fsPromises from "fs/promises";
import path from "path";

import type { FolderItem } from "@/lib/file";
import { getFilesByParentId } from "@/data-access/file-access";
import { getFoldersByParentId } from "@/data-access/folder-access";
import { getBreadCrumb } from "@/data-access/other-access";

export async function getBreadcrumbsAction(parentId: string | null) {

    // Get the breadcrumb trail for the given parentId
    const folders = await getBreadCrumb(parentId);

    // Convert the breadcrumbs to FolderItem[]
    const initialItems = folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        items: folder.items ?? 0, // Default to 0 if items is not present
        modified: folder.modified ?? new Date().toISOString(), // Default to current date if modified is not present
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

export async function checkFileExistsAction(url: string): Promise<boolean> {
    // Check if file exists on Node.js server

    // TODO: Switch to S3 bucket check

    const publicDir = path.join(process.cwd(), 'public'); 

    // Remove query parameters from URL if any
    const cleanUrl = url?.split('?')[0];

    // Remove invalid URLs
    if (cleanUrl === undefined || cleanUrl === "" || !cleanUrl.startsWith('/')) {
        return false;
    }

    const filePath = path.join(publicDir, cleanUrl);
    try {
        const stats = await fsPromises.stat(filePath);
        return stats.isFile();
    } catch {
        return false;
    }
} 

// Should not throw error over network boundary, just return empty string
// Empty string is fine b/c we don't need a special UI on fail
export async function readFileContentAction(filePath: string | undefined): Promise<string> {
    // Read file content from Node.js server

    // Don't allow invalid file paths
    // Prevent relative paths
    if (filePath === undefined || filePath === "" || !filePath.startsWith('/')) {
        console.error("Invalid file path provided:", filePath);
        return "";
    }

    const publicDir = path.join(process.cwd(), 'public'); 
    const fullPath = path.join(publicDir, filePath);

    try {
        console.log("Reading file from path:", fullPath);
        const content = await fsPromises.readFile(fullPath, 'utf-8');
        return content;
    } catch (error) {
        console.error("Error reading file:", error);
        return "";
    }
}