import fs from 'fs'
import path from 'path'

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // Disable static generation for this route

// TODO -> Use Supabase Storage or S3 for file uploads in production
export async function POST(req: Request) {

    const uploadDir = path.join(process.cwd(), 'public', 'uploads') // Ensure that /public/uploads exists

    // Create the upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
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
    const filePath = path.join(uploadDir, file.name); // Use original filename for simplicity
    fs.writeFileSync(filePath, buffer);

    // Return the file path or URL as needed
    return NextResponse.json({
        message: 'File uploaded successfully',
        filePath: `/uploads/${file.name}`, // Return the URL to access the file
    }, { status: 200 });
}