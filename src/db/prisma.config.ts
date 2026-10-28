import { fileURLToPath } from "node:url";
import { config as loadEnvironment } from "dotenv";
import { defineConfig, env } from "prisma/config";

// the .env file lives at the repository root, shared by every package
loadEnvironment({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        // the cli needs a direct (non pooled) connection to run migrations
        url: env("DATABASE_URL"),
    },
});