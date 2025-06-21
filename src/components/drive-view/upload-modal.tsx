// Dialog for uploading files

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileUploadwithLoadingState } from "../file-upload-loading";

import { Button } from "@/components/ui/button"
import React from "react";

export const UploadModal = ({
  uploadModalOpen,
  setUploadModalOpen,
}: {
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
}) => {
    return (
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
                <DialogDescription>Drag and drop a file or click to browse.</DialogDescription>
            </DialogHeader>

            {/* File upload stuff */}
            <FileUploadwithLoadingState />

            <DialogFooter>
                <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
                Cancel
                </Button>
            </DialogFooter>
            </DialogContent>
      </Dialog>
    )
}