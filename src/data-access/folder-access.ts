import "server-only";

// Database operations for folder
import { db } from "@/server/db";
import { file, folder } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";

// TODO -> Add auth to this stuff

/* Folder queries */
export async function getFolderById(folderId: string) {
    return db.query.folder.findFirst({
        where: eq(folder.id, folderId),
    });
}

export async function getFoldersByParentId(parentId: string | null) {
    // If parentId is null, return all folders that do not have a parent (top-level folders)
    if (parentId === null) {
        return db.query.folder.findMany({
            where: (fields, { isNull }) => isNull(fields.parentId),
        });
    }

    // Otherwise, return folders that belong to the specified parentId
    return db.query.folder.findMany({
        where: eq(folder.parentId, parentId),
    });
}

/* Folder mutations */
export async function renameFolder(folderId: string, newName: string) {
    return db.update(folder).set({ name: newName }).where(eq(folder.id, folderId));
}

export async function moveFolder(
    folderId: string,
    newParentId: string | null,
) { 
    // Update old parent folder's item count
    const currentFolder = await db.query.folder.findFirst({
        where: eq(folder.id, folderId),
        columns: { parentId: true, items: true },
    });

    // Prepare promises for updating the folder item counts
    let decrementPromise: Promise<any> | undefined;
    let incrementPromise: Promise<any> | undefined;

    // Decrement the item count of the current parent folder if it exists
    if (currentFolder !== undefined && currentFolder.parentId !== null) {
        decrementPromise = 
            db
            .update(folder)
            .set({ items: sql`${folder.items} - ${currentFolder.items}`}) // Decrement the item count by the number of items in the folder
            .where(eq(folder.id, currentFolder.parentId));
    }

    // Increment the item count of the new parent folder if it exists
    if (currentFolder !== undefined && newParentId !== null) {
        incrementPromise = 
            db
            .update(folder)
            .set({ items: sql`${folder.items} + ${currentFolder.items}` }) // Increment the item count by the number of items in the folder
            .where(eq(folder.id, newParentId));
    }

    // Filter out any undefined promises to avoid errors
    const filteredPromises = [decrementPromise, incrementPromise].filter(p => p !== undefined && p !== null);

    // Length of filteredPromises should be 1 or 2, since file is being moved out of null parent or into null parent at worst
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

    // Update the parent folder's item count if this folder has a parent
    const currentFolder = await db.query.folder.findFirst({
        where: eq(folder.id, folderId),
        columns: { parentId: true, items: true },
    });

    // Update the parent folder's item count if it exists
    if (currentFolder !== undefined && currentFolder.parentId !== null) {
        await db
            .update(folder)
            .set({ items: sql`${folder.items} - ${currentFolder.items}` }) // Decrement the item count by the number of items in the folder
            .where(eq(folder.id, currentFolder.parentId));
    }

    // Delete folder itself
    return db.delete(folder).where(eq(folder.id, folderId));
}