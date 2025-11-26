// Seed database with initial data
import { db } from "@/server/db";
import { createFile } from "@/data-access/file-access";
import { createFolder } from "@/data-access/folder-access";
import type { FileItem, FolderItem } from "@/lib/file";

// Sample data to seed the database

// Note: Ids are not UUIDs here, so database seeding will not work properly for non-null parentId
const sampleFolders: FolderItem[] = [
  {
    id: "1",
    name: "Documents",
    type: "folder",
    items: 5,
    modified: new Date("2024-01-20"),
    parentId: null,
  },
  {
    id: "2",
    name: "Images",
    type: "folder",
    items: 12,
    modified: new Date("2024-01-18"),
    parentId: null,
  },
  {
    id: "3",
    name: "Project Files",
    type: "folder",
    items: 8,
    modified: new Date("2024-01-15"),
    parentId: null,
  },
  {
    id: "9",
    name: "Archived",
    type: "folder",
    items: 20,
    modified: new Date("2023-12-30"),
    parentId: "1",
  },
  {
    id: "10",
    name: "Shared with Me",
    type: "folder",
    items: 10,
    modified: new Date("2023-12-25"),
    parentId: null,
  },
]


const sampleFiles: FileItem[] = [
  
  {
    id: "4",
    name: "Annual Report.pdf",
    type: "pdf",
    size: "2.4 MB",
    modified: new Date("2024-01-10"),
    parentId: null,
    url: "/uploads/annual_report.pdf", // Example URL, adjust as needed
  },
  {
    id: "5",
    name: "Presentation.pdf",
    type: "pdf",
    size: "3.8 MB",
    modified: new Date("2024-01-05"),
    parentId: null,
    url: "/uploads/presentation.pdf", // Example URL, adjust as needed
  },
  {
    id: "6",
    name: "Profile Picture.jpg",
    type: "image",
    size: "1.2 MB",
    modified: new Date("2023-12-28"),
    parentId: null,
    url: "/uploads/profile_picture.jpg", // Example URL, adjust as needed
  },
  {
    id: "7",
    name: "Meeting Notes.docx",
    type: "document",
    size: "245 KB",
    modified: new Date("2023-12-20"),
    parentId: null,
    url: "/uploads/meeting_notes.docx", // Example URL, adjust as needed
  },
  {
    id: "8",
    name: "main.js",
    type: "code",
    size: "56 KB",
    modified: new Date("2023-12-15"),
    parentId: "1",
    url: "/uploads/main.js", // Example URL, adjust as needed
  },
];

// Function to seed the database with initial data
export async function seedDatabase() {
    const createFoldersPromise: Promise<any>[] = [];
    const createFilesPromise: Promise<any>[] = [];

    // Check if folders already exist to avoid duplication
    const existingFolders = await db.query.folder.findMany();

    if (existingFolders.length === 0) {
        // Insert sample folders
        for (const folder of sampleFolders) {
            createFoldersPromise.push(createFolder(folder.name, folder.modified, folder.parentId));
        }
    }
    
    // Check if files already exist to avoid duplication
    const existingFiles = await db.query.file.findMany();
    if (existingFiles.length === 0) {
        // Insert sample files
        for (const file of sampleFiles) {
            createFilesPromise.push(createFile(file.name, file.type, file.size, file.modified, file.parentId, file.url));
        }
    }

    // Wait for all folder and file creation promises to resolve
    const filteredPromises = [...createFoldersPromise, ...createFilesPromise].filter(p => p !== undefined && p !== null);
    
    // The length will only be 0 if this function is called multiple times
    if (filteredPromises.length > 0) {
        await Promise.all(filteredPromises);
    }

    console.log("Database seeded with initial data.");
}