import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEffect, useState, type JSX } from "react"
import { AudioIcon, CodeIcon, GenericFileIcon, ImageIcon, PDFIcon, SheetIcon, TextIcon, VideoIcon } from "../ui-icons/icons"
import type { FileItem, FileorFolderItem, FileorFolderType } from "../../lib/file"

import type { BundledLanguage } from "@/components/kibo-ui/code-block"
import { CodeBlock, type CodeBlockData, CodeBlockBody, CodeBlockContent, CodeBlockCopyButton, CodeBlockFilename, CodeBlockFiles, CodeBlockHeader, CodeBlockItem, CodeBlockSelect, CodeBlockSelectContent, CodeBlockSelectItem, CodeBlockSelectTrigger, CodeBlockSelectValue } from "@/components/kibo-ui/code-block"

import Image from "next/image"
import { checkFileExistsAction, parseSpreadsheetAction, readFileContentAction } from "@/lib/actions/other-actions";
import { MediaPlayer, MediaPlayerAudio, MediaPlayerControls, MediaPlayerControlsOverlay, MediaPlayerFullscreen, MediaPlayerLoop, MediaPlayerPlay, MediaPlayerPlaybackSpeed, MediaPlayerSeek, MediaPlayerSeekBackward, MediaPlayerSeekForward, MediaPlayerTime, MediaPlayerVideo, MediaPlayerVolume } from "../ui/media-player"
import { toast } from "sonner"

import { usePapaParse } from "react-papaparse";

import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "../data-table/data-table"
import { DataTableColumnHeader } from "../data-table/data-table-column-header"
import type { ParseStepResult } from "papaparse"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTableHeaders = (rows: any[]): ColumnDef<any>[] => {
    /**
     * @param data - An array of objects representing the data rows
     * @description This function extracts the column names from the first row of the data array
     * and returns an array of ColumnDef objects for use in a Tanstack data table.
     * See: https://ui.shadcn.com/docs/components/data-table#column-definitions
     * @returns An array of ColumnDef representing the headers. If the data array is empty, returns an empty array.
     **/

    if (rows.length === 0) {
        return [];
    }
    else {
      // Add column headers for data table
      // See: https://ui.shadcn.com/docs/components/data-table#column-definitions
      
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

      // Have this be any, otherwise the column definition in the header fails
      // This is correct, it's just too much work to convince the TS compiler

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const columns: ColumnDef<any>[] = headers.map((header) => ({
        accessorKey: header,
        // Make any header sortable and hideable
        // See: https://ui.shadcn.com/docs/components/data-table#column-header
        header: ({ column}) => (
          <DataTableColumnHeader column={column} title={header} />
        )
      }));

      return columns;
    }
  }

/**
 * Note: If an iframe fails to render something that exists, it will download it instead.
 * Note: The eslint disables are all b/c this parses arbirtrary CSVs, so any needs to be used a lot
 */
export function FilePreview({  previewModalOpen,
  setPreviewModalOpen, activeFile, formatDate, getFileIcon } : {
  previewModalOpen: boolean,
  setPreviewModalOpen: (open: boolean) => void,
  activeFile: FileorFolderItem | null,
  formatDate: (date: Date) => string,
  getFileIcon: (type: FileorFolderType) => JSX.Element
}) {

  // This should only be used if activeFile is an audio file
  const activeFileUrl = activeFile && (activeFile as FileItem).url ? (activeFile as FileItem).url : ""

  // Code block data for code files
  let code: CodeBlockData[] = [];

  // 1 use effect for multi-type file fetching to prevent excessive re-renders
  const [codeText, setCodeText] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [sheetParseError, setSheetParseError] = useState<boolean>(false);
  const { readRemoteFile } = usePapaParse();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sheetTableColumns, setSheeTableColumns] = useState<ColumnDef<any>[]>([]); // Columns for CSV data table

  useEffect(() => {
    // Destruct into array of JSON for code block
    const getData = async () => {
      // Reset data on active file change
      // Otherwise switching between files shows old data briefly, which is jarring
      setCodeText("");
      setSheetData([]);
      setSheeTableColumns([]);
      setSheetParseError(false);

      // Fetch code content
      if (activeFile !== null && activeFile.type === "code") { // Technically extra effect runs but we need to check when activeFile changes
        console.log("Fetching code for file:", activeFile.name);
        const result = await readFileContentAction((activeFile).url);
        setCodeText(result); // This will be empty if the file doesn't exist or cannot be read
        console.log("Fetched code content:", result);
      }

      // Parse data if CSV
      // See: https://www.papaparse.com/docs#local-files
      else if (activeFile !== null && activeFile.type === "sheet" && activeFile.extension === "csv") {

        // Stream big file in worker thread
        console.log("Parsing CSV file:", activeFile.name);

        // Rows need to be any since no schema available
        // Prevent excess sets by using a local array to accumulate rows
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: any[] = [];
        readRemoteFile(activeFile.url, {
          download: true,
          header: true,
          worker: false, // TODO: See if this can be true when not using public folder for file storage (it must be false for now)
          step: (row: ParseStepResult<unknown>) => { // Row-by-row callback to not load entire file into memory
            console.log("Parsed row:", row.data);
            rows.push(row.data);
          },
          complete: () => {
            console.log("CSV parsing complete:", rows.length, "rows parsed.");

            // Since first row of CSV is always just headers, remove it from data
            const data = rows.slice(1); // JS version of rows[1:]
            setSheetData(data);
            
            // Set columns for data table
            const columns = getTableHeaders(rows);

            setSheeTableColumns(columns);
            console.log("CSV table columns set:", columns);
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          error: (error: any) => {
            console.error("Error parsing CSV file:", error);
            setSheetParseError(true);
          }
        });
      }
      // Parse data if XLSX
      else if (activeFile !== null && activeFile.type === "sheet" && activeFile.extension === "xlsx") {
      //  const response = await fetch(`/api/parseSpreadSheet?path=${encodeURIComponent((activeFile).url)}`);
        const result = await parseSpreadsheetAction((activeFile).url);
        if (result !== "") {
          console.log("XLSX parsing result:", result);
          setSheetData(result);

          // Set columns for data table
          const columns = getTableHeaders(result);

          setSheeTableColumns(columns);
          console.log("XLSX table columns set:", columns);
        } else {
          console.error("Error fetching XLSX data:");
          setSheetParseError(true);
      }
      }
      
    };
    void getData();
  }, [activeFile, readRemoteFile]);
  
  if (activeFile?.type === "code") {
    console.log("Code text:", codeText);
    code = [
      {
        language: activeFile.extension,
        filename: activeFile.name,
        code: codeText,
      }
    ]
  }

  const [fileExists, setFileExists] = useState(true);

  // Check if file exists for preview
  useEffect(() => {
    const checkFileExists = async () => {
      if (activeFile) {
        const exists = await checkFileExistsAction((activeFile as FileItem).url);
        setFileExists(exists);
      }
    };

    void checkFileExists();
  }, [activeFile]);

    return (
        <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
          <DialogContent className="sm:max-w-[600px] md:max-w-[70vw] md:min-h-[65vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {getFileIcon(activeFile?.type ?? "other")}
                <span className="ml-2">{activeFile?.name}</span>
              </DialogTitle>
            </DialogHeader>

            {activeFile?.type === "image" ? (
              // Need relative here or image will fill the grandparent div
              <div className="w-full h-[60vh] bg-muted rounded-md flex items-center justify-center relative overflow-hidden">
                {fileExists ? (
                  <Image
                  src={activeFile.url}
                  alt={activeFile.name}
                  fill
                  sizes="(min-width: 808px) 50vw, 100vw"
                  style={{
                    // The image will be scaled down to fit the container and preserve aspect ratio.
                    // See: https://nextjs.org/docs/app/api-reference/components/image#other-props
                    objectFit: 'contain', 
                  }}
                  className="rounded-md"
                />
                ) : (
                  <ImageIcon size="lg" />
                )}
              </div>
            ) : activeFile?.type === "pdf" ? (
              <div className="w-full h-[70vh] bg-muted rounded-md flex items-center justify-center">
                {!fileExists ? (
                  // Fallback PDF icon
                  <>
                    <PDFIcon size="lg" />
                  </>
                  
                ) : (
                  // w-full and h-full to fill parent div
                  <iframe src={activeFile.url} className="w-full h-full"/>
                )}
                
              </div>
            ) : activeFile?.type === "audio" ? (
                <>
              {!fileExists ? (
                // Fallback audio icon
                <div className="w-full h-[60vh] bg-muted rounded-md flex items-center justify-center">
                  <AudioIcon size="lg" />
                </div>
              ) : 
              // See: https://www.diceui.com/docs/components/media-player#audio-player
              <MediaPlayer>
                <MediaPlayerAudio className="sr-only">
                  <source src={activeFileUrl} type="audio/mp3" />
                </MediaPlayerAudio>
                <MediaPlayerControls className="flex-col items-start gap-2.5">
                  <MediaPlayerSeek withTime />
                  <div className="flex w-full items-center justify-center gap-2">
                    <MediaPlayerSeekBackward />
                    <MediaPlayerPlay />
                    <MediaPlayerSeekForward />
                    <MediaPlayerVolume />
                    <MediaPlayerPlaybackSpeed />
                    <MediaPlayerLoop />
                  </div>
                </MediaPlayerControls>
              </MediaPlayer>
              }
                </>
              
            ): activeFile?.type === "video" ? (
              <>
              {!fileExists ? (
                // Fallback video icon
                <div className="w-full h-[60vh] bg-muted rounded-md flex items-center justify-center">
                  <VideoIcon size="lg" />
                </div>
              ) :
              // See: https://www.diceui.com/docs/components/media-player#installation
              // No PiP (picture-in-picture) b/c browsers (at least Firefox) overlay their own button on videos
              <MediaPlayer>
                <MediaPlayerVideo>
                  <source src={activeFileUrl} type="video/mp4" />
                </MediaPlayerVideo>
                <MediaPlayerControls className="flex-col items-start gap-2.5">
                  <MediaPlayerControlsOverlay />
                  <MediaPlayerSeek />
                  <div className="flex w-full items-center gap-2">
                    <div className="flex flex-1 items-center gap-2">
                      <MediaPlayerPlay />
                      <MediaPlayerSeekBackward />
                      <MediaPlayerSeekForward />
                      <MediaPlayerVolume expandable/>
                      <MediaPlayerTime />
                    </div>
                    <div className="flex items-center gap-2">
                      <MediaPlayerPlaybackSpeed />
                      <MediaPlayerFullscreen />
                    </div>
                  </div>
                </MediaPlayerControls>
              </MediaPlayer>
              }
              </>
            ): activeFile?.type === "document" ? (
              <div className="w-full h-[60vh] bg-muted rounded-md flex items-center justify-center">
                {/* TODO: Add docx preview support. Currently, the fallback is rendered */}
                {!fileExists || activeFile.extension === "docx" ? (
                  // Fallback file icon
                  <>
                    <TextIcon size="lg" />
                  </>
                ) : (
                  <iframe src={(activeFile)?.url} className="w-full h-full"/>
                )}
                
              </div>
            ) : activeFile?.type === "code" ? (
              <div className="w-full h-[70vh] bg-muted rounded-md flex items-center justify-center">
                {!fileExists ? (
                  // Fallback file icon
                  <>
                    <CodeIcon size="lg" />
                  </>
                ) : (
                  // See: https://www.kibo-ui.com/components/code-block#installation
                  <CodeBlock data={code} defaultValue={code[0]?.language}>
                    <CodeBlockHeader>
                      <CodeBlockFiles>
                        {(item) => (
                          <CodeBlockFilename key={item.language} value={item.language}>{item.filename}</CodeBlockFilename>
                        )}
                      </CodeBlockFiles>
                    <CodeBlockSelect>
                      <CodeBlockSelectTrigger>
                        <CodeBlockSelectValue />
                      </CodeBlockSelectTrigger>
                      <CodeBlockSelectContent>
                        {(item) => (
                          <CodeBlockSelectItem key={item.language} value={item.language}>
                            {item.language}
                          </CodeBlockSelectItem>
                        )}
                      </CodeBlockSelectContent>
                    </CodeBlockSelect>
                    <CodeBlockCopyButton
                      onCopy={() => toast.success("Code copied to clipboard")}
                      onError={() => toast.error("Failed to copy code to clipboard")}
                    />
                    </CodeBlockHeader>
                    <CodeBlockBody>
                      {(item) => (
                        <CodeBlockItem key={item.language} value={item.language}>
                          <CodeBlockContent language={item.language as BundledLanguage}>{item.code}</CodeBlockContent>
                        </CodeBlockItem>
                      )}
                    </CodeBlockBody>
                  </CodeBlock>
                )}
                
              </div> ) : activeFile?.type === "sheet" ? (
                <div className="w-full h-[65vh] bg-muted rounded-md flex items-center justify-center">
                  {activeFile.extension === "csv" || activeFile.extension === "xlsx" && !sheetParseError ? ( 
                  // Use 95% width so there is some padding around the table
                  // mt-4 is so view button is not at the very top edge
                  <div className="w-[95%] h-full mt-4 overflow-auto">
                    {/* Use table for CSV preview */}
                    {/* See: https://ui.shadcn.com/docs/components/data-table#render-the-table */}
                    <DataTable columns={sheetTableColumns} data={sheetData} />
                  </div>
                  ) : (
                    // Fallback sheet icon
                    <SheetIcon size="lg" />
                  )}
                </div>
                ) : (
                <div className="w-full h-[60vh] bg-muted rounded-md flex items-center justify-center">
                  <GenericFileIcon size="lg" />
                </div>
                )}

            <div className="flex justify-between items-center">
              <div>
                <Badge variant="outline" className="mr-2">
                  {/* Active File can be null, so leave the question or there will be runtime error */}
                  {(activeFile as FileItem)?.size || "Unknown size"}
                </Badge>
                <Badge variant="outline">{formatDate(activeFile?.modified ?? new Date())}</Badge>
              </div>

              <Button onClick={() => setPreviewModalOpen(false)}>Close</Button>
            </div>
          </DialogContent>
      </Dialog>
    )
}