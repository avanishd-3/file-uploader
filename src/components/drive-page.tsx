import { getAllFoldersAction } from "@/lib/actions/folder-actions";
import FileManager from "./drive-view/file-manager";
import { getBreadcrumbsAction, getFilesandFoldersAction } from "@/lib/actions/other-actions";

export default async function DriveUI({ parentId}: { parentId: string | null}) {
    // Fetch initial files and folders
    const initialStuff = await getFilesandFoldersAction(parentId);

    // Get breadcrumbs
    const breadcrumbs = await getBreadcrumbsAction(parentId);

    // Get all folders for move modal
    // TODO -> Use lazy loading or SWR for better performance
    const allFolders = await getAllFoldersAction();

    return (
        <main className="flex min-h-screen flex-col items-center justify-center">
            <FileManager initialItems={initialStuff} breadcrumbTrail={breadcrumbs} allFolders={allFolders} />
        </main>
    )
}
    