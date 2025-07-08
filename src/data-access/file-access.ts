import "server-only";

// Database operations for file
import { db } from "@/server/db";
import { file, folder } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";


// TODO -> Add auth to this stuff

/* File queries */
export async function getFileById(fileId: string) {
    return db.query.file.findFirst({
        where: eq(file.id, fileId),
    });
}

export async function getFilesByParentId(parentId: string | null) {

    // Get all files that belong to the specified parentId
    // Sort by name to make it look better on the UI
    // Faster than doing JS sort

    if (parentId === null) {
        return db.query.file.findMany({
            where: (fields, { isNull }) => isNull(fields.parentId),
            orderBy: (fields) => fields.name,
        });
    }

    return db.query.file.findMany({
        where: eq(file.parentId, parentId),
        orderBy: (fields) => fields.name,
    });
}

/* File mutations */
export async function renameFile(fileId: string, newName: string) {
    return db.update(file).set({ name: newName }).where(eq(file.id, fileId));
}

export async function moveFile(
    fileId: string,
    newParentId: string | null,
) {
    // Get current parentId of the file
    const currentFile = await db.query.file.findFirst({
        where: eq(file.id, fileId),
        columns: { parentId: true },
    });

    // Prepare promises for updating the folder item counts
    let decrementPromise: Promise<any> | undefined;
    let incrementPromise: Promise<any> | undefined;

    // Decrement the item count of the current parent folder if it exists
    if (currentFile !== undefined && currentFile.parentId !== null) {
        decrementPromise = 
            db
            .update(folder)
            .set({ items: sql`${folder.items} - 1` })
            .where(eq(folder.id, currentFile.parentId));
    }

    // Increment the item count of the new parent folder if it exists
    if (newParentId !== null) {
        incrementPromise = 
            db
            .update(folder)
            .set({ items: sql`${folder.items} + 1` })
            .where(eq(folder.id, newParentId));
    }

    // Filter out any undefined promises to avoid errors
    const filteredPromises = [decrementPromise, incrementPromise].filter(p => p !== undefined && p !== null);

    // Length of filteredPromises should be 1 or 2, since file is being moved out of null parent or into null parent at worst
    await Promise.all(filteredPromises);

    // If the file is being moved to a new parent, update the parentId
    return db.update(file).set({ parentId: newParentId }).where(eq(file.id, fileId));
}

/* Create new file */
export async function createFile(
    name: string,
    type: "pdf" | "image" | "document" | "code" | "other",
    size: string,
    modified: Date,
    parentId: string | null,
    url: string,
) {
    // New file will increase the size of the parent folder by 1 if it is not a top-level file
    if (parentId !== null) {
        
        // No need to join folder table b/c folder Id is already known
        // so you can directly update the folder's item count
        await db
            .update(folder)
            .set({ items: sql`${folder.items} + 1` })
            .where(eq(folder.id, parentId));
    }
    
    return db.insert(file).values({
        name,
        type,
        size,
        modified,
        parentId,
        url,
    });
}

/* Delete file */
export async function deleteFile(fileId: string) {
    // TODO -> Delete file from uploads directory / Supabase storage / S3 bucket

    // Update parent folder's item count if the file has a parent
    const currentFile = await db.query.file.findFirst({
        where: eq(file.id, fileId),
        columns: { parentId: true },
    });

    if (currentFile !== undefined && currentFile.parentId !== null) {
        await db
            .update(folder)
            .set({ items: sql`${folder.items} - 1` })
            .where(eq(folder.id, currentFile.parentId));
    }

    return db.delete(file).where(eq(file.id, fileId));
}