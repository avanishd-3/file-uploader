/* These utils should only be used on the client */


export const getFileExtension = (fileName: string): string => {
    /***
     * @param fileName - The name of the file (e.g., "document.pdf")
     * This function extracts the file extension from a given file name. If the file name does not have a period, it returns an empty string.
     * This manually handles the ".tar.gz" case to return "tar.gz" as the extension.
     * This does not use extname, since it is not available on the client side.
     * @returns The file extension (e.g., "pdf"). If no extension is found, returns an empty string.
     ***/
    
    const hasPeriod = fileName.includes(".");
    const hasTarGz = fileName.toLowerCase().endsWith(".tar.gz");
    if (hasTarGz) {
        return "tar.gz";
    }
    else if (!hasPeriod) {
        return "";
    }
    else {
        // Convert to lowercase just in case
        return fileName.split(".").pop()?.toLowerCase() ?? "";
    }
}