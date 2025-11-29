import fs from 'fs';
import path from 'path';
import fsPromises from 'fs/promises';

import { NextResponse } from 'next/server';
import { convertNodeReadStreamToWebStream } from '@/lib/utils/server-utils';

export const dynamic = 'force-dynamic'; // Disable static generation for this route

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');

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
    if (!stats?.isFile()) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

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
    const nodeStream: fs.ReadStream = fs.createReadStream(absolutePath);

    // Convert Node.js stream to web ReadableStream
    const webStream = convertNodeReadStreamToWebStream(nodeStream);
    return new Response(webStream, {
        status: 200,
        headers: new Headers({
            "content-disposition": `attachment; filename="${path.basename(absolutePath)}"`,
            "content-type": contentType,
            "content-length": stats.size.toString(),
        }),
    });
}