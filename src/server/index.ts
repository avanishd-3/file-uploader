import { env } from "@/env";
// Project will not build if any env var is missing, so no need for extra checks here
// Upload dir also has a default value in env.js

export const uploadDir: string = env.UPLOAD_DIR;