import "server-only";

// Database operations for folder
import { db } from "@/server/db";
import { folder } from "@/server/db/schema";
import { eq, type SQL, sql } from "drizzle-orm";
import type { PgRaw } from "drizzle-orm/pg-core/query-builders/raw";
import type { RowList } from "postgres";
import path from "path";
import { unlink } from "fs";
import type { Transaction } from "@/lib/types/db-types";

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

const getDecrementAncestorItemsCount = (parentId: string | null, num: number): SQL => {
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
            SET items = items - ${num} -- Decrement the item count by the number of items in the folder
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

// See: https://orm.drizzle.team/docs/perf-queries#placeholder
function getFolderIdByNameAndParentIdQuery(transaction?: Transaction) {

    if (transaction) {
        return transaction.query.folder.findFirst({
            where: (fields, { and, isNull }) => sql.placeholder('parentId') === null ? and(
                eq(fields.name, sql.placeholder('name')),
                isNull(fields.parentId),
            ) : and(
                eq(fields.name, sql.placeholder('name')),
                eq(fields.parentId, sql.placeholder('parentId')),
            ),
            columns: { id: true },
        }).prepare("getFolderIdByNameAndParentIdQuery");
    }

    else {
        return db.query.folder.findFirst({
            where: (fields, { and, isNull }) => sql.placeholder('parentId') === null ? and(
                eq(fields.name, sql.placeholder('name')),
                isNull(fields.parentId),
            ) : and(
                eq(fields.name, sql.placeholder('name')),
                eq(fields.parentId, sql.placeholder('parentId')),
            ),
            columns: { id: true },
        }).prepare("getFolderIdByNameAndParentIdQuery");
    }
}



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

export async function getFileParentIdByFilePath(currentParentId: string | null, path: string) {
    // Ex input: Test/Test 2
    console.log("Getting parent ID for file path:", path);
    const pathParts = path.split('/')
    console.log("Path parts:", pathParts);

    if (pathParts.length <= 1 || !pathParts[0] || pathParts[0].trim() === "") {
        // File is at the root level, so it has no parent
        return null;
    }

    console.log("Searching for initial parent folder:", pathParts[0]);
    console.log("Current parent ID:", currentParentId);

    const firstFolderName = pathParts[0];

    return db.query.folder.findFirst({
            where: (fields, { and, isNull }) => currentParentId === null ? and(
                eq(fields.name, firstFolderName),
                isNull(fields.parentId),
            ) : and(
                eq(fields.name, firstFolderName),
                eq(fields.parentId, currentParentId),
            ),
            columns: { id: true },
        }).then(async (initialParent) => {
            if (!initialParent) {
                console.log("Initial parent folder not found");
                return null;
            }

            let currentParentId: string | null = initialParent.id;
            console.log("Initial parent folder ID:", currentParentId);

            // Traverse down the folder hierarchy to find the parent folder
            for (let i = 1; i < pathParts.length; i++) {
                console.log("New parent folder ID:", currentParentId);
                const folderName = pathParts[i];
                if (!folderName || folderName.trim() === "" || !currentParentId) {
                    return null;
                }
                const nextFolder = await db.query.folder.findFirst({
                    where: (fields, { and }) => and(
                        eq(fields.name, folderName),
                        eq(fields.parentId, currentParentId!),
                    ),
                    columns: { id: true },
                });

                if (!nextFolder) {
                    return null; // Folder in the path does not exist
                }

                currentParentId = nextFolder.id;
            }

            return currentParentId;
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
    if (currentFolder?.parentId !== null && currentFolder !== undefined) {
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

export async function createFolderReturnId(
    name: string,
    modified: Date,
    parentId: string | null,
){
    return await db.transaction(async (tx: Transaction) => {
        // Increase parent folder item count by 1
        if (parentId !== null) {
            await tx.update(folder).set({ items: sql`${folder.items} + 1` }).where(eq(folder.id, parentId));
        }
        
        await tx.insert(folder).values({
            name,
            type: "folder", // Explicitly set type to "folder"
            items: 0, // New folder will have nothing in it
            modified,
            parentId,
        });

        const insertQuery = getFolderIdByNameAndParentIdQuery(tx);

        const insertedFolder = await insertQuery.execute({
            name,
            parentId,
        });

        return insertedFolder?.id ?? null;
    });
}

/* Delete folder */
export async function deleteFolder(folderId: string) {

    // TODO -> Support S3 bucket

    // Update ancestor item counts
    const currentFolder = await db.query.folder.findFirst({
        where: eq(folder.id, folderId),
        columns: { parentId: true, items: true },
    });

    // Get the files in the folder to delete from server storage
    const subFolders = await getSubFoldersByParentId(folderId);

    const descendantFolderIds = subFolders.map(row => row.id as string);

    const allFolderIds = [folderId, ...descendantFolderIds];

    // Get all files in these folders
    const filesToDelete = await db.query.file.findMany({
        where: (fields, { inArray}) => inArray(fields.parentId, allFolderIds),
    });

    // Delete files from server storage
    for (const file of filesToDelete) {
        // Delete file from server
        if (file) {
            const filePath = path.join(process.cwd(), file.url);
            unlink(filePath, (_err) => {
                // Ignore errors for now
                // TODO: Handle errors properly
            });
        }
    }

    // onDelete cascade doesn't work for deleting subfolders
    if (currentFolder?.parentId !== null && currentFolder !== undefined) {
        await db.execute(getDecrementAncestorItemsCount(currentFolder.parentId, currentFolder.items));
    }
    for (const folderIdToDelete of allFolderIds) {
        // Delete folder from database
        await db.delete(folder).where(eq(folder.id, folderIdToDelete));
    }
}