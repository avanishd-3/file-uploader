/* These utils should only be used on the client */


export const getFileExtension = (fileName: string): string => {
    /***
     * @param fileName - The name of the file (e.g., "document.pdf")
     * This function extracts the file extension from a given file name. 
     * This does not use extname, since it is not available on the client side.
     * @returns The file extension (e.g., "pdf"). If no extension is found, returns an empty string.
     ***/
     
    // Convert to lowercase just in case
    return fileName.split(".").pop()?.toLowerCase() ?? "";
}