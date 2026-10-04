const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const isGitHubPages = process.env.GITHUB_PAGES === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isGitHubPages ? { output: "export" } : {}),
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  ...(isGitHubPages
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/hero-webp/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ];
        },
      }),
};

module.exports = nextConfig;
