// Dialog for uploading files

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileUploadBox } from "../file-upload-box";

import { Button } from "@/components/ui/button"
import React, { type Dispatch, type SetStateAction } from "react";
import type { FileorFolderItem } from "../../lib/file";

export const UploadModal = ({
  uploadModalOpen,
  setUploadModalOpen,
  setCurrFiles,
  currParentId
}: {
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
  setCurrFiles: Dispatch<SetStateAction<FileorFolderItem[]>>
  currParentId: string | null;
}) => {
    return (
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
                <DialogDescription>Drag and drop a file or click to browse.</DialogDescription>
            </DialogHeader>

            {/* File upload stuff */}
            <FileUploadBox 
              setCurrFiles={setCurrFiles}
              currParentId={currParentId}
            />

            <DialogFooter>
                <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
                Cancel
                </Button>
            </DialogFooter>
            </DialogContent>
      </Dialog>
    )
}