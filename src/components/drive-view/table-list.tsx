import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { formatDate } from "@/lib/utils"
import { EmptyState } from "./empty-state"
import type { FileItem, FolderItem, FileorFolderType } from "./file"
import type { JSX } from "react"

{/* List layout for files and folders */}
export function TableList(
    { filteredFiles, searchQuery, selectedFiles, handleFileAction, setNewFolderModalOpen, setUploadModalOpen, 
        toggleSelectAll, toggleSelection, getFileIcon }
: {
    filteredFiles: (FileItem | FolderItem)[],
    searchQuery: string,
    selectedFiles: string[],
    handleFileAction: (action: string, file: FileItem | FolderItem) => void,
    setNewFolderModalOpen: (open: boolean) => void,
    setUploadModalOpen: (open: boolean) => void,
    toggleSelectAll: () => void,
    toggleSelection: (fileId: string) => void,
    getFileIcon: (type: FileorFolderType) => JSX.Element
}) 
 {
    return (
        <TabsContent value="list" className="m-0">
          {filteredFiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-[300px]">Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id} className={selectedFiles.includes(file.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFiles.includes(file.id)}
                        onCheckedChange={() => toggleSelection(file.id)}
                        aria-label={`Select ${file.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      {/* Part that shows icon and file name */}
                      <div
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => handleFileAction("open", file)}
                      >
                        {getFileIcon(file.type)}
                        <span className="font-medium">{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {file.type === "folder" ? `${(file).items} item${(file).items !== 1 ? "s" : ""}` : (file).size}
                    </TableCell>
                    <TableCell>{formatDate(file.modified)}</TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              searchQuery={searchQuery}
              onNewFolder={() => setNewFolderModalOpen(true)}
              onUpload={() => setUploadModalOpen(true)}
            />
          )}
        </TabsContent>
    )

}