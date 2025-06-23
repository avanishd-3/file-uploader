import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TabsContent } from "@/components/ui/tabs"
import { MoreVertical } from "lucide-react"
import { Folder, Eye, Download, Edit, Move, Trash2 } from "lucide-react"
import { EmptyState } from "./empty-state"
import type { FileItem, FolderItem, FileorFolderType } from "./file"
import type { JSX } from "react"


{/* Grid layout for files and folders */}
export function TableGrid(
    { filteredFiles, searchQuery, selectedFiles, handleFileAction, setNewFolderModalOpen, setUploadModalOpen, 
        toggleSelection, getFileIcon }
: {
    filteredFiles: (FileItem | FolderItem)[],
    searchQuery: string,
    selectedFiles: string[],
    handleFileAction: (action: string, file: FileItem | FolderItem) => void,
    setNewFolderModalOpen: (open: boolean) => void,
    setUploadModalOpen: (open: boolean) => void,
    toggleSelection: (fileId: string) => void,
    getFileIcon: (type: FileorFolderType) => JSX.Element
}) {
  return (
    <TabsContent value="grid" className="m-0">
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`relative group rounded-lg border bg-card p-2 transition-all hover:shadow-md ${
                selectedFiles.includes(file.id) ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="absolute top-2 right-2">
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onCheckedChange={() => toggleSelection(file.id)}
                  aria-label={`Select ${file.name}`}
                />
              </div>

              <div
                className="flex flex-col items-center p-4 cursor-pointer"
                onClick={() => handleFileAction("open", file)}
              >
                <div className="mb-2 text-4xl">{getFileIcon(file.type)}</div>
                <div className="text-center">
                  <p className="font-medium truncate w-full max-w-[120px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.type === "folder" ? `${(file as FolderItem).items} item${(file as FolderItem).items !== 1 ? "s" : ""}` : (file as FileItem).size}
                  </p>
                </div>
              </div>

              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleFileAction("open", file)}>
                      {file.type === "folder" ? (
                        <>
                          <Folder className="h-4 w-4 mr-2" />
                          Open
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </>
                      )}
                    </DropdownMenuItem>

                    {file.type !== "folder" && (
                      <DropdownMenuItem onClick={() => handleFileAction("download", file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                    )}

                    {file.type === "folder" && (
                      <DropdownMenuItem onClick={() => handleFileAction("download", file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download as ZIP
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => handleFileAction("rename", file)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleFileAction("move", file)}>
                      <Move className="h-4 w-4 mr-2" />
                      Move
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => handleFileAction("delete", file)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          searchQuery={searchQuery}
          onNewFolder={() => setNewFolderModalOpen(true)}
          onUpload={() => setUploadModalOpen(true)}
        />
      )}
    </TabsContent>
  );
}