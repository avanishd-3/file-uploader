import path from 'path'
import fsPromises from "fs/promises";

import { markdownToHtml } from "satteri";
import expressiveCode from "satteri-expressive-code";

import { katexPlugin } from "./katex-plugin";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url') ?? ''

    const fullPath = path.join(process.cwd(), url);

    let text: string;

    try {
        console.log("Reading file from path:", fullPath);
        text = await fsPromises.readFile(fullPath, 'utf-8');
        console.log("File content read successfully.");
    } catch (error) {
        console.error("Error reading file:", error);
        return new Response("Error reading file", { status: 500 });
    }
    
    /**
     * Parsing with Satteri, which is a Rust-based Markdown parser much faster than the JS-based remark/rehype
     * Switched b/c Astro 7.0 switched to it as the default
     * Couldn't get WASM to work w/ Next.js, so keeping it server-side for now.
     */

    // TODO: Get WASM to work
    // TODO: Support mermaid diagrams 

    const { html } = await markdownToHtml(text, {
        features: {
            gfm: true, // Github flavored markdown (replaces remarkGfm)
            math: true, // Support for LaTeX math syntax (replaces remarkMath)
            frontmatter: false, // So users can see their frontmatter
        },
        mdastPlugins: [katexPlugin()],
        hastPlugins: [expressiveCode({ themes: ["github-dark", "github-light"] })], // Syntax highlighting for code blocks
    });

    console.log('Processed markdown to HTML');

    return new Response(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
        },
    })
}