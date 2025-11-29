import "server-only";

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