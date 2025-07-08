"use client"

import { use, useState, useTransition} from "react"
import {
  ChevronRight,
  FileText,
  Folder,
  Grid,
  List,
  Plus,
  Search,
  Upload,
  File,
  FileIcon as FilePdf,
  FileImage,
  FileCode,
  Download,
  Trash2,
  Move,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NameInput } from "./name-input"
import { TableList } from "./table-list"

import type { FileorFolderItem, FileorFolderType, FolderItem } from "./file"
import { TableGrid } from "./table-grid"
import { FilePreview } from "./file-preview"
import { formatDate } from "@/lib/utils"
import { UploadModal } from "./upload-modal"

import { useParams, useRouter } from "next/navigation"
import { createFolderAction, getFilesandFoldersAction } from "@/lib/actions"

// Helper function to get file icon
const getIcon = (type: FileorFolderType) => {
  switch (type) {
    case "folder":
      return <Folder className="h-5 w-5 text-blue-500" />
    case "pdf":
      return <FilePdf className="h-5 w-5 text-red-500" />
    case "image":
      return <FileImage className="h-5 w-5 text-green-500" />
    case "document":
      return <FileText className="h-5 w-5 text-yellow-500" />
    case "code":
      return <FileCode className="h-5 w-5 text-purple-500" />
    default:
      return <File className="h-5 w-5 text-gray-500" />
  }
}

// Component to display the destination folder for moving files
function MoveDestinationFolder({
  folder,
  onClick,
}: {
  folder: { id?: string; name: string }
  onClick: () => void
}) {
  return (
    <div
      className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"
      onClick={onClick}
    >
      <Folder className="h-5 w-5 text-blue-500" />
      <span>{folder.name}</span>
    </div>
  )
}

export default function FileManager(
  {
  initialItems,
  breadcrumbTrail
  } : {
  initialItems: FileorFolderItem[],
  breadcrumbTrail: FolderItem[]
  }
) {

  // Get initial files and folders from db based on route params

  const router = useRouter() // Need router to navigate between folders
  const params = useParams() // To get the current folderId from the URL

  // Make sure type is string | null, not string | string[] | null
  // This is because Next.js params can be an array if the route is dynamic
  let currentParentId = params.folderId ?? null
  if (Array.isArray(currentParentId)) {
    console.warn("currentParentId should be a string or null, not an array. Using first element.")
    currentParentId = currentParentId[0] || null
  }

  // Non-modal states
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [isPending, startTransition] = useTransition()

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

  // New folder name
  const [newFolderName, setNewFolderName] = useState("")
  const [newFileName, setNewFileName] = useState("")

  // TODO -> Fix this
  // Helper to build breadcrumb trail from root to current folder
  const getBreadcrumbTrail = (): FolderItem[] => {
    const trail: FolderItem[] = []
    let parentId = currentParentId
    while (parentId) {
      const folder = filesandFolders.find(f => f.id === parentId && f.type === "folder") as FolderItem | undefined
      console.log(filesandFolders)
      if (!folder) break
      trail.unshift(folder)
      parentId = folder.parentId
    }
    return trail
  }
  
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
  const handleFileAction = (action: string, file: FileorFolderItem) => {
    setActiveFile(file)

    switch (action) {
      case "open":
        // If it's a folder, navigate into it; otherwise, open the preview modal
        if (file.type === "folder") {
          navigateToFolder(file as FolderItem)
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
      default:
        break
    }
  }

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    switch (action) {
      case "delete":
        setDeleteModalOpen(true)
        break
      case "move":
        setMoveModalOpen(true)
        break
      default:
        break
    }
  }

  /* TODO -> Update all of these functions to use the database instead of local state */

  // Create new folder
  const createNewFolder = async () => {
    if (newFolderName.trim() === "") return

    const newFolder: FolderItem = {
      id: Date.now().toString(),
      name: newFolderName,
      type: "folder",
      items: 0,
      modified: new Date(),
      parentId: currentParentId ?? null,
    }

    // Add the new folder to the current parent folder's items
    await createFolderAction(
      newFolderName,
      new Date(),
      currentParentId ?? null
    )

    // Update file list by fetching new list from server
    const newFiles = await getFilesandFoldersAction(currentParentId);

    // Replace previous files with new ones
    // This ensures that the UI reflects the latest state of files
    // and folders in the current directory
    setFilesandFolders(() => newFiles);
    
    // Reset state
    setNewFolderName("") // Reset folder name input
    setNewFolderModalOpen(false)
  }

  // Rename file/folder
  const renameFile = () => {
    if (!activeFile || newFileName.trim() === "") return

    setFilesandFolders((prev) => prev.map((file) => (file.id === activeFile.id ? { ...file, name: newFileName } : file)))

    setRenameModalOpen(false)
    setActiveFile(null) 
  }

  // Delete file/folder
  const deleteFiles = () => {
    if (selectedFiles.length > 0) {
      setFilesandFolders((prev) => prev.filter((file) => !selectedFiles.includes(file.id)))
      setSelectedFiles([])
    } else if (activeFile) {
      setFilesandFolders((prev) => prev.filter((file) => file.id !== activeFile.id))
      setActiveFile(null)
    }

    setDeleteModalOpen(false)
  }

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-md">
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
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search files..."
                className="w-full pl-8 md:w-[200px] lg:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    createNewFolder()
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    renameFile()
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {selectedFiles.length > 0
                ? `Are you sure you want to delete ${selectedFiles.length} selected item${selectedFiles.length !== 1 ? "s" : ""}?`
                : `Are you sure you want to delete "${activeFile?.name}"?`}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteFiles}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Modal */}
      <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {selectedFiles.length > 0 ? "Items" : activeFile?.name}</DialogTitle>
            <DialogDescription>Select a destination folder.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[200px] rounded-md border p-4">
            <div className="space-y-2">
              <MoveDestinationFolder
                folder={{name: "Home"}}
                onClick={() => {
                  // TODO -> Implement move logic
                  setMoveModalOpen(false)
                }}
              />

              {filesandFolders
                .filter((file) => file.type === "folder")
                .map((folder) => (
                  <MoveDestinationFolder
                    key={folder.id}
                    folder={folder}
                    onClick={() => {
                      // TODO -> Implement move logic
                      setMoveModalOpen(false)
                    }}
                  />
                ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setMoveModalOpen(false)}>Move Here</Button>
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
    </Card>
  )
}
