"use client";
import type { FileItem, FileorFolderItem, FolderItem } from "./file";

// Sample data
export const sampleFolders: FolderItem[] = [
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


export const sampleFiles: FileItem[] = [
  
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


export const sampleFilesAndFolders: FileorFolderItem[] = [
  ...sampleFolders,
  ...sampleFiles,
];