/* Utils that can only run on client side */
/* They all rely on browser APIs, like window */

import { toast } from "sonner";

export async function downloadFileClient(file_info: string, uri = "/api/downloadFile") {
  /**
   * Client-side function to download a file from the server.
   * @param file_info - The path or identifier of the file to download. For folders, this is the folder name. For files, 
   * this is the file URL.
   * @param uri - The API endpoint to fetch the file from. Defaults to "/api/downloadFile". For folders, use "/api/downloadFolder".
   */

  // See: https://www.geeksforgeeks.org/reactjs/how-to-implement-file-download-in-nextjs-using-an-api-route/
  await fetch(uri + "?path=" + encodeURIComponent(file_info)).then(async res => { // Path is a misnomer for folder, but it keeps consistency
    if (!res.ok) {
      toast.error("Failed to download file.");
      return;
    }
    const responseBlob = await res.blob();

    // Create a temporary anchor element to trigger the download
    const url = window.URL.createObjectURL(new Blob([responseBlob.slice()], { type: responseBlob.type }));
    const link = document.createElement('a');

    link.href = url;

    // Set filename received in response
    const downloadFileName = file_info.split('/').pop() ?? 'downloaded_file';
    link.setAttribute('download', downloadFileName);

    // Append to the document and trigger click
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    });
}