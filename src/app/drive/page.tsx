import DriveUI from "@/components/drive-page";

export default async function DriveRootPage() {
    const parentId = null;
    
    // Use Drive Page to render file manager (so can duplicate for /drive)
    return (
        <DriveUI parentId={parentId} />
    )
}