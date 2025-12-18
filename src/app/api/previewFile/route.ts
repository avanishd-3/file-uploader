import { getStreamResponseForFile } from '@/lib/utils/server-utils';

export const dynamic = 'force-dynamic'; // Disable static generation for this route

export async function GET(req: Request) {
    return getStreamResponseForFile(req, "preview");
}