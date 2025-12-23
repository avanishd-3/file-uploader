import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeShiki from '@shikijs/rehype'
import rehypeStringify from 'rehype-stringify'
import path from 'path'
import fsPromises from "fs/promises";


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
     * Parsing idea is from https://glama.ai/blog/2024-10-21-rendering-markdown-in-react
     * But doing this is super slow on client, even with memoization. Better to do server-side rendering, since we need to read the file anyway.
     * This approach is probably also faster than web workers, and it avoids having to deal with sharing data between client and worker.
     */

    // TODO: Support mermaid diagrams
    // Tried rehype-mermaid but it didn't work. 
    const file = await unified()
        .use(remarkParse)
        .use(remarkGfm) // GitHub Flavored Markdown (adds footnotes, strikethrough, tables, tasklists and URLs)
        .use(remarkMath) // Support for LaTeX math syntax
        .use(remarkRehype) // Convert to rehype (HTML) AST
        .use(rehypeKatex) // Render LaTeX math expressions
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        .use(rehypeShiki, { theme: 'github-dark-default' }) // Syntax highlighting for code blocks. Theme must be provided or parsing will fail
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        .use(rehypeStringify) // Need to include this to convert to HTML or it will have TypeError: Cannot `process` without `compiler`
        .process(text)

    console.log('Processed markdown to HTML');

    return new Response(String(file), {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
        },
    })
}