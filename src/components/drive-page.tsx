import { getFilesByParentId } from "@/data-access/file-access";
import { getFoldersByParentId } from "@/data-access/folder-access";
import FileManager from "./drive-view/file-manager";
import { getBreadcrumbs } from "@/lib/server-only-utils";

export default async function DriveUI({ parentId}: { parentId: string | null}) {
    // Fetch initial files and folders
    const [files, folders] = await Promise.all([
        getFilesByParentId(parentId),
        getFoldersByParentId(parentId),
    ]);

    // Combine files and folders into a single array
    // Put folders first, so they are displayed at the top (this looks better)
    const initialStuff = [...folders, ...files];

    // Get breadcrumbs
    const breadcrumbs = await getBreadcrumbs(parentId);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center">
            <FileManager initialItems={initialStuff} breadcrumbTrail={breadcrumbs} />
        </main>
    )
}
    