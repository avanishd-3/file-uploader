import "server-only";

// Database operations for folder
import { db } from "@/server/db";
import { folder } from "@/server/db/schema";
import { eq, type SQL, sql } from "drizzle-orm";
import type { PgRaw } from "drizzle-orm/pg-core/query-builders/raw";
import type { RowList } from "postgres";
import { getFilesByParentId } from "./file-access";
import path from "path";
import { unlink } from "fs";
import { get } from "http";


/**
 * How item counts work:
 * The items column in the folder table represents the total number of immediate children (files and folders) within that folder.
 * This is more intuitive for users than adding the total number of all descendant files and folders.
 * The iOS files manager behaves this way (a folder count = number of children folders + number of children files)
 * Previously, I updated the number of items by the child folder count, but that was confusing.
 */

/* Ancestor item count queries */

// Recursive SQL is mainly supported in PostgreSQL
// Need raw SQL because Drizzle ORM does not support recursive CTEs yet
// See https://github.com/drizzle-team/drizzle-orm/issues/209
// TODO -> Switch to Drizzle ORM when it supports recursive CTEs

const getIncrementAncestorItemCountByOne = (parentId: string | null): SQL => {
    return sql`
            -- Use a recursive CTE to get all ancestors of the folder
            -- Need double quotes for column names with uppercase letters
            -- Need double quotes because table name has a hyphen

            WITH RECURSIVE ancestors AS (
                SELECT id, "parentId"
                FROM "file-uploader_folder"
                WHERE id = ${parentId}
                UNION ALL
                SELECT f.id, f."parentId"
                FROM "file-uploader_folder" f
                INNER JOIN ancestors a ON f.id = a."parentId"
            )
            UPDATE "file-uploader_folder"
            SET items = items + 1 -- Increment the item count by 1
            WHERE id IN (SELECT id FROM ancestors)`;
}

const getDecrementAncestorItemsCountByOne = (parentId: string | null): SQL => {
    return sql`
            -- Use a recursive CTE to get all ancestors of the folder
            -- Need double quotes for column names with uppercase letters
            -- Need double quotes because table name has a hyphen

            WITH RECURSIVE ancestors AS (
                SELECT id, "parentId"
                FROM "file-uploader_folder"
                WHERE id = ${parentId}
                UNION ALL
                SELECT f.id, f."parentId"
                FROM "file-uploader_folder" f
                INNER JOIN ancestors a ON f.id = a."parentId"
            )
            UPDATE "file-uploader_folder"
            SET items = items - 1 -- Decrement the item count by the number of items in the folder
            WHERE id IN (SELECT id FROM ancestors)`;
    
}

const getAllDescendantFolderIds = (folderId: string | null): SQL => {
    return sql`
            -- Use a recursive CTE to get all descendants of the folder
            -- Need double quotes for column names with uppercase letters
            -- Need double quotes because table name has a hyphen

            WITH RECURSIVE descendants AS (
                SELECT id, "parentId"
                FROM "file-uploader_folder"
                WHERE id = ${folderId}
                UNION ALL
                SELECT f.id, f."parentId"
                FROM "file-uploader_folder" f
                INNER JOIN descendants d ON f."parentId" = d.id
            )
            SELECT id FROM descendants WHERE id != ${folderId}`; // Exclude the original folderId
};

// TODO -> Add auth to this stuff

/* Folder queries */
export async function getAllFolders() {
    return db.query.folder.findMany({
        orderBy: (fields) => fields.name, // Sort by name to make it look better on the UI
    })
}


export async function getFolderById(folderId: string) {
    return db.query.folder.findFirst({
        where: eq(folder.id, folderId),
    });
}

export async function getFoldersByParentId(parentId: string | null) {
    // Get all folders that belong to the specified parentId
    // Sort by name to make it look better on the UI
    // Faster than doing JS sort

    if (parentId === null) {
        return db.query.folder.findMany({
            where: (fields, { isNull }) => isNull(fields.parentId),
            orderBy: (fields) => fields.name, 
        });
    }

    return db.query.folder.findMany({
        where: eq(folder.parentId, parentId),
        orderBy: (fields) => fields.name, 
    });
}

export async function getSubFoldersByParentId(folderId: string | null) {
    return db.execute(getAllDescendantFolderIds(folderId));
}

/* Folder mutations */
export async function renameFolder(folderId: string, newName: string) {
    return db.update(folder).set({ name: newName }).where(eq(folder.id, folderId));
}

export async function moveFolder(
    folderId: string,
    newParentId: string | null,
) { 
    // Update ancestor item count
    const currentFolder = await db.query.folder.findFirst({
        where: eq(folder.id, folderId),
        columns: { parentId: true, items: true },
    });

    // Prepare promises for updating the folder item counts
    let decrementPromise: PgRaw<RowList<Record<string, unknown>[]>> | undefined;
    let incrementPromise: PgRaw<RowList<Record<string, unknown>[]>> | undefined;
    
    // Decrement the item count of the current parent folder if it exists
    if (currentFolder !== undefined && currentFolder.parentId !== null) {
        decrementPromise = db.execute(getDecrementAncestorItemsCountByOne(currentFolder.parentId));
    }

    // Increment the item count of the new parent folder and its ancestors
    if (currentFolder !== undefined && newParentId !== null) {
        incrementPromise = db.execute(getIncrementAncestorItemCountByOne(newParentId));
    }

    // Filter out any undefined promises to avoid errors
    const filteredPromises = [decrementPromise, incrementPromise].filter(p => p !== undefined && p !== null);

    // Length of filteredPromises should be 1 or 2, since file is being moved out of null parent or into null parent at worst

    // This does duplicated work if moving to an ancestor folder, but it's easier to implement
    await Promise.all(filteredPromises);

    // If the folder is being moved to a new parent, update the parentId

    // I don't think you need to change subfolders and subfiles since they will still be under the same folder structure
    // so their parentId should be the same as this folderId
    return db.update(folder).set({ parentId: newParentId }).where(eq(folder.id, folderId));

}

/* Create new folder */
export async function createFolder(
    name: string,
    modified: Date,
    parentId: string | null,
) {
    // Increase parent folder item count by 1
    if (parentId !== null) {
        await db.update(folder).set({ items: sql`${folder.items} + 1` }).where(eq(folder.id, parentId));
    }
    return db.insert(folder).values({
        name,
        type: "folder", // Explicitly set type to "folder"
        items: 0, // New folder will have nothing in it
        modified,
        parentId,
    });
}

/* Delete folder */
export async function deleteFolder(folderId: string) {

    // No need to delete subfiles and subfolders manually since onDelete cascade will handle it

    // TODO -> Delete all files in folder from uploads directory / Supabase storage / S3 bucket

    // Update ancestor item counts
    const currentFolder = await db.query.folder.findFirst({
        where: eq(folder.id, folderId),
        columns: { parentId: true, items: true },
    });

    if (currentFolder !== undefined && currentFolder.parentId !== null) {
        await db.execute(getDecrementAncestorItemsCountByOne(currentFolder.parentId));
    }

    // Get the files in the folder to delete from server storage
    const subFoldersPromise = getSubFoldersByParentId(folderId);
    const filesToDeletePromise = getFilesByParentId(folderId);

    // Batch promises for efficiency
    let [subFolders, filesToDelete] = await Promise.all([subFoldersPromise, filesToDeletePromise]);

    for (const subFolder of subFolders) {
        // subFolder.id will not be null here, raw SQL queries just don't have types
        const subFolderFiles = await getFilesByParentId(subFolder.id as string); 
        filesToDelete = filesToDelete.concat(subFolderFiles);
    }

    // Delete files from server storage
    for (const file of filesToDelete) {
        // Delete file from server
        if (file) {
            const publicDir = path.join(process.cwd(), 'public'); 
            const filePath = path.join(publicDir, file.url);
            unlink(filePath, (err) => {
                // Ignore errors for now
                // TODO: Handle errors properly
            });
        }
    }

    // Delete folder itself
    return db.delete(folder).where(eq(folder.id, folderId));
}