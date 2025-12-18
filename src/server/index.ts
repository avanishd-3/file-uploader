import { env } from "@/env";
// Project will not build if any env var is missing, so no need for extra checks here
// Upload dir also has a default value in env.js

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const uploadDir: string = env.UPLOAD_DIR;