import { describe, expect, test } from "vitest";
import { traverseLocalFileTreeWithFolders } from "@/lib/utils/client-only-utils";

describe("traverseLocalFileTreeWithFolders tests", () => {
    // Mock FileSystemEntry structure
        const mockFileEntry = (fileName: string): FileSystemFileEntry => ({
            isFile: true,
            isDirectory: false,
            name: fileName,
            fullPath: `/${fileName}`,
            filesystem: {} as FileSystem,
            file: (callback: (file: File) => void) => {
                const file = new File(["content"], fileName, { type: "text/plain" });
                callback(file);
            },
        } as FileSystemFileEntry);

        const mockDirectoryEntry = (dirName: string, entries: FileSystemEntry[]): FileSystemDirectoryEntry => ({
            isFile: false,
            isDirectory: true,
            name: dirName,
            fullPath: `/${dirName}`,
            filesystem: {} as FileSystem,
            createReader: () => ({
                readEntries: (callback: (entries: FileSystemEntry[]) => void) => {
                    callback(entries);
                },
            }),
        } as FileSystemDirectoryEntry);

    test("traverseLocalFileTree no folder nesting", async () => {
        const file1 = mockFileEntry("file1.txt");
        const file2 = mockFileEntry("file2.txt");
        const rootDir = mockDirectoryEntry("root", [file1, file2]);

        const entries = await traverseLocalFileTreeWithFolders(rootDir);
        expect(entries).toHaveLength(3);
        expect(entries).toEqual([
            { type: "folder", relativePath: "root/" },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { type: "file", file: expect.objectContaining({ name: "file1.txt" }), relativePath: "root/file1.txt" },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { type: "file", file: expect.objectContaining({ name: "file2.txt" }), relativePath: "root/file2.txt" },
        ]);
    });

    test("traverseLocalFileTree one level of folder nesting, all files in subfolder", async () => {
        const file1 = mockFileEntry("file1.txt");
        const file2 = mockFileEntry("file2.txt");
        
        const subDir = mockDirectoryEntry("subfolder", [file1, file2]);
        const rootDir = mockDirectoryEntry("root", [subDir]);

        const entries = await traverseLocalFileTreeWithFolders(rootDir);
        expect(entries).toHaveLength(4);
        expect(entries).toEqual([
            { type: "folder", relativePath: "root/" },
            { type: "folder", relativePath: "root/subfolder/" },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { type: "file", file: expect.objectContaining({ name: "file1.txt" }), relativePath: "root/subfolder/file1.txt" },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { type: "file", file: expect.objectContaining({ name: "file2.txt" }), relativePath: "root/subfolder/file2.txt" },
        ]);
    });

    test("traverseLocalFileTree one level of folder nesting, not all files in subfolder", async () => {
        const file1 = mockFileEntry("file1.txt");
        const file2 = mockFileEntry("file2.txt");
        
        const subDir = mockDirectoryEntry("subfolder", [file2]);
        const rootDir = mockDirectoryEntry("root", [subDir, file1]);

        const entries = await traverseLocalFileTreeWithFolders(rootDir);
        expect(entries).toHaveLength(4);
        expect(entries).toEqual([
            { type: "folder", relativePath: "root/" },
            { type: "folder", relativePath: "root/subfolder/" },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { type: "file", file: expect.objectContaining({ name: "file1.txt" }), relativePath: "root/file1.txt" },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { type: "file", file: expect.objectContaining({ name: "file2.txt" }), relativePath: "root/subfolder/file2.txt" },
        ]);
    });

    test("traverseLocalFileTree two levels of folder nesting, all files in subfolder", async () => {
        const file1 = mockFileEntry("file1.txt");
        const file2 = mockFileEntry("file2.txt");
        
        
        const smallDir = mockDirectoryEntry("smallfolder", [file1, file2]);
        const subDir = mockDirectoryEntry("subfolder", [smallDir]);
        const rootDir = mockDirectoryEntry("root", [subDir]);

        const entries = await traverseLocalFileTreeWithFolders(rootDir);
        expect(entries).toHaveLength(5);
        expect(entries).toEqual([
            { type: "folder", relativePath: "root/" },
            { type: "folder", relativePath: "root/subfolder/" },
            { type: "folder", relativePath: "root/subfolder/smallfolder/" },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { type: "file", file: expect.objectContaining({ name: "file1.txt" }), relativePath: "root/subfolder/smallfolder/file1.txt" },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { type: "file", file: expect.objectContaining({ name: "file2.txt" }), relativePath: "root/subfolder/smallfolder/file2.txt" },
        ]);
    });

    test("traverseLocalFileTree one level of folder nesting, files split between subfolders", async () => {
        const file1 = mockFileEntry("file1.txt");
        const file2 = mockFileEntry("file2.txt");
        
        
        const subDirTwo = mockDirectoryEntry("subfolder2", [file1]);
        const subDirOne = mockDirectoryEntry("subfolder1", [file2]);
        const rootDir = mockDirectoryEntry("root", [subDirOne, subDirTwo]);

        const entries = await traverseLocalFileTreeWithFolders(rootDir);
        expect(entries).toHaveLength(5);
        expect(entries).toEqual([
            { type: "folder", relativePath: "root/" },
            { type: "folder", relativePath: "root/subfolder1/" },
            { type: "folder", relativePath: "root/subfolder2/" },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { type: "file", file: expect.objectContaining({ name: "file2.txt" }), relativePath: "root/subfolder1/file2.txt" },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { type: "file", file: expect.objectContaining({ name: "file1.txt" }), relativePath: "root/subfolder2/file1.txt" },
            
        ]);
    });
});