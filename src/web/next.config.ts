import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

const repositoryRoot = path.join(process.cwd(), "..", "..");

// local development reads DATABASE_URL from the root .env shared with prisma; on vercel the variable is already set and wins
if (existsSync(path.join(repositoryRoot, ".env"))) {
    process.loadEnvFile(path.join(repositoryRoot, ".env"));
}

const nextConfig: NextConfig = {
    // standalone output keeps the app portable to any docker host, see ARCHITECTURE.md
    output: "standalone",
    outputFileTracingRoot: repositoryRoot,
    transpilePackages: ["@polar/db"],
    images: {
        // official deputy photos published by the Câmara
        remotePatterns: [{ protocol: "https", hostname: "www.camara.leg.br", pathname: "/internet/deputado/bandep/**" }],
        // photos rarely change, a long cache keeps the image optimization quota low
        minimumCacheTTL: 2678400,
    },
    sassOptions: {
        // lets component modules write @use "mixins" instead of relative paths
        loadPaths: [path.join(process.cwd(), "src", "styles")],
    },
};

export default nextConfig;