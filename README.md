# File-Uploader

Set-and-forget community file uploading service. Deploy at your url, and let others upload and download files.

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## Technologies

- [Next.js](https://nextjs.org)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com/)

### Components

Most of the components in src/components/ui are from [shadcn/ui](https://ui.shadcn.com/).

The file dropzone, audio player, and video player are from [Dice UI](https://www.diceui.com/).

The code preview is from [Kibo UI](https://www.kibo-ui.com/components/code-block#installation).


The typewriter effect is from the [shadcn.io](https://www.shadcn.io/text/typing-text#api-reference).

### Architecture

PostreSQL DB stores file and folder metadata, while the files are stored server-side. 

The backend is Next.js API routes and Server Actions. The API routes are for handling uploads and downloads, and the server actions are for CRUD operations on DB.

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
