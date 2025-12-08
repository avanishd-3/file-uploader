import DriveUI from "@/components/drive-page";


export default async function DrivePage({ params }: { params: Promise<{ folderId?: string }> }) {
    const folderId = (await params).folderId;
    const parentId = folderId ?? null;

    // Use Drive Page to render file manager (so can duplicate for /drive)
    return (
        <DriveUI parentId={parentId} />
    )

}