"use server"

import fsPromises from "fs/promises";
import path from "path";

import type { FolderItem } from "@/lib/file";
import { getFilesByParentId } from "@/data-access/file-access";
import { getFoldersByParentId } from "@/data-access/folder-access";
import { getBreadCrumb } from "@/data-access/other-access";
import { getFileExtension } from "../utils/utils";

import { read as XLSXread, utils as XLSXUtils } from 'xlsx';


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

    // TODO: Support S3 bucket

    // Remove query parameters from URL if any
    const cleanUrl = url?.split('?')[0];

    // Remove invalid URLs
    if (cleanUrl === undefined || cleanUrl === "" || !cleanUrl.startsWith('/')) {
        return false;
    }

    
    const filePath = path.join(process.cwd(), cleanUrl);
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

    const fullPath = path.join(process.cwd(), filePath);

    try {
        console.log("Reading file from path:", fullPath);
        const content = await fsPromises.readFile(fullPath, 'utf-8');
        return content;
    } catch (error) {
        console.error("Error reading file:", error);
        return "";
    }
}

// Next.js cannot deserialize Response over network boundary, so just return JSON data or empty string
export async function parseSpreadsheetAction(filePath: string) {
    /**
     * @param filePath - Path to the spreadsheet file (e.g., /uploads/myfile.xlsx)
     * @description Parses an XLSX spreadsheet file and converts the first sheet to JSON.
     * Assumes the server had permission to read the file. Since the server is creating the file in the first place,
     * this should be true.
     * @returns NextResponse with JSON data or error message
     */
    
    // Do not allow directory traversal attacks
    if (filePath.includes('..')) {
        return "";
    }
    
    // TODO: Switch to S3 bucket url
    const absolutePath = path.join(process.cwd(), filePath);

    // Check if the file exists
    // Even though this is duplication of checkFileExistsAction, it prevents an extra network call
    const stats = await fsPromises.stat(absolutePath).catch(() => null);
    if (!stats?.isFile()) {
        return "";
    }

    // Check that file extension is xlsx
    const extension = getFileExtension(absolutePath);
    if (extension !== 'xlsx') {
        return "";
    }

    // Convert file to buffer
    // XLSXreadFile throws an error otherwise
    const fileBuffer = await fsPromises.readFile(absolutePath);

    // Convert to JSON
    // See question in: https://stackoverflow.com/questions/68866182/converting-excel-data-to-json-using-sheetjs 
    const workbook = XLSXread(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        return "";
    }
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        return "";
    }
    const jsonData = XLSXUtils.sheet_to_json(sheet);

    if (jsonData === undefined || jsonData === null || jsonData.length === 0) {
        return "";
    }

    // See: https://stackoverflow.com/questions/77091418/warning-only-plain-objects-can-be-passed-to-client-components-from-server-compo
    // Reason: If you don't deep copy the object, the value passed to the client component is a reference to an object on the server side
    // Need to disable no unsafe assignment b/c the structure of the JSON is unknown since sheet content is dynamic
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const data: any[] = JSON.parse(JSON.stringify(jsonData)); // Ensure serializability
    console.log(data);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
}