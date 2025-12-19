import "server-only";

import fs from 'fs';
import path from 'path';
import fsPromises from 'fs/promises';

import { NextResponse } from 'next/server';
import { getFileExtension, getMimeType } from "@/lib/utils/utils";

/* These utils are only for server-side use */

// Node.js specific implementation below
// See: https://www.ericburel.tech/blog/nextjs-stream-files

// This is to convert Node.js ReadStream to Web platform ReadableStream
export function streamFile(filePath: string, options?: { start?: number; end?: number }) : ReadableStream {
    const nodeStream = fs.createReadStream(filePath, options);
    const data: ReadableStream = iteratorToStream(nodeStreamtoIterator(nodeStream));
    return data;
}

export async function* nodeStreamtoIterator(stream: fs.ReadStream) {
    for await (const chunk of stream) { // Read file 1 chunk at a time
        yield new Uint8Array(chunk); 
    }
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function iteratorToStream(iterator: AsyncGenerator<Uint8Array<any>, void, unknown>): ReadableStream {
    return new ReadableStream({
        async pull(controller) {
            const { value, done } = await iterator.next();
            if (done) {
                controller.close();
            } else {
                controller.enqueue(value);
            }
        }
    });
}


export async function getStreamResponseForFile(req: Request, purpose: "download" | "preview"): Promise<Response> {
    /**
     * @param req - The incoming request object
     * @param purpose - "download" for file download, "preview" for file preview
     * @description Create a Web stream response for the requested file, with support for range requests for previews of audio and video.
     * This does not handle multiple ranges, but that should be fine.
     * This cannot be rewritten to server action since the frontend needs a URL for the file and Next.js cannot deserialize streams.
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

        // For parsing and content length, see: https://cri.dev/posts/2025-06-18-how-to-http-range-requests-video-nodejs/

        // Parse range request header for partial content (for video/audio seeking)
        const range = req.headers.get('range');
        const options: { start: number | undefined; end: number | undefined } = {
            start: undefined,
            end: undefined,
        };
        if (range && purpose === "preview") {
            const bytesPrefix = "bytes=";
            if (range.startsWith(bytesPrefix)) {
                const bytesRange = range.substring(bytesPrefix.length);
                const parts = bytesRange.split("-");
                if (parts.length === 2) {
                    const rangeStart = parts[0]?.trim();
                    if (rangeStart && rangeStart.length > 0) {
                        options.start = parseInt(rangeStart);
                    }
                    const rangeEnd = parts[1]?.trim();
                    if (rangeEnd && rangeEnd.length > 0) {
                        options.end = parseInt(rangeEnd);
                    }
                }
            }
        }

        // Calculate content length
        const contentLengthInt = stats.size;
        let retrievedLength = contentLengthInt;
        if (options.start !== undefined && options.end !== undefined) {
            retrievedLength = options.end - options.start + 1;
        } else if (options.start !== undefined) {
            retrievedLength = contentLengthInt - options.start;
        }
    
        // Determine the content type based on the file extension
        const extension = getFileExtension(absolutePath);
        const mimeType = getMimeType(extension);
    
        const webStream: ReadableStream = streamFile(absolutePath, options);

        // Set content disposition based on purpose
        const contentDisposition = purpose === "download" ? `attachment; filename="${path.basename(absolutePath)}"` : "inline";
        
        const mimeTypeBeginsWith = mimeType.split('/')[0];

        if (purpose === "preview" && (mimeTypeBeginsWith === "video" || mimeTypeBeginsWith === "audio")) {
            // Validate range only for audio and video previews
            // CSV previews break if you try to validate range for them

            console.log("Requested range:", options);
            if (options.start !== undefined && (options.start >= contentLengthInt || options.start < 0)) {
                // Start is too large or negative
                return new Response(null, {
                    status: 416,
                    headers: {
                        "Content-Range": `bytes */${contentLengthInt}`,
                    },
                });
            }
            if (options.end !== undefined && (options.end >= contentLengthInt || options.end < options.start!)) {
                // End is too large or before start
                return new Response(null, {
                    status: 416,
                    headers: {
                        "Content-Range": `bytes */${contentLengthInt}`,
                    },
                });
            }

            // For video & audio previews, return 

            // If it's a HEAD request, return only headers
            if (req.method === "HEAD") {
                return new Response(null, {
                    status: 200,
                    headers: new Headers({
                        "content-disposition": contentDisposition,
                        "content-type": mimeType,
                        "content-length": stats.size.toString(),
                        "accept-ranges": "bytes",
                    }),
                });
            }

            // Content range header tells client the file size
            // If you don't include this, the video previews will update the length on every new chunk received
            // Content-range ensures it knows the full length from the start

            // Need to include accept-ranges for clients to recognize partial content support
            // 206 response tells client that this is partial content
            return new Response(webStream, {
                status: (options.start !== undefined || options.end !== undefined) ? 206 : 200,
                headers: new Headers({
                    "content-range": `bytes ${options.start ?? 0}-${options.end ?? (contentLengthInt - 1)}/${contentLengthInt}`,
                    "content-disposition": contentDisposition,
                    "content-type": mimeType,
                    "content-length": retrievedLength.toString(),
                    "accept-ranges": "bytes",
                }),
            });
        }
        else {
            // All downloads must be in here
            return new Response(webStream, {
                status: 200,
                headers: new Headers({
                    "content-disposition": contentDisposition,
                    "content-type": mimeType,
                    "content-length": contentLengthInt.toString(),
                }),
            });
        }
        
    }