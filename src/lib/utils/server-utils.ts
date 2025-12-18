import "server-only";

import fs from 'fs';
import path from 'path';
import fsPromises from 'fs/promises';

import { NextResponse } from 'next/server';
import { getFileExtension, getMimeType } from "@/lib/utils/utils";


/* These utils are only for server-side use */

export function convertNodeReadStreamToWebStream(nodeStream: NodeJS.ReadableStream) {
    return new ReadableStream({
        start(controller) {
            nodeStream.on('data', (chunk) => {
                controller.enqueue(chunk);
            });
            nodeStream.on('end', () => {
                controller.close();
            });
            nodeStream.on('error', (err) => {
                controller.error(err);
            });
        }
    });
}


export async function getStreamResponseForFile(req: Request, purpose: "download" | "preview"): Promise<Response> {
    /**
     * @param req - The incoming request object
     * @param purpose - "download" for file download, "preview" for file preview
     * @description Create a Web stream response for the requested file
     * This cannot be rewritten to server action since the frontend needs a URL for the file
     * Also, Next.js cannot deserialize streams
     * @returns A Response object streaming the requested file
     */
    // TODO: Support S3 buckets
        const { searchParams } = new URL(req.url);
        const filePath = searchParams.get('path');
    
        if (!filePath) {
            return NextResponse.json({ error: 'filePath query parameter is required' }, { status: 400 });
        }
    
        // Do not allow directory traversal attacks
        if (filePath.includes('..')) {
            return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
        }
    
        const absolutePath = path.join(process.cwd(), filePath);
    
        // Check if the file exists
        const stats = await fsPromises.stat(absolutePath).catch(() => null);
        if (!stats?.isFile()) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
    
        // Determine the content type based on the file extension
        const extension = getFileExtension(absolutePath);
        const mimeType = getMimeType(extension);
    
        // Stream file to client
        const nodeStream: fs.ReadStream = fs.createReadStream(absolutePath);
    
        // Convert Node.js stream to web ReadableStream
        const webStream = convertNodeReadStreamToWebStream(nodeStream);

        // Set content disposition based on purpose
        const contentDisposition = purpose === "download" ? `attachment; filename="${path.basename(absolutePath)}"` : "inline";
        
        return new Response(webStream, {
            status: 200,
            headers: new Headers({
                "content-disposition": contentDisposition,
                "content-type": mimeType,
                "content-length": stats.size.toString(),
            }),
        });
    }