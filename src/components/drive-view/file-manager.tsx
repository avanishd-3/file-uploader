"use client"

import { useState} from "react"
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

// Sample data
const sampleFiles: FileorFolderItem[] = [
  {
    id: "1",
    name: "Documents",
    type: "folder",
    size: "",
    items: 5,
    modified: new Date("2024-01-20"),
    path: ["Home"],
  },
  {
    id: "2",
    name: "Images",
    type: "folder",
    size: "",
    items: 12,
    modified: new Date("2024-01-18"),
    path: ["Home"],
  },
  {
    id: "3",
    name: "Project Files",
    type: "folder",
    size: "",
    items: 8,
    modified: new Date("2024-01-15"),
    path: ["Home"],
  },
  {
    id: "4",
    name: "Annual Report.pdf",
    type: "pdf",
    size: "2.4 MB",
    modified: new Date("2024-01-10"),
    path: ["Home"],
  },
  {
    id: "5",
    name: "Presentation.pdf",
    type: "pdf",
    size: "3.8 MB",
    modified: new Date("2024-01-05"),
    path: ["Home"],
  },
  {
    id: "6",
    name: "Profile Picture.jpg",
    type: "image",
    size: "1.2 MB",
    modified: new Date("2023-12-28"),
    path: ["Home"],
  },
  {
    id: "7",
    name: "Meeting Notes.docx",
    type: "document",
    size: "245 KB",
    modified: new Date("2023-12-20"),
    path: ["Home"],
  },
  {
    id: "8",
    name: "main.js",
    type: "code",
    size: "56 KB",
    modified: new Date("2023-12-15"),
    path: ["Home"],
  },
]

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

export default function FileManager() {

  // Non-modal states
  const [files, setFiles] = useState<FileorFolderItem[]>(sampleFiles)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [currentPath, setCurrentPath] = useState<string[]>(["Home"])
  const [searchQuery, setSearchQuery] = useState("")

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [activeFile, setActiveFile] = useState<FileorFolderItem | null>(null)

  // New folder name
  const [newFolderName, setNewFolderName] = useState("")
  const [newFileName, setNewFileName] = useState("")

  // Filter files based on current path and search query
  const filteredFiles = files.filter((file) => {
    const pathMatch = JSON.stringify(file.path) === JSON.stringify(currentPath)
    const searchMatch = searchQuery === "" || file.name.toLowerCase().includes(searchQuery.toLowerCase())
    return pathMatch && searchMatch
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
    setCurrentPath([...folder.path, folder.name])
    setSelectedFiles([])
  }

  // Handle breadcrumb navigation
  const navigateToBreadcrumb = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1))
    setSelectedFiles([])
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

  // Create new folder
  const createNewFolder = () => {
    if (newFolderName.trim() === "") return

    const newFolder: FolderItem = {
      id: Date.now().toString(),
      name: newFolderName,
      type: "folder",
      size: "",
      items: 0,
      modified: new Date(),
      path: currentPath,
    }

    setFiles((prev) => [...prev, newFolder])
    setNewFolderName("") // Reset folder name input
    setNewFolderModalOpen(false)
  }

  // Rename file/folder
  const renameFile = () => {
    if (!activeFile || newFileName.trim() === "") return

    setFiles((prev) => prev.map((file) => (file.id === activeFile.id ? { ...file, name: newFileName } : file)))

    setRenameModalOpen(false)
    setActiveFile(null) 
  }

  // Delete file/folder
  const deleteFiles = () => {
    if (selectedFiles.length > 0) {
      setFiles((prev) => prev.filter((file) => !selectedFiles.includes(file.id)))
      setSelectedFiles([])
    } else if (activeFile) {
      setFiles((prev) => prev.filter((file) => file.id !== activeFile.id))
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
            {currentPath.map((path, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`hover:text-primary ${index === currentPath.length - 1 ? "font-medium text-primary" : ""}`}
                >
                  {path}
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
          <TableList
            filteredFiles={filteredFiles}
            selectedFiles={selectedFiles}
            toggleSelection={toggleSelection}
            handleFileAction={handleFileAction}
            searchQuery={searchQuery}
            setSelectedFiles={setSelectedFiles}
            setNewFolderModalOpen={setNewFolderModalOpen}
            setUploadModalOpen={setUploadModalOpen}
            toggleSelectAll={toggleSelectAll}
            getFileIcon={getIcon}
          />
          

          {/* Grid layout for files and folders */}
          <TableGrid
            filteredFiles={filteredFiles}
            selectedFiles={selectedFiles}
            toggleSelection={toggleSelection}
            handleFileAction={handleFileAction}
            searchQuery={searchQuery}
            setSelectedFiles={setSelectedFiles}
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

              {files
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
