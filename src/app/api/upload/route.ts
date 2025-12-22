import fs from 'fs'
import path from 'path'

import { uploadDir } from '@/server'

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // Disable static generation for this route

export async function POST(req: Request) {
    // TODO: Support S3 bucket uploads

    const absoluteUploadDir = path.join(process.cwd(), uploadDir) // Ensure upload directory exists

    // Create the upload directory if it doesn't exist
    if (!fs.existsSync(absoluteUploadDir)) {
        fs.mkdirSync(absoluteUploadDir, { recursive: true })
    }

    // Cannot use formidable b/c Next.js app router receives Web API requests
    // Probably need an adapter for formidable to work with Next.js app router

    // But this is easier
    const form = await req.formData();
    const file = form.get('file') as File;

    // This is a file upload service, so we expect a file to be uploaded
    // Also allow any file type to be uploaded
    if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert File to Buffer so it can be saved to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save the file to the upload directory
    const fileName = file.name.split('/').pop(); // Get the original file name
    if (!fileName) {
        return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
    }
    const filePath = path.join(absoluteUploadDir, fileName); // Use original filename for simplicity
    try {
        fs.writeFileSync(filePath, buffer);
    } catch (error) {
        console.error('Error saving file:', error);
        return NextResponse.json({ error: 'Error saving file' }, { status: 500 });
    }

    // Return the file path or URL as needed
    return NextResponse.json({
        message: 'File uploaded successfully',
        filePath: `/uploads/${fileName}`, // Return the URL to access the file
    }, { status: 200 });
}