import "server-only"

// Database operations for file
import { db } from "@/server/db";
import { sql } from "drizzle-orm";


// TODO -> Add auth to this stuff

export async function getBreadCrumb(parentId: string | null) {
    // Recursive SQL is mainly supported in PostgreSQL

    // Need raw SQL because Drizzle ORM does not support recursive CTEs yet
    // See https://github.com/drizzle-team/drizzle-orm/issues/209
    // TODO -> Switch to Drizzle ORM when it supports recursive CTEs

    const query = sql`
        -- Use a recursive CTE to get all ancestors of the folder
        -- Need double quotes for column names with uppercase letters
        -- Need double quotes because table name has a hyphen
        -- Use incrementing depth to properly order the results

        WITH RECURSIVE ancestors AS (
            SELECT id, "parentId", name, 0 as depth
            FROM "file-uploader_folder"
            WHERE id = ${parentId}
            UNION ALL
            SELECT f.id, f."parentId", f.name , a.depth + 1
            FROM "file-uploader_folder" f
            INNER JOIN ancestors a ON f.id = a."parentId"
        )
        SELECT * FROM ancestors
        ORDER BY depth DESC` 

    return db.execute(query);
}