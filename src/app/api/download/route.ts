import fs from 'fs';
import path from 'path';
import fsPromises from 'fs/promises';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Disable static generation for this route

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('filePath');

    if (!filePath) {
        return NextResponse.json({ error: 'filePath query parameter is required' }, { status: 400 });
    }

    // Do not allow directory traversal attacks
    if (filePath.includes('..')) {
        return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // TODO: Switch to S3 bucket url
    const absolutePath = path.join(process.cwd(), 'public', filePath);

    // Check if the file exists
    const stats = await fsPromises.stat(absolutePath).catch(() => null);
    if (!stats || !stats.isFile()) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(absolutePath);

    // Determine the content type based on the file extension
    const extension = path.extname(absolutePath).toLowerCase();
    let contentType = 'application/octet-stream'; // Default content type

    switch (extension) {
        case '.jpg':
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.gif':
            contentType = 'image/gif';
            break;
        case '.svg':
            contentType = 'image/svg+xml';
            break;
        case '.pdf':
            contentType = 'application/pdf';
            break;
        case '.txt':
            contentType = 'text/plain';
            break;
        case '.html':
            contentType = 'text/html';
            break;
        // Add more cases as needed
    }

    // Stream file to client
    const stream: ReadableStream = streamFile(absolutePath);
    return new Response(stream, {
        status: 200,
        headers: new Headers({
            "content-disposition": `attachment; filename="${path.basename(absolutePath)}"`,
            "content-type": contentType,
            "content-length": stats.size.toString(),
        }),
    });
}

// Node.js specific implementation below
// See: https://www.ericburel.tech/blog/nextjs-stream-files

// This is to convert Node.js ReadStream to Web platform ReadableStream
export function streamFile(filePath: string) : ReadableStream {
    const nodeStream = fs.createReadStream(filePath);
    const data: ReadableStream = iteratorToStream(nodeStreamtoIterator(nodeStream));
    return data;
}

async function* nodeStreamtoIterator(stream: fs.ReadStream) {
    for await (const chunk of stream) { // Read file 1 chunk at a time
        yield new Uint8Array(chunk); 
    }
}


function iteratorToStream(iterator: AsyncGenerator<Uint8Array>) {
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