import path from "node:path";
import type { NextConfig } from "next";

const repositoryRoot = path.join(process.cwd(), "..", "..");

const nextConfig: NextConfig = {
    // standalone output keeps the app portable to any docker host, see ARCHITECTURE.md
    output: "standalone",
    outputFileTracingRoot: repositoryRoot,
    transpilePackages: ["@polar/db"],
    sassOptions: {
        // lets component modules write @use "mixins" instead of relative paths
        loadPaths: [path.join(process.cwd(), "src", "styles")],
    },
};

export default nextConfig;