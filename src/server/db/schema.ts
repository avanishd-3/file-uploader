// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations } from "drizzle-orm";
import { foreignKey, index, pgTableCreator } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `file-uploader_${name}`);

// Folder Schema
export const folder = createTable(
  "folder",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(), // Use UUIDs for folders
    name: d.text().notNull(),
    type: d.varchar({ enum: ["folder"] }).notNull(),
    items: d.integer().notNull(),
    modified: d.timestamp({ withTimezone: true }).notNull(),
    parentId: d.uuid(),
  }),
  (t) => [
    // Ensure parentId is a foreign key to the folder table itself

    // Need to do this because type inference on self-referential foreign keys is broken

    // See: https://github.com/drizzle-team/drizzle-orm/discussions/236
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.parentId],
    }).onDelete("cascade"), // onUpdate("cascade") is not useful b/c it only helps when primary key changes (won't happen here)
    index("folder_name_idx").on(t.id),
  ]
);

// File Schema
export const file = createTable(
  "file",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(), // Use UUIDs for files
    name: d.text().notNull(),
    type: d.varchar({ enum: ["pdf", "image", "document", "code", "audio", "video", "sheet", "other"] }).notNull(),
    size: d.varchar({ length: 64 }).notNull(),
    modified: d.timestamp({ withTimezone: true }).notNull(),
    parentId: d.uuid().references(() => folder.id, { onDelete: "cascade"}), // onUpdate("cascade") is not useful b/c it only helps when primary key changes (won't happen here)
    url: d.text().notNull()
  }),
  (t) => [index("file_name_idx").on(t.id)],
);

// 1-to-many relationship between folders and files
export const foldersRelations = relations(folder, ({ many}) => ({
  files: many(file),
}));

// Need to define reverse relationship for Drizzle Studio to work properly
export const filesRelations = relations(file, ({ one }) => ({
  folder: one(folder, {
    fields: [file.parentId],
    references: [folder.id],
  }),
}));
