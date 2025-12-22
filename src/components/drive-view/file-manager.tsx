"use client"

import { useState, useRef, useEffect} from "react"
import {
  ChevronRight,
  Folder,
  Grid,
  List,
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  Move,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

import { Kbd } from "@/components/ui/kbd"
import { Tabs } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NameInput } from "./name-input"
import { TableList } from "./table-list"

import type { FileorFolderItem, FileorFolderType, FileWithParent, FolderItem } from "../../lib/file"
import { TableGrid } from "./table-grid"
import { FilePreview } from "./file-preview"
import { cn, formatDate } from "@/lib/utils/utils"
import { handleFileUpload, handleFileUploadWithDifferentParents } from "@/lib/utils/file-upload-util"
import { UploadModal } from "./upload-modal"

import { useParams, useRouter } from "next/navigation"
import { getFilesandFoldersAction } from "@/lib/actions/other-actions"
import { createFolderAction, createFolderReturnIdAction, deleteFolderAction, getFolderByIdAction, moveFolderAction, renameFolderAction } from "@/lib/actions/folder-actions"
import { deleteFileAction, moveFileAction, renameFileAction } from "@/lib/actions/file-actions"
import { toast, Toaster } from "sonner"
import { AudioIcon, CodeIcon, FolderIcon, GenericFileIcon, ImageIcon, PDFIcon, SheetIcon, TextIcon, VideoIcon } from "../ui-icons/icons"
import { downloadFileClient, traverseLocalFileTreeWithFolders, type TraversedEntry } from "@/lib/utils/client-only-utils"

// Helper function to get file icon
const getIcon = (type: FileorFolderType) => {
  switch (type) {
    case "folder":
      return <FolderIcon />
    case "pdf":
      return <PDFIcon />
    case "image":
      return <ImageIcon />
    case "document":
      return <TextIcon />
    case "code":
      return <CodeIcon />
    case "audio":
      return <AudioIcon />
    case "video":
      return <VideoIcon />
    case "sheet":
      return <SheetIcon />
    default:
      return <GenericFileIcon  />
  }
}

// Component to display the destination folder for moving files
function MoveDestinationFolder({
  folder,
  onClick,
  onKeyDown
}: {
  folder: { id?: string; name: string }
  onClick: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void // Make mandatory so accessibility is ensured
}) {
  return (
    <div
      className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"
      onClick={onClick}
      onKeyDown={onKeyDown}
      // Make div focusable for accessibility
      // Also allows using Tab to toggle between folders
      tabIndex={0} 
    >
      <Folder className="h-5 w-5 text-blue-500" />
      <span>{folder.name}</span>
    </div>
  )
}

async function downloadClient(file: FileorFolderItem) {
  if (file.type === "folder") {
    await downloadFileClient(file.name, "/api/downloadFolder");

    return;
  }

  await downloadFileClient(file.url);
}


export default function FileManager(
  {
  initialItems,
  breadcrumbTrail,
  allFolders
  } : {
  initialItems: FileorFolderItem[],
  breadcrumbTrail: FolderItem[],
  allFolders: FolderItem[]
  }
) {
  // Ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus search on Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Get initial files and folders from db based on route params

  const router = useRouter() // Need router to navigate between folders
  const params = useParams() // To get the current folderId from the URL

  // Make sure type is string | null, not string | string[] | null
  // This is because Next.js params can be an array if the route is dynamic
  let currentParentId = params.folderId ?? null
  if (Array.isArray(currentParentId)) {
    console.warn("currentParentId should be a string or null, not an array. Using first element.")
    currentParentId = currentParentId[0] ?? null
  }

  // Non-modal states
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [activeFile, setActiveFile] = useState<FileorFolderItem | null>(null)

  // Get files and folders from the database
  const [filesandFolders, setFilesandFolders] = useState<FileorFolderItem[]>(initialItems);

  // All folders for move modal
  const [allUserFolders, setAllUserFolders] = useState<FolderItem[]>(allFolders);

  // New folder name
  const [newFolderName, setNewFolderName] = useState("")
  const [newFileName, setNewFileName] = useState("")
  
  // Filter files based on current parentId and search query

  // If search query is empty, show all files/folders in the current parent folder
  const filteredFiles = filesandFolders.filter((file) => {
    const parentMatch = file.parentId === (currentParentId ?? null)
    const searchMatch = searchQuery === "" || file.name.toLowerCase().includes(searchQuery.toLowerCase())
    return parentMatch && searchMatch
  })

  // Handle file/folder selection
  const toggleSelection = (id: string) => {
    setSelectedFiles((prev) => (prev.includes(id) ? prev.filter((fileId) => fileId !== id) : [...prev, id]))
  }

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(filteredFiles.map((file) => file.id))
    }
  }

  // Handle folder navigation
  const navigateToFolder = (folder: FolderItem) => {
    router.push(`/drive/${folder.id}`) // Navigate to the folder's URL
    setNewFolderName("") // Reset new folder name
    setSearchQuery("") // Clear search query
    setSelectedFiles([])
  }

  // Handle breadcrumb navigation
  const navigateToBreadcrumb = (index: number) => {
    const newParentId = breadcrumbTrail[index]?.id ?? null

    // Reset state and navigate
    setNewFolderName("") // Reset new folder name
    setSearchQuery("") // Clear search query
    setSelectedFiles([]) // Reset selected files

    if (newParentId === currentParentId) {
      return // No need to navigate if already in the same folder
    }
    else if (newParentId === null) {
      router.push("/drive") // Navigate to root if no parent
    }
    else {
      router.push(`/drive/${newParentId}`) // Navigate to the folder's URL
    }
  }

  // Handle file actions
  const handleFileAction = async (action: string, file: FileorFolderItem) => {
    setActiveFile(file)

    switch (action) {
      case "open":
        // If it's a folder, navigate into it; otherwise, open the preview modal
        if (file.type === "folder") {
          navigateToFolder(file)
        } else {
          setPreviewModalOpen(true)
        }
        break
      case "rename":
        setNewFileName(file.name)
        setRenameModalOpen(true)
        break
      case "move":
        setMoveModalOpen(true)
        break
      case "delete":
        setDeleteModalOpen(true)
        break
      case "preview":
        setPreviewModalOpen(true)
        break
      case "download":
        await downloadClient(file)
        break;
      default:
        break
    }
  }

  // Handle bulk actions
  const handleBulkAction = async (action: string) : Promise<void | Promise<void>> => {
    switch (action) {
      case "delete":
        setDeleteModalOpen(true)
        break
      case "move":
        setMoveModalOpen(true)
        break
      case "download":
        // Download each selected file
        const to_downloadPromises: Promise<void>[] = []
        selectedFiles.forEach((fileId) => {
          const file = filesandFolders.find((f) => f.id === fileId)
          if (file) {
            console.log(`Downloading file: ${file.name}`)
            to_downloadPromises.push(downloadClient(file))
          }
        })

        // Batch download to avoid blocking UI
        await Promise.all(to_downloadPromises)
      default:
        break
    }
  }

  // Create new folder
  const createNewFolder = async () => {
    if (newFolderName.trim() === "") return

    // Add the new folder to the current parent folder's items
    await createFolderAction(
      newFolderName,
      new Date(),
      currentParentId ?? null
    )

    // Add toast notification for folder creation
    // Use breadcrumTrail info to avoid another db call
    toast.success(`${newFolderName} created in ${breadcrumbTrail.length === 0  || breadcrumbTrail[breadcrumbTrail.length - 1] === undefined ? "Home folder" : breadcrumbTrail[breadcrumbTrail.length - 1]?.name}`)

    // Update file list by fetching new list from server
    const newFilesandFolders = await getFilesandFoldersAction(currentParentId);

    const newFolders = newFilesandFolders.filter((item) => item.type === "folder") as FolderItem[];

    console.log("All user folders before folder creation:", allUserFolders);

    // Merge new folders with existing allUserFolders, excluding duplicates
    const newAllFolders = allUserFolders.concat(newFolders.filter((nf) => !allUserFolders.some((of) => of.id === nf.id)));
    
    console.log("All folders after folder creation:", newAllFolders);
    // Replace previous files with new ones
    // This ensures that the UI reflects the latest state of files
    // and folders in the current directory
    setFilesandFolders(() => newFilesandFolders);
    setAllUserFolders(newAllFolders); // Update all folders for move modal
    
    // Reset state
    setNewFolderName("") // Reset folder name input
    setNewFolderModalOpen(false)
  }

  const createNewFolderArguments = async (folderName: string, parentID: string | null) => {

    console.log(`Creating folder ${folderName} in parent ID: ${parentID}`);
    // Add the new folder to the current parent folder's items
    const newFolderId = await createFolderReturnIdAction(
      folderName,
      new Date(),
      parentID
    )

    // Add toast notification for folder creation
    // Use breadcrumTrail info to avoid another db call
    toast.success(`${folderName} created in ${breadcrumbTrail.length === 0  || breadcrumbTrail[breadcrumbTrail.length - 1] === undefined ? "Home folder" : breadcrumbTrail[breadcrumbTrail.length - 1]?.name}`)

    // Update file list by fetching new list from server
    const newFilesandFolders = await getFilesandFoldersAction(parentID);

    const newFolders = newFilesandFolders.filter((item) => item.type === "folder") as FolderItem[];

    // Merge new folders with existing allUserFolders, excluding duplicates
    const newAllFolders = allUserFolders.concat(newFolders.filter((nf) => !allUserFolders.some((of) => of.id === nf.id)));
    
    // Replace previous files with new ones
    // This ensures that the UI reflects the latest state of files
    // and folders in the current directory
    setFilesandFolders(() => newFilesandFolders);
    setAllUserFolders(newAllFolders); // Update all folders for move modal
    
    // Reset state
    setNewFolderModalOpen(false)

    return newFolderId;
  }

  // Rename file/folder
  const renameFile = async () => {
    if (!activeFile || newFileName.trim() === "") return

    // Update folder or file name in the database
    if (activeFile.type === "folder") {
      await renameFolderAction(activeFile.id, newFileName)
    } else {
      await renameFileAction(activeFile.id, newFileName)
    }

    toast.success(`${activeFile.name} renamed to ${newFileName}`)

    // No need to fetch from server, because just renaming a file or folder
    setFilesandFolders((prev) => prev.map((file) => (file.id === activeFile.id ? { ...file, name: newFileName } : file)))

    setRenameModalOpen(false)
    setActiveFile(null) 
  }

  // Delete file/folder
  const deleteFiles = async () => {
    if (selectedFiles.length > 0) {

      // Separate into files and folders so db call can be done
      const filesToDelete = filesandFolders.filter((file) => selectedFiles.includes(file.id) && file.type !== "folder")
      const foldersToDelete = filesandFolders.filter((file) => selectedFiles.includes(file.id) && file.type === "folder")

      const fileDeletePromise = filesToDelete.map((file) => deleteFileAction(file.id))
      const folderDeletePromise = foldersToDelete.map((folder) => deleteFolderAction(folder.id))

      await Promise.all([...fileDeletePromise, ...folderDeletePromise])

      // Show generic success message since it looks better
      toast.success('Selected items deleted successfully!')

      // No need to fetch from server, because just deleting files or folders
      // Create changes the order, so the updated list needs to be fetched from the server
      setFilesandFolders((prev) => prev.filter((file) => !selectedFiles.includes(file.id)))
      setAllUserFolders((prev) => prev.filter((folder) => !selectedFiles.includes(folder.id))) // Update all folders for move modal
      setSelectedFiles([])
    } else if (activeFile) {
      
      if (activeFile.type === "folder") {
        await deleteFolderAction(activeFile.id)
        toast.success(`${activeFile.name} deleted successfully!`)
      }
      else {
        await deleteFileAction(activeFile.id)
        toast.success(`${activeFile.name} deleted successfully!`)
      }

      // Remove the file from the list
      // This ensures that the UI reflects the latest state of files
      // and folders in the current directory

      // No need to fetch from server, because just deleting a file or folder
      // Create changes the order, so the updated list needs to be fetched from the server
      setFilesandFolders((prev) => prev.filter((file) => file.id !== activeFile.id))
      setAllUserFolders((prev) => prev.filter((folder) => folder.id !== activeFile.id)) // Update all folders for move modal
      setActiveFile(null)
    }
  }

  // Move file/folder
  const moveFile = async (newParentId: string | null) => {
    if (selectedFiles.length > 0) {
      // Separate into files and folders so db call can be done
      const filesToMove = filesandFolders.filter((file) => selectedFiles.includes(file.id) && file.type !== "folder")
      const foldersToMove = filesandFolders.filter((file) => selectedFiles.includes(file.id) && file.type === "folder")

      const filestoMovePromise = filesToMove.map((file) => moveFileAction(file.id, newParentId))
      const foldersToMovePromise = foldersToMove.map((folder) => moveFolderAction(folder.id, newParentId))

      await Promise.all([...filestoMovePromise, ...foldersToMovePromise])

      // Show generic success message since it looks better
      toast.success('Selected items moved successfully!')

      // Get file list from server (since items counts are being modified)
      const newFiles = await getFilesandFoldersAction(currentParentId);
      setFilesandFolders(newFiles);

      setSelectedFiles([]) // Reset selected files
    } else if (activeFile) {

      console.log(`Moving ${activeFile.name} to parent ID: ${newParentId}`)

      // Update the parentId of the file or folder in the database
      if (activeFile.type === "folder") {
        await moveFolderAction(activeFile.id, newParentId)
      } else {
        await moveFileAction(activeFile.id, newParentId)
      }

      // Get new folder name for better toast message

      if (newParentId === null) {
        toast.success(`${activeFile.name} moved to Home folder!`)
      }
      else { // Need else for TS to infer that newFolderName is string, not string | null
        const newFolder = await getFolderByIdAction(newParentId);
        toast.success(`${activeFile.name} moved to ${newFolder?.name}!`)
      }

      // Get file list from server (since items counts are being modified)

      const newFiles = await getFilesandFoldersAction(currentParentId);
      setFilesandFolders(newFiles);

      setActiveFile(null) // Reset active file
    }
  }

  // Handle drag and drop from computer to file manager
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    // Run feature detection.
    // See: https://web.dev/patterns/files/drag-and-drop-directories/#progressive_enhancement
    const supportsFileSystemAccessAPI = 'getAsFileSystemHandle' in DataTransferItem.prototype;
    const supportsWebkitGetAsEntry = 'webkitGetAsEntry' in DataTransferItem.prototype;

    if (!supportsFileSystemAccessAPI && !supportsWebkitGetAsEntry) {
      console.warn('The File System Access API and webkitGetAsEntry are not supported in this browser.');
      toast.warning("Your browswer does not support dropping folders")
      // Handle file upload directly
      const files = e.dataTransfer.files
      if (files.length > 0) {
        await handleFileUpload(Array.from(files), () => {return}, () => {return}, currentParentId, () => {return}, setFilesandFolders);
      }
    }
    else {
      let allEntries: TraversedEntry[] = [];

      for (const item of Array.from(e.dataTransfer.items)) {
        
        // @ts-expect-error -- getAsFileSystemHandle is experimental (not in Firefox or Safari) but supported since Chrome 86
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call 
        const entry: FileSystemEntry | null = supportsFileSystemAccessAPI ? item.getAsFileSystemHandle() : item.webkitGetAsEntry();
        if (entry) {
          const entries = await traverseLocalFileTreeWithFolders(entry);
          allEntries = allEntries.concat(entries);
        }
      }

      // Separate files and folders & remove .DS_Store files
      const folders = allEntries.filter(e => e.type === "folder") as { type: "folder"; relativePath: string }[];
      const files = allEntries.filter(e => e.type === "file" && e.file.name !== ".DS_Store") as { type: "file"; file: File; relativePath: string }[];

      console.log("All folders from drop:", folders);
      console.log("All files from drop:", files);

      // For this implementation to work, you must assume entries are in BFS order

      // Create folders first
      // Track created folders to quickly get IDs when creating files
      // Files must either be in root drop folder or newly created folder
      // So only need to track newly created folders from this drop event
      const newFolderInfo: {name: string, path: string[], id: string | null}[] = []; 

      // Can use tracking approach b/c entries are in BFS order
      let insertParentId = currentParentId;
      let potentialParentId = currentParentId;
      let prevParentName = "";

      for (const folderEntry of folders) {
        const slashCount = folderEntry.relativePath.split("/").length - 1;

        if (slashCount === 0) {
          continue; // This should not happen, but just in case
        }

        // Need this condition b/c cannot parse a parentName
        // So the else condition would skip creating top-level folders
        else if (slashCount === 1) {
          // Top-level folder

          // Reset tracking variables
          insertParentId = currentParentId;
          potentialParentId = currentParentId;
          prevParentName = "";

          const folderName = folderEntry.relativePath.split("/")[0];
          console.log(`Top-level folder detected: ${folderName}`);

          if (folderName === "" || folderName === undefined) {
            continue;
          }

          console.log(`Creating top-level folder: ${folderName}`);
          potentialParentId = await createNewFolderArguments(folderName, insertParentId);
          newFolderInfo.push({ name: folderName, path: [folderName], id: potentialParentId });
        }

        else {
          // Nested folder
          console.log(`Nested folder detected: ${folderEntry.relativePath}`);
          const pathParts = folderEntry.relativePath.split("/"); // Ex: ["New", "New 2", ""] for New/New 2/
          const parentName = pathParts[pathParts.length - 3]; 
          const folderName = pathParts[pathParts.length - 2];
          console.log(`Folder name: ${folderName}`);
          if (!parentName || parentName === "" || !folderName || folderName === "") {
            continue;
          }
          console.log(`Parent folder for nested folder ${folderEntry.relativePath} is ${parentName}`);

          // Since entries are sorted in BFS order, can assume entering subfolder if parent folder name changes
          if (prevParentName !== parentName) {
            insertParentId = potentialParentId;
            prevParentName = parentName;
          }
          
          console.log(`Creating nested folder: ${folderName} in parent ID: ${insertParentId}`);
          potentialParentId = await createNewFolderArguments(folderName, insertParentId);
          // Ex: ['New', 'New 2'] for New/New 2/ original path
          newFolderInfo.push({ name: folderName, path: folderEntry.relativePath.split("/").slice(0, -1), id: potentialParentId });
        }
      }

      console.log("All new folders created from drop:", newFolderInfo);

      // File creation
      const fileInfo: FileWithParent[] = [];
      for (const fileEntry of files) {
        const slashCount = fileEntry.relativePath.split("/").length - 1;

        if (slashCount === 0) { // Top-level file

          const fileName = fileEntry.file.name;
          console.log(`Top-level file detected: ${fileName}`);
          fileInfo.push({ file: fileEntry.file, parentId: currentParentId });
        }

        else {
          // Nested file
          console.log(`Nested file detected: ${fileEntry.relativePath}`); // Ex: New/New 2/new.xlsx
          const pathParts = fileEntry.relativePath.split("/");
          const pathFolderOnly = pathParts.slice(0, -1); // Ex: ["New", "New 2"] for New/New 2/new.xlsx

          function matchingFolders(folderPath: string, targetPath: string): boolean {
            return folderPath === targetPath
          };

          const parentFolder = newFolderInfo.find(folder => matchingFolders(folder.path.join("/"), pathFolderOnly.join("/")));
          const parentName = parentFolder ? parentFolder.name : "";
          const parentFolderId = parentFolder ? parentFolder.id : null;
          
          console.log(`Parent folder for nested file ${fileEntry.relativePath} is ${parentName} with ID: ${parentFolderId}`);

          fileInfo.push({ file: fileEntry.file, parentId: parentFolderId ?? null});
        }
      }

      // Upload files all at once to minimize network requests
      await handleFileUploadWithDifferentParents(fileInfo, () => {return}, () => {return}, currentParentId, () => {return}, setFilesandFolders);
    }
  };

  return (
    // Card should have drop handlers to maximize drop area
    // Also highlight card when dragging files over it so user knows they can drop files here
    // Dashed border with this color is good enough
    <Card className={cn(isDragging ? "border-4 border-dashed border-primary/70 bg-primary/10" : "", "w-full max-w-6xl mx-auto shadow-md")}
     onDragOver={handleDragOver}
     onDragLeave={handleDragLeave}
     onDrop={handleDrop}>
      <CardHeader className="p-4 border-b">
        
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">

          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <button
              onClick={() => navigateToBreadcrumb(-1)}
              className={`hover:text-primary ${breadcrumbTrail.length === 0 ? "font-medium text-primary" : ""}`}
            >
              Home
            </button>
            {breadcrumbTrail.map((folder, index) => (
              <div key={folder.id} className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-1" />
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`hover:text-primary ${index === breadcrumbTrail.length - 1 ? "font-medium text-primary" : ""}`}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>

          {/* Actions Toolbar */}
          <div className="flex items-center space-x-2">
            <div className="flex w-full max-w-xs flex-col gap-6">
              <InputGroup>
                <InputGroupInput placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  ref={searchInputRef}
                />
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <Button variant="outline" size="sm" onClick={() => setNewFolderModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>

            <Button size="sm" onClick={() => setUploadModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>

            <div className="hidden md:flex border rounded-md">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-r-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
                <span className="sr-only">List view</span>
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-l-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
                <span className="sr-only">Grid view</span>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Bulk Actions Toolbar */}
      {selectedFiles.length > 0 && (
        <div className="bg-muted/50 p-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedFiles([])}>
              <X className="h-4 w-4 mr-2" />
              Deselect
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedFiles.length} item{selectedFiles.length !== 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkAction("download")}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction("move")}>
              <Move className="h-4 w-4 mr-2" />
              Move
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleBulkAction("delete")}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Where files and folders are actually displayed */}
      <CardContent className="p-0">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "grid")}>
          {/* List layout for files and folders */}

          {/* Should render all children of current parentId */}
          <TableList
            filteredFiles={filteredFiles}
            selectedFiles={selectedFiles}
            toggleSelection={toggleSelection}
            handleFileAction={handleFileAction}
            searchQuery={searchQuery}
            setNewFolderModalOpen={setNewFolderModalOpen}
            setUploadModalOpen={setUploadModalOpen}
            toggleSelectAll={toggleSelectAll}
            getFileIcon={getIcon}
          />
          

          {/* Grid layout for files and folders */}

          {/* Should render all children of current parentId */}
          <TableGrid
            filteredFiles={filteredFiles}
            selectedFiles={selectedFiles}
            toggleSelection={toggleSelection}
            handleFileAction={handleFileAction}
            searchQuery={searchQuery}
            setNewFolderModalOpen={setNewFolderModalOpen}
            setUploadModalOpen={setUploadModalOpen}
            getFileIcon={getIcon}
          />
        </Tabs>
      </CardContent>

      {/* Upload Modal */}
      <UploadModal
        uploadModalOpen={uploadModalOpen}
        setUploadModalOpen={setUploadModalOpen}
        setCurrFiles={setFilesandFolders}
        currParentId={currentParentId}
      />

      {/* New Folder Modal */}
      <Dialog open={newFolderModalOpen} onOpenChange={setNewFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter a name for your new folder.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <NameInput
                placeholder="Folder Name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                // Create new folder on Enter key press
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    await createNewFolder()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createNewFolder}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Modal */}
      <Dialog open={renameModalOpen} onOpenChange={setRenameModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {activeFile?.type === "folder" ? "Folder" : "File"}</DialogTitle>
            <DialogDescription>
              Enter a new name for your {activeFile?.type === "folder" ? "folder" : "file"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <NameInput
                placeholder={activeFile?.type === "folder" ? "Folder Name" : "File Name"}
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                // Rename file on Enter key press
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    await renameFile()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={renameFile}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        {/* Allow delete with Enter for consistency */}
        <DialogContent onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                await deleteFiles()
                setDeleteModalOpen(false) // Close modal after deletion
              }
            }}>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {/* Space after question mark so sentences have space between them */}
              {selectedFiles.length > 0
                ? `Are you sure you want to delete ${selectedFiles.length} selected item${selectedFiles.length !== 1 ? "s" : ""}? `
                : `Are you sure you want to delete ${activeFile?.name}? `}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={async () => {
              await deleteFiles()
              setDeleteModalOpen(false) // Close modal after deletion
            }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Modal */}
      {/* Allow using tab navigation and enter for consistency and accessibility */}
      <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {selectedFiles.length > 0 ? "Items" : activeFile?.name}</DialogTitle>
            <DialogDescription>Select a destination folder.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[200px] rounded-md border p-4">
            {/* This ensures that root folder is always displayed at the top */}
            <div className="space-y-2">
              <MoveDestinationFolder
                folder={{name: "Home"}}
                onClick={async () => {
                  // Move file/folder to root folder
                  await moveFile(null)
                  setMoveModalOpen(false)
                }}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    await moveFile(null)
                    setMoveModalOpen(false)
                  }
                }}
              />

              {/* No need to filter out files b/c allUserFolders is FolderItem[] */}
              {allUserFolders
                .filter((folder) => folder.id !== currentParentId) // Exclude current parent b/c can't move into same folder
               .filter((folder) => activeFile?.type !== "folder" || folder.id !== activeFile.id) // Exclude self if moving folder
                .map((folder) => (
                  <MoveDestinationFolder
                    key={folder.id}
                    folder={folder}
                    onClick={async () => {
                      // Move file/folder to the selected folder
                      await moveFile(folder.id)
                      setMoveModalOpen(false)
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        await moveFile(folder.id)
                        setMoveModalOpen(false)
                      }
                    }}
                  />
                ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <FilePreview
        previewModalOpen={previewModalOpen}
        setPreviewModalOpen={setPreviewModalOpen}
        activeFile={activeFile}
        formatDate={(date: Date) => formatDate(date)}
        getFileIcon={getIcon}
      />

      {/* Toaster */}
      <Toaster>
      </Toaster>
    </Card>
  )
}
