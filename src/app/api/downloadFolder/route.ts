import path from 'path';
import fsPromises from 'fs/promises';
import jszip from 'jszip';

import { NextResponse } from 'next/server';
import { getFilesByParentNameAction } from '@/lib/actions/file-actions';
import { convertNodeReadStreamToWebStream } from '@/lib/utils/server-utils';

export const dynamic = 'force-dynamic'; // Disable static generation for this route

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const folderPath = searchParams.get('path');

    if (!folderPath) {
        return NextResponse.json({ error: 'folderPath query parameter is required' }, { status: 400 });
    }

    // Do not allow directory traversal attacks
    if (folderPath.includes('..')) {
        return NextResponse.json({ error: 'Invalid folder path' }, { status: 400 });
    }

    // Get files from DB based on folderPath
    const files = await getFilesByParentNameAction(folderPath);

    // Use JSZip to create a zip file
    const zip = new jszip();

    zip.folder(folderPath);

    for (const file of files) {
        // TODO: Support S3 bucket url
        const fileAbsolutePath = path.join(process.cwd(), file.url);

        // Check if the file exists
        const stats = await fsPromises.stat(fileAbsolutePath).catch(() => null);
        if (!stats?.isFile()) {
            continue; // Skip non-existing files
        }

        // Read the file content (should be async to be fast)
        const fileData = await fsPromises.readFile(fileAbsolutePath);

        // Add file to zip
        zip.file(path.join(folderPath, file.name), fileData);
    }

    // Stream to client
    const nodeStream = zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true });

    // Convert Node.js stream to web ReadableStream
    const webStream = convertNodeReadStreamToWebStream(nodeStream);

    console.log(`Downloading folder: ${folderPath}`);

    return new Response(webStream, {
        status: 200,
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename=${folderPath}.zip`,
        },
    });
}