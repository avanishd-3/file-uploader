import DriveUI from "@/components/drive-page";


export default async function DrivePage({ params }: { params: { folderId?: string } }) {
    // Params are async in Next 15, so we need to await them
    // https://nextjs.org/docs/messages/sync-dynamic-apis
    
    const { folderId } = await params;
    const parentId = folderId ?? null;

    // Use Drive Page to render file manager (so can duplicate for /drive)
    return (
        <DriveUI parentId={parentId} />
    )

}