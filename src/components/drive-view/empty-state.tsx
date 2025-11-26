import { Folder, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from '@/components/ui/empty';

interface EmptyStateProps {
    searchQuery: string,
    onNewFolder: () => void,
    onUpload: () => void,
}

export function EmptyState({ searchQuery, onNewFolder, onUpload }: EmptyStateProps) {
    return (
        <Empty>
            <EmptyHeader>
                <div className='rounded-full bg-muted p-3'>
                    <Folder className="h-6 w-6 text-muted-foreground" />
                </div>
                <EmptyTitle className='text-[1.2rem]'>No files found</EmptyTitle>
                <EmptyDescription>
                    {searchQuery
                            ? `No results found for "${searchQuery}". Try a different search term.`
                            : "This folder is empty. Upload a file or create a new folder."}
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className='-mt-2'>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => onNewFolder()}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Folder
                    </Button>
                    <Button size="sm" onClick={() => onUpload()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                    </Button>
                </div>
            </EmptyContent>
        </Empty>
  );
}