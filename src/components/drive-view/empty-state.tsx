import { Folder, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    searchQuery: string,
    onNewFolder: () => void,
    onUpload: () => void,
}

export function EmptyState({ searchQuery, onNewFolder, onUpload }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3">
                <Folder className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No files found</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                {searchQuery
                ? `No results found for "${searchQuery}". Try a different search term.`
                : "This folder is empty. Upload a file or create a new folder."}
            </p>
            <div className="mt-4 flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => onNewFolder()}>
                <Plus className="h-4 w-4 mr-2" />
                New Folder
                </Button>
                <Button size="sm" onClick={() => onUpload()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
                </Button>
            </div>
        </div>
    )
}